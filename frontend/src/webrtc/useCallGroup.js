/**
 * useCallGroup.js — WebRTC group call hook (fixed)
 *
 * KIẾN TRÚC: mesh — mỗi cặp (currentUser ↔ member) có 1 RTCPeerConnection riêng
 *
 * Firebase schema per-pair (roomKey = sort([uid1,uid2]).join("_")):
 *   groupCalls/{roomKey}/offer          — caller ghi
 *   groupCalls/{roomKey}/answer         — callee ghi
 *   groupCalls/{roomKey}/callerIce/{id} — caller push (nhiều candidates)
 *   groupCalls/{roomKey}/calleeIce/{id} — callee push (nhiều candidates)
 *   groupCalls/{roomKey}/signal         — "rejected" | "ended"
 *
 * Notification chung cho cả group:
 *   groupCallInvite/{groupId} — caller ghi (bao gồm members list)
 *
 * BUG ĐÃ FIX:
 *  1. ICE candidates dùng push() thay vì set() — không bị ghi đè
 *  2. onChildAdded() để nghe từng ICE candidate mới
 *  3. acceptGroupCall connect với TẤT CẢ members, không chỉ caller
 *  4. activeGroupRef được set trong cả acceptGroupCall
 *  5. endGroupCall xóa đúng node Firebase
 *  6. Listeners đặt trong useEffect (không tạo trong functions)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDatabase,
  onValue,
  onChildAdded,
  off,
  ref,
  remove,
  set,
  push,
} from "firebase/database";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const roomKey = (a, b) => [a, b].sort().join("_");

export default function useCallGroup(currentUserId) {
  const db = getDatabase();

  // ─── STATE ───────────────────────────────────────────────────────────────
  const [callState, setCallState]        = useState(null); // null | "calling" | "incoming" | "active"
  const [incomingCall, setIncomingCall]  = useState(null); // { groupId, groupName, callerId, callerName, members }
  const [localStream, setLocalStream]    = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});   // { uid: MediaStream }

  // ─── REFS ────────────────────────────────────────────────────────────────
  const localRef        = useRef(null);  // MediaStream
  const peersRef        = useRef({});    // { uid: RTCPeerConnection }
  const callStateRef    = useRef(null);
  const incomingRef     = useRef(null);
  const activeGroupRef  = useRef(null);  // { groupId, members: [{uid, name}] }
  const listenersRef    = useRef([]);    // { fbRef, type, handler } — để off() khi cleanup

  useEffect(() => { callStateRef.current = callState;   }, [callState]);
  useEffect(() => { incomingRef.current  = incomingCall; }, [incomingCall]);

  // ─── HELPERS ─────────────────────────────────────────────────────────────

  const stopStream = (stream) => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  const closePeer = useCallback((uid) => {
    const pc = peersRef.current[uid];
    if (!pc) return;
    pc.ontrack        = null;
    pc.onicecandidate = null;
    pc.close();
    delete peersRef.current[uid];
  }, []);

  const closeAllPeers = useCallback(() => {
    Object.keys(peersRef.current).forEach(closePeer);
  }, [closePeer]);

  // Off và xóa tất cả dynamic listeners đăng ký qua listenersRef
  const clearListeners = useCallback(() => {
    listenersRef.current.forEach(({ fbRef }) => off(fbRef));
    listenersRef.current = [];
  }, []);

  const fullCleanup = useCallback(() => {
    stopStream(localRef.current);
    localRef.current = null;
    closeAllPeers();
    clearListeners();
    setLocalStream(null);
    setRemoteStreams({});
  }, [closeAllPeers, clearListeners]);

  const resetState = useCallback(() => {
    setCallState(null);
    setIncomingCall(null);
    activeGroupRef.current = null;
  }, []);

  // ICE queue: { [peerUid]: RTCIceCandidate[] }
  // Candidates đến trước khi remote description sẵn sàng sẽ được giữ ở đây
  const iceQueuesRef = useRef({});

  // Flush tất cả queued candidates cho 1 peer (gọi sau setRemoteDescription)
  const flushIceQueue = useCallback(async (peerUid) => {
    const pc    = peersRef.current[peerUid];
    const queue = iceQueuesRef.current[peerUid] || [];
    if (!pc || queue.length === 0) return;
    iceQueuesRef.current[peerUid] = [];
    for (const candidate of queue) {
      try {
        await pc.addIceCandidate(candidate);
      } catch (err) {
        console.error(`[flushIceQueue ${peerUid}]`, err);
      }
    }
  }, []);

  // ─── TẠO PEER VỚI 1 MEMBER ──────────────────────────────────────────────
  //
  // isCallerSide = true  → mình là caller  (tạo offer, ghi callerIce, đọc calleeIce)
  // isCallerSide = false → mình là callee  (nhận offer, ghi calleeIce, đọc callerIce)
  //
  const buildPeer = useCallback(async (peerUid, stream, isCallerSide) => {
    if (peersRef.current[peerUid]) return; // tránh tạo trùng

    const rk = roomKey(currentUserId, peerUid);
    const pc  = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[peerUid] = pc;
    iceQueuesRef.current[peerUid] = []; // khởi tạo queue

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    // Tạo MediaStream chung cho peer này, add tracks vào đó
    const remoteStream = new MediaStream();
    setRemoteStreams((prev) => ({ ...prev, [peerUid]: remoteStream }));

    pc.ontrack = (e) => {
      // Add track vào stream đã tạo sẵn (không tạo stream mới mỗi lần)
      e.track.onunmute = () => {
        if (!remoteStream.getTracks().includes(e.track)) {
          remoteStream.addTrack(e.track);
          // Trigger re-render để video component nhận stream mới
          setRemoteStreams((prev) => ({ ...prev, [peerUid]: remoteStream }));
        }
      };
      if (!remoteStream.getTracks().includes(e.track)) {
        remoteStream.addTrack(e.track);
        setRemoteStreams((prev) => ({ ...prev, [peerUid]: remoteStream }));
      }
    };

    // ── ICE: push nhiều candidates, không ghi đè ──────────────────────────
    const myIcePath    = isCallerSide ? "callerIce" : "calleeIce";
    const theirIcePath = isCallerSide ? "calleeIce" : "callerIce";

    pc.onicecandidate = async (e) => {
      if (!e.candidate) return;
      // push() tạo unique key → không bao giờ ghi đè candidate cũ
      await push(ref(db, `groupCalls/${rk}/${myIcePath}`), JSON.stringify(e.candidate));
    };

    // ── Nghe ICE candidates từ phía kia (onChildAdded để nhận từng cái) ───
    const theirIceRef = ref(db, `groupCalls/${rk}/${theirIcePath}`);
    const theirIceHandler = onChildAdded(theirIceRef, async (snap) => {
      const data = snap.val();
      if (!data || !peersRef.current[peerUid]) return;
      const candidate = new RTCIceCandidate(JSON.parse(data));
      const currentPc = peersRef.current[peerUid];
      if (!currentPc.currentRemoteDescription) {
        // Remote description chưa sẵn sàng → queue lại, flush sau
        iceQueuesRef.current[peerUid] = [
          ...(iceQueuesRef.current[peerUid] || []),
          candidate,
        ];
      } else {
        try {
          await currentPc.addIceCandidate(candidate);
        } catch (err) {
          console.error(`[group ICE ${theirIcePath}]`, err);
        }
      }
    });
    listenersRef.current.push({ fbRef: theirIceRef, handler: theirIceHandler });

    // ── Nghe signal từ phía kia ───────────────────────────────────────────
    const signalRef = ref(db, `groupCalls/${rk}/signal`);
    const signalHandler = onValue(signalRef, async (snap) => {
      const signal = snap.val();
      if (!signal) return;

      if (signal === "rejected") {
        // Bị từ chối → tắt toàn bộ (chỉ xảy ra lúc chưa connect)
        fullCleanup();
        resetState();
        await remove(ref(db, `groupCalls/${rk}`));

      } else if (signal === "left") {
        // 1 người rời → chỉ đóng peer với người đó, call vẫn tiếp tục
        closePeer(peerUid);
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[peerUid];
          return next;
        });
        await remove(ref(db, `groupCalls/${rk}`));
        // Không fullCleanup — những peers khác vẫn còn

      } else if (signal === "ended") {
        // Tắt hoàn toàn (host kết thúc call cho tất cả)
        fullCleanup();
        resetState();
        await remove(ref(db, `groupCalls/${rk}`));
      }
    });
    listenersRef.current.push({ fbRef: signalRef, handler: signalHandler });

    if (isCallerSide) {
      // ── CALLER: tạo offer ────────────────────────────────────────────────
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await set(ref(db, `groupCalls/${rk}/offer`), {
        callerId: currentUserId,
        offer:    JSON.stringify(offer),
      });

      // Nghe answer từ callee
      const answerRef = ref(db, `groupCalls/${rk}/answer`);
      const answerHandler = onValue(answerRef, async (snap) => {
        const data = snap.val();
        if (!data || !peersRef.current[peerUid]) return;
        if (peersRef.current[peerUid].currentRemoteDescription) return;
        try {
          await peersRef.current[peerUid].setRemoteDescription(
            new RTCSessionDescription(JSON.parse(data.answer))
          );
          await flushIceQueue(peerUid); // flush ICE candidates đã queue
          setCallState("active");
        } catch (err) {
          console.error("[group answer]", err);
        }
      });
      listenersRef.current.push({ fbRef: answerRef, handler: answerHandler });

    } else {
      // ── CALLEE: chờ offer rồi tạo answer ────────────────────────────────
      // Dùng onValue (không phải onlyOnce) và chờ đến khi offer thực sự có
      // → tránh race condition nếu caller chưa ghi offer kịp
      const offerData = await new Promise((resolve, reject) => {
        const offerRef = ref(db, `groupCalls/${rk}/offer`);
        const timeout  = setTimeout(() => {
          off(offerRef);
          reject(new Error(`Offer timeout for peer ${peerUid}`));
        }, 15000); // chờ tối đa 15 giây

        onValue(offerRef, (snap) => {
          const data = snap.val();
          if (!data) return; // chưa có, tiếp tục chờ
          clearTimeout(timeout);
          off(offerRef);
          resolve(data);
        });
      });

      await pc.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(offerData.offer))
      );
      await flushIceQueue(peerUid); // flush ICE candidates đã queue

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await set(ref(db, `groupCalls/${rk}/answer`), {
        answer: JSON.stringify(answer),
      });
    }
  }, [currentUserId, db, closePeer, fullCleanup, resetState, flushIceQueue]);

  // ─── START GROUP CALL (caller) ───────────────────────────────────────────
  const startGroupCall = useCallback(async (group) => {
    try {
      fullCleanup();

      const members = (group.members || []).filter((m) => {
        const uid = typeof m === "string" ? m : m.uid;
        return uid !== currentUserId;
      });

      if (members.length === 0) return;

      // Normalize members thành array of { uid, name }
      const normalizedMembers = members.map((m) =>
        typeof m === "string" ? { uid: m, name: m } : m
      );

      activeGroupRef.current = { groupId: group.id, members: normalizedMembers };
      setCallState("calling");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localRef.current = stream;
      setLocalStream(stream);

      // Tìm tên của caller trong members list
      const callerMember = (group.members || []).find((m) => {
        const uid = typeof m === "string" ? m : m.uid;
        return uid === currentUserId;
      });
      const callerName =
        (typeof callerMember === "object" ? callerMember?.name : null) || currentUserId;

      // Ghi invite — bao gồm members list để callee biết cần connect với ai
      await set(ref(db, `groupCallInvite/${group.id}`), {
        callerId:    currentUserId,
        callerName:  callerName,
        groupId:     group.id,
        groupName:   group.name || "Group Call",
        timestamp:   Date.now(),
        members:     normalizedMembers, // ← FIX: callee cần biết danh sách này
      });

      // Tạo peer connection (caller side) với từng member
      for (const m of normalizedMembers) {
        await buildPeer(m.uid, stream, true);
      }

    } catch (err) {
      console.error("[startGroupCall]", err);
      fullCleanup();
      resetState();
    }
  }, [currentUserId, db, fullCleanup, resetState, buildPeer]);

  // ─── ACCEPT GROUP CALL (callee) ──────────────────────────────────────────
  const acceptGroupCall = useCallback(async () => {
    const incoming = incomingRef.current;
    if (!incoming) return;

    try {
      setCallState("active");
      setIncomingCall(null);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localRef.current = stream;
      setLocalStream(stream);

      // members trong invite = danh sách các member KHÁC (không có caller, không có mình)
      // vì startGroupCall đã filter bỏ currentUserId (caller) trước khi ghi
      // Callee cần connect với: caller + tất cả member khác (trừ mình)
      const otherMembers = (incoming.members || []).filter(
        (m) => m.uid !== currentUserId && m.uid !== incoming.callerId
      );

      const allPeers = [
        { uid: incoming.callerId, name: incoming.callerName }, // caller luôn đứng đầu
        ...otherMembers,
      ];

      // FIX: set activeGroupRef cho callee để endGroupCall hoạt động đúng
      activeGroupRef.current = {
        groupId: incoming.groupId,
        members: allPeers,
      };

      // FIX: tạo peer với TẤT CẢ peers, không chỉ caller
      for (const peer of allPeers) {
        await buildPeer(peer.uid, stream, false);
      }

    } catch (err) {
      console.error("[acceptGroupCall]", err);
      fullCleanup();
      resetState();
    }
  }, [currentUserId, db, fullCleanup, resetState, buildPeer]);

  // ─── REJECT GROUP CALL ───────────────────────────────────────────────────
  const rejectGroupCall = useCallback(async () => {
    const incoming = incomingRef.current;
    if (!incoming) return;

    const rk = roomKey(currentUserId, incoming.callerId);
    await set(ref(db, `groupCalls/${rk}/signal`), "rejected");
    await remove(ref(db, `groupCallInvite/${incoming.groupId}`));

    setIncomingCall(null);
    setCallState(null);
  }, [currentUserId, db]);

  // ─── END GROUP CALL ──────────────────────────────────────────────────────
  // Ghi signal "left" cho từng peer → peer đó đóng connection với mình
  // nhưng các peer khác vẫn tiếp tục call với nhau (như Google Meet)
  const endGroupCall = useCallback(async () => {
    const active = activeGroupRef.current;

    fullCleanup();
    resetState();

    if (!active) return;

    for (const m of active.members) {
      const uid = typeof m === "string" ? m : m.uid;
      const rk  = roomKey(currentUserId, uid);
      await set(ref(db, `groupCalls/${rk}/signal`), "left");
      await remove(ref(db, `groupCalls/${rk}`));
    }
  }, [currentUserId, db, fullCleanup, resetState]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LISTENER — nghe invite từ bất kỳ group nào mình thuộc về
  // Gọi từ Message.jsx với danh sách groupIds
  // ═══════════════════════════════════════════════════════════════════════════
  const listenGroupInvites = useCallback((groupIds = []) => {
    // Off listeners cũ trước
    groupIds.forEach((groupId) => {
      off(ref(db, `groupCallInvite/${groupId}`));
    });

    groupIds.forEach((groupId) => {
      const inviteRef = ref(db, `groupCallInvite/${groupId}`);

      onValue(inviteRef, async (snap) => {
        const data = snap.val();

        if (!data) return;
        if (data.callerId === currentUserId) return; // mình là người gọi
        if (callStateRef.current !== null) return;   // đang trong call khác

        // Xóa invite NGAY trên Firebase trước khi set state
        // → nếu listener bị off/on lại (re-render), sẽ không fire lần 2
        await remove(ref(db, `groupCallInvite/${groupId}`));

        setIncomingCall({
          groupId:    data.groupId,
          groupName:  data.groupName,
          callerId:   data.callerId,
          callerName: data.callerName,
          members:    data.members || [],
        });
        setCallState("incoming");
      });
    });

    // Trả về cleanup function
    return () => {
      groupIds.forEach((groupId) => {
        off(ref(db, `groupCallInvite/${groupId}`));
      });
    };
  }, [currentUserId, db]);

  return {
    startGroupCall,
    acceptGroupCall,
    rejectGroupCall,
    endGroupCall,
    listenGroupInvites,
    incomingCall,
    callState,
    localStream,
    remoteStreams,
  };
}