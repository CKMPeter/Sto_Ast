/**
 * useCallGroup.js — WebRTC group call hook
 *
 * KIẾN TRÚC: giống useCall.js
 *  - Mỗi cặp (currentUser ↔ member) có 1 RTCPeerConnection riêng
 *  - Firebase schema per-pair (roomKey = sort([uid1,uid2]).join("_")):
 *      groupCalls/{roomKey}/offer          — caller ghi
 *      groupCalls/{roomKey}/answer         — callee ghi
 *      groupCalls/{roomKey}/callerIce      — caller ghi
 *      groupCalls/{roomKey}/calleeIce      — callee ghi
 *      groupCalls/{roomKey}/signal         — "rejected" | "ended"
 *  - Notification chung cho cả group:
 *      groupCallInvite/{groupId}/{callerId} — caller ghi để notify tất cả members
 *
 * Flow:
 *  1. Caller bấm "Call Group"
 *     → ghi invite vào groupCallInvite/{groupId}
 *     → tạo peer + offer với từng member
 *  2. Member nhận thấy invite → hiện popup
 *  3. Member accept → tạo peer + answer với caller
 *     (member-member connect sau khi đều đã join)
 *  4. Ai end → signal "ended" tới tất cả
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDatabase,
  onValue,
  off,
  ref,
  remove,
  set,
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
  const [callState, setCallState]       = useState(null); // null | "calling" | "incoming" | "active"
  const [incomingCall, setIncomingCall] = useState(null); // { groupId, groupName, callerId, callerName }
  const [localStream, setLocalStream]   = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});  // { uid: MediaStream }

  // ─── REFS ────────────────────────────────────────────────────────────────
  const localRef      = useRef(null);   // MediaStream
  const peersRef      = useRef({});     // { uid: RTCPeerConnection }
  const callStateRef  = useRef(null);
  const incomingRef   = useRef(null);
  const activeGroupRef = useRef(null);  // { groupId, members: [{uid,name}] }
  const cleanupRefsRef = useRef([]);    // Firebase refs cần off() khi cleanup

  useEffect(() => { callStateRef.current  = callState;   }, [callState]);
  useEffect(() => { incomingRef.current   = incomingCall; }, [incomingCall]);

  // ─── HELPERS ────────────────────────────────────────────────────────────

  const stopStream = (stream) => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  const closePeer = (uid) => {
    const pc = peersRef.current[uid];
    if (!pc) return;
    pc.ontrack        = null;
    pc.onicecandidate = null;
    pc.close();
    delete peersRef.current[uid];
  };

  const closeAllPeers = () => {
    Object.keys(peersRef.current).forEach(closePeer);
  };

  const fullCleanup = useCallback(() => {
    stopStream(localRef.current);
    localRef.current = null;
    closeAllPeers();
    // Off tất cả listeners tạm thời (ICE/answer per-peer)
    cleanupRefsRef.current.forEach((r) => off(r));
    cleanupRefsRef.current = [];
    setLocalStream(null);
    setRemoteStreams({});
  }, []);

  const resetState = useCallback(() => {
    setCallState(null);
    setIncomingCall(null);
    activeGroupRef.current = null;
  }, []);

  // ─── TẠO PEER VỚI 1 MEMBER (caller side) ────────────────────────────────
  const connectToPeer = useCallback(async (memberUid, stream) => {
    const rk = roomKey(currentUserId, memberUid);

    // Tránh tạo trùng
    if (peersRef.current[memberUid]) return;

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[memberUid] = pc;

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      if (!e.streams[0]) return;
      setRemoteStreams((prev) => ({ ...prev, [memberUid]: e.streams[0] }));
    };

    // Ghi callerIce lên node của member (member sẽ đọc)
    pc.onicecandidate = async (e) => {
      if (!e.candidate) return;
      await set(ref(db, `groupCalls/${rk}/callerIce`), JSON.stringify(e.candidate));
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await set(ref(db, `groupCalls/${rk}/offer`), {
      callerId:   currentUserId,
      offer:      JSON.stringify(offer),
    });

    // Nghe answer từ member
    const answerRef = ref(db, `groupCalls/${rk}/answer`);
    cleanupRefsRef.current.push(answerRef);
    onValue(answerRef, async (snap) => {
      const data = snap.val();
      if (!data || !peersRef.current[memberUid]) return;
      if (peersRef.current[memberUid].currentRemoteDescription) return;
      try {
        await peersRef.current[memberUid].setRemoteDescription(
          new RTCSessionDescription(JSON.parse(data.answer))
        );
        setCallState("active");
      } catch (err) {
        console.error("[group answer]", err);
      }
    });

    // Nghe calleeIce từ member
    const calleeIceRef = ref(db, `groupCalls/${rk}/calleeIce`);
    cleanupRefsRef.current.push(calleeIceRef);
    onValue(calleeIceRef, async (snap) => {
      const data = snap.val();
      if (!data || !peersRef.current[memberUid]) return;
      try {
        await peersRef.current[memberUid].addIceCandidate(
          new RTCIceCandidate(JSON.parse(data))
        );
      } catch (err) {
        console.error("[group calleeIce]", err);
      }
    });

    // Nghe signal từ member
    const signalRef = ref(db, `groupCalls/${rk}/signal`);
    cleanupRefsRef.current.push(signalRef);
    onValue(signalRef, async (snap) => {
      const signal = snap.val();
      if (!signal) return;
      if (signal === "ended" || signal === "rejected") {
        closePeer(memberUid);
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[memberUid];
          return next;
        });
        await remove(ref(db, `groupCalls/${rk}`));
      }
    });

  }, [currentUserId, db]);

  // ─── START GROUP CALL (caller) ───────────────────────────────────────────
  const startGroupCall = useCallback(async (group) => {
    try {
      fullCleanup();

      const members = (group.members || []).filter((m) => {
        const uid = typeof m === "string" ? m : m.uid;
        return uid !== currentUserId;
      });

      if (members.length === 0) return;

      activeGroupRef.current = { groupId: group.id, members };
      setCallState("calling");

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localRef.current = stream;
      setLocalStream(stream);

      // Ghi invite để tất cả members nhận notification
      const callerName = group.members.find((m) => {
        const uid = typeof m === "string" ? m : m.uid;
        return uid === currentUserId;
      });
      await set(ref(db, `groupCallInvite/${group.id}`), {
        callerId:   currentUserId,
        callerName: (typeof callerName === "object" ? callerName.name : null) || currentUserId,
        groupId:    group.id,
        groupName:  group.name || "Group Call",
        timestamp:  Date.now(),
      });

      // Tạo peer connection với từng member
      for (const m of members) {
        const uid = typeof m === "string" ? m : m.uid;
        await connectToPeer(uid, stream);
      }

    } catch (err) {
      console.error("[startGroupCall]", err);
      fullCleanup();
      resetState();
    }
  }, [currentUserId, db, fullCleanup, resetState, connectToPeer]);

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

      const callerId = incoming.callerId;
      const rk = roomKey(currentUserId, callerId);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      peersRef.current[callerId] = pc;

      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      pc.ontrack = (e) => {
        if (!e.streams[0]) return;
        setRemoteStreams((prev) => ({ ...prev, [callerId]: e.streams[0] }));
      };

      // Đọc offer từ Firebase
      const offerSnap = await new Promise((resolve) => {
        const offerRef = ref(db, `groupCalls/${rk}/offer`);
        onValue(offerRef, (snap) => { resolve(snap); }, { onlyOnce: true });
      });

      const offerData = offerSnap.val();
      if (!offerData) throw new Error("Offer not found");

      await pc.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(offerData.offer))
      );

      // Ghi calleeIce lên node của caller
      pc.onicecandidate = async (e) => {
        if (!e.candidate) return;
        await set(ref(db, `groupCalls/${rk}/calleeIce`), JSON.stringify(e.candidate));
      };

      // Nghe callerIce
      const callerIceRef = ref(db, `groupCalls/${rk}/callerIce`);
      cleanupRefsRef.current.push(callerIceRef);
      onValue(callerIceRef, async (snap) => {
        const data = snap.val();
        if (!data || !peersRef.current[callerId]) return;
        try {
          await peersRef.current[callerId].addIceCandidate(
            new RTCIceCandidate(JSON.parse(data))
          );
        } catch (err) {
          console.error("[group callerIce]", err);
        }
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await set(ref(db, `groupCalls/${rk}/answer`), {
        answer: JSON.stringify(answer),
      });

      // Nghe signal từ caller
      const signalRef = ref(db, `groupCalls/${rk}/signal`);
      cleanupRefsRef.current.push(signalRef);
      onValue(signalRef, async (snap) => {
        const signal = snap.val();
        if (!signal) return;
        if (signal === "ended") {
          fullCleanup();
          resetState();
          await remove(ref(db, `groupCalls/${rk}`));
        }
      });

    } catch (err) {
      console.error("[acceptGroupCall]", err);
      fullCleanup();
      resetState();
    }
  }, [currentUserId, db, fullCleanup, resetState]);

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
  const endGroupCall = useCallback(async () => {
    const active = activeGroupRef.current;

    fullCleanup();
    resetState();

    if (active) {
      // Ghi signal "ended" cho tất cả peers
      for (const m of active.members) {
        const uid = typeof m === "string" ? m : m.uid;
        const rk = roomKey(currentUserId, uid);
        await set(ref(db, `groupCalls/${rk}/signal`), "ended");
      }
      // Xóa invite
      await remove(ref(db, `groupCallInvite/${active.groupId}`));
    }

    // Xóa data của mình
    await remove(ref(db, `groupCalls/${currentUserId}`));
  }, [currentUserId, db, fullCleanup, resetState]);

  // ═══════════════════════════════════════════════════════════════════════
  // LISTENER — nghe invite từ bất kỳ group nào mình thuộc về
  // Được gọi từ Message.jsx với danh sách groupIds
  // ═══════════════════════════════════════════════════════════════════════
  const listenGroupInvites = useCallback((groupIds = []) => {
    // Off listeners cũ trước
    groupIds.forEach((groupId) => {
      const inviteRef = ref(db, `groupCallInvite/${groupId}`);
      off(inviteRef);

      onValue(inviteRef, (snap) => {
        const data = snap.val();

        // Không có invite hoặc đang trong call rồi thì bỏ
        if (!data) return;
        if (data.callerId === currentUserId) return; // mình là người gọi
        if (callStateRef.current !== null) return;

        setIncomingCall({
          groupId:    data.groupId,
          groupName:  data.groupName,
          callerId:   data.callerId,
          callerName: data.callerName,
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