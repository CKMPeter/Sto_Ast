/**
 * useCall.js — WebRTC 1-1 call hook
 *
 * KIẾN TRÚC:
 *  - Tất cả Firebase listeners đặt trong useEffect (không tạo listener trong functions)
 *  - Functions chỉ write/remove Firebase + thao tác WebRTC local
 *  - Dùng useRef cho mọi thứ cần đọc bên trong callback (tránh stale closure)
 *
 * Firebase schema:
 *   calls/{userId}/offer          — caller ghi, callee đọc
 *   calls/{userId}/answer         — callee ghi, caller đọc
 *   calls/{userId}/callerIce      — caller ghi ICE, callee đọc
 *   calls/{userId}/calleeIce      — callee ghi ICE, caller đọc
 *   calls/{userId}/signal         — tín hiệu điều khiển: "rejected" | "ended"
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

export default function useCall(currentUserId) {
  const db = getDatabase();

  // ─── STATE (chỉ dùng để trigger re-render UI) ───────────────────────────
  const [callState, setCallState]       = useState(null); // null | "calling" | "incoming" | "active"
  const [incomingCall, setIncomingCall] = useState(null); // { callerId, callerName, offer }
  const [localStream, setLocalStream]   = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // ─── REFS (dùng bên trong callbacks, không bị stale) ────────────────────
  const pcRef           = useRef(null);   // RTCPeerConnection
  const localRef        = useRef(null);   // MediaStream local
  const callStateRef    = useRef(null);   // mirror của callState
  const incomingRef     = useRef(null);   // mirror của incomingCall
  const targetIdRef     = useRef(null);   // uid của người đang gọi/đang gọi tới

  // Sync refs
  useEffect(() => { callStateRef.current  = callState;   }, [callState]);
  useEffect(() => { incomingRef.current   = incomingCall; }, [incomingCall]);

  // ─── HELPERS ────────────────────────────────────────────────────────────

  const stopStream = (stream) => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
  };

  const closePeer = () => {
    if (pcRef.current) {
      pcRef.current.ontrack       = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.close();
      pcRef.current = null;
    }
  };

  const fullCleanup = useCallback(() => {
    stopStream(localRef.current);
    localRef.current = null;
    closePeer();
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const resetState = useCallback(() => {
    setCallState(null);
    setIncomingCall(null);
    targetIdRef.current = null;
  }, []);

  // ─── START CALL (caller) ─────────────────────────────────────────────────
  const startCall = useCallback(async (targetUserId, callerName) => {
    try {
      fullCleanup();
      targetIdRef.current = targetUserId;
      setCallState("calling");

      // 1. Lấy camera/mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localRef.current = stream;
      setLocalStream(stream);

      // 2. Tạo peer
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // 3. Khi nhận track từ callee
      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
        setCallState("active");
      };

      // 4. ICE: ghi lên node của targetUser để callee đọc
      pc.onicecandidate = async (e) => {
        if (!e.candidate) return;
        await set(ref(db, `calls/${targetUserId}/callerIce`), JSON.stringify(e.candidate));
      };

      // 5. Tạo offer và ghi lên Firebase
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await set(ref(db, `calls/${targetUserId}/offer`), {
        callerId:   currentUserId,
        callerName: callerName || currentUserId,
        offer:      JSON.stringify(offer),
      });

    } catch (err) {
      console.error("[startCall]", err);
      fullCleanup();
      resetState();
    }
  }, [currentUserId, db, fullCleanup, resetState]);

  // ─── ACCEPT CALL (callee) ────────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    const incoming = incomingRef.current;
    if (!incoming) { console.warn("[acceptCall] no incomingCall"); return; }

    try {
      // Chuyển state active NGAY để UI mở call screen
      setCallState("active");
      setIncomingCall(null);

      // Set targetIdRef để endCall biết cần signal cho ai (caller)
      targetIdRef.current = incoming.callerId;

      // 1. Lấy camera/mic
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localRef.current = stream;
      setLocalStream(stream);

      // 2. Tạo peer
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // 3. Nhận track từ caller
      pc.ontrack = (e) => setRemoteStream(e.streams[0]);

      // 4. Set remote description từ offer
      await pc.setRemoteDescription(
        new RTCSessionDescription(JSON.parse(incoming.offer))
      );

      // 5. ICE: ghi lên node của caller để caller đọc
      pc.onicecandidate = async (e) => {
        if (!e.candidate) return;
        await set(ref(db, `calls/${incoming.callerId}/calleeIce`), JSON.stringify(e.candidate));
      };

      // 6. Tạo answer và ghi lên Firebase
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await set(ref(db, `calls/${incoming.callerId}/answer`), {
        answer: JSON.stringify(answer),
      });

      // 7. Xóa offer của mình (dọn dẹp) — KHÔNG dùng để báo hiệu nữa
      await remove(ref(db, `calls/${currentUserId}/offer`));
      await remove(ref(db, `calls/${currentUserId}/callerIce`));

    } catch (err) {
      console.error("[acceptCall]", err);
      fullCleanup();
      resetState();
    }
  }, [currentUserId, db, fullCleanup, resetState]);

  // ─── REJECT CALL (callee từ chối) ────────────────────────────────────────
  const rejectCall = useCallback(async () => {
    const incoming = incomingRef.current;
    if (!incoming) return;

    // Ghi signal "rejected" lên node của CALLER để caller biết
    await set(ref(db, `calls/${incoming.callerId}/signal`), "rejected");

    // Xóa offer của mình
    await remove(ref(db, `calls/${currentUserId}`));

    setIncomingCall(null);
    setCallState(null);
  }, [currentUserId, db]);

  // ─── END CALL (cả 2 phía) ────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    const tId = targetIdRef.current;

    fullCleanup();
    resetState();

    // Xóa toàn bộ data của mình
    await remove(ref(db, `calls/${currentUserId}`));

    // Ghi signal "ended" lên node của đối phương
    if (tId) {
      await set(ref(db, `calls/${tId}/signal`), "ended");
    }
  }, [currentUserId, db, fullCleanup, resetState]);

  // ═══════════════════════════════════════════════════════════════════════
  // LISTENERS — tất cả đặt ở đây, không bao giờ tạo trong functions
  // ═══════════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!currentUserId) return;

    const refs = {
      offer:     ref(db, `calls/${currentUserId}/offer`),
      answer:    ref(db, `calls/${currentUserId}/answer`),
      callerIce: ref(db, `calls/${currentUserId}/callerIce`),
      calleeIce: ref(db, `calls/${currentUserId}/calleeIce`),
      signal:    ref(db, `calls/${currentUserId}/signal`),
    };

    // ── 1. Nghe OFFER → có người gọi đến ──────────────────────────────────
    onValue(refs.offer, (snap) => {
      const data = snap.val();
      if (!data) return; // offer bị xóa sau acceptCall, bỏ qua
      // Chỉ set incoming nếu đang idle
      if (callStateRef.current === null) {
        setIncomingCall(data);
        setCallState("incoming");
      }
    });

    // ── 2. Nghe ANSWER → callee đã accept, set remote description ─────────
    onValue(refs.answer, async (snap) => {
      const data = snap.val();
      if (!data) return;
      const pc = pcRef.current;
      if (!pc || pc.currentRemoteDescription) return;
      // Chỉ xử lý khi đang "calling"
      if (callStateRef.current !== "calling") return;
      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(JSON.parse(data.answer))
        );
      } catch (err) {
        console.error("[answer listener]", err);
      }
    });

    // ── 3. Nghe ICE từ CALLER (callee đọc) ───────────────────────────────
    onValue(refs.callerIce, async (snap) => {
      const data = snap.val();
      if (!data || !pcRef.current) return;
      if (callStateRef.current !== "active") return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(data)));
      } catch (err) {
        console.error("[callerIce listener]", err);
      }
    });

    // ── 4. Nghe ICE từ CALLEE (caller đọc) ───────────────────────────────
    onValue(refs.calleeIce, async (snap) => {
      const data = snap.val();
      if (!data || !pcRef.current) return;
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(JSON.parse(data)));
      } catch (err) {
        console.error("[calleeIce listener]", err);
      }
    });

    // ── 5. Nghe SIGNAL → đối phương báo rejected / ended ─────────────────
    onValue(refs.signal, async (snap) => {
      const signal = snap.val();
      if (!signal) return;

      console.log("[signal received]", signal, "| myState:", callStateRef.current);

      if (signal === "rejected") {
        // Callee từ chối → caller dừng lại
        fullCleanup();
        resetState();
        await remove(ref(db, `calls/${currentUserId}`));
      }

      if (signal === "ended") {
        // Đối phương kết thúc cuộc gọi
        fullCleanup();
        resetState();
        await remove(ref(db, `calls/${currentUserId}`));
      }
    });

    return () => {
      Object.values(refs).forEach((r) => off(r));
    };
  }, [currentUserId]); // chỉ re-subscribe khi userId thay đổi

  return {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    incomingCall,
    callState,
    localStream,
    remoteStream,
  };
}