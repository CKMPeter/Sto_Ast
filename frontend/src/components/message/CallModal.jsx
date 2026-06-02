import React, { useEffect, useRef, useState, useCallback } from "react";

// ============================================================
// SHARED — nút tròn dùng chung
// ============================================================
function RoundBtn({ onClick, title, active, children, danger }) {
  const [hover, setHover] = useState(false);
  const bg = danger
    ? "#e53935"
    : active
    ? "rgba(255,255,255,0.18)"
    : "rgba(255,255,255,0.08)";

  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        background: bg,
        border: active && !danger ? "2px solid rgba(255,255,255,0.5)" : "2px solid transparent",
        cursor: "pointer",
        fontSize: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: hover ? "scale(1.1)" : "scale(1)",
        transition: "transform 0.15s, background 0.15s",
        boxShadow: danger ? "0 4px 16px rgba(229,57,53,0.45)" : "none",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ============================================================
// HOOK — tắt/bật mic & cam trên localStream
// ============================================================
function useMediaControls(localStream) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // Reset khi stream thay đổi (call mới)
  useEffect(() => {
    setMicOn(true);
    setCamOn(true);
  }, [localStream]);

  const toggleMic = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMicOn((v) => !v);
  }, [localStream]);

  const toggleCam = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCamOn((v) => !v);
  }, [localStream]);

  return { micOn, camOn, toggleMic, toggleCam };
}

// ============================================================
// INCOMING CALL NOTIFICATION
// ============================================================
export function IncomingCallNotification({ incomingCall, onAccept, onReject }) {
  if (!incomingCall) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "30px",
        right: "30px",
        width: "320px",
        background: "#1a1a2e",
        borderRadius: "20px",
        padding: "20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        animation: "slideIn 0.3s ease",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
      `}</style>

      <div
        style={{
          width: "72px", height: "72px", borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "32px", animation: "pulse 1.5s infinite",
        }}
      >
        📹
      </div>

      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
          {incomingCall.callerName || incomingCall.callerId}
        </div>
        <div style={{ fontSize: "13px", color: "#aaa" }}>Đang gọi video cho bạn...</div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        <RoundBtn onClick={onReject} title="Từ chối" danger>📵</RoundBtn>
        <RoundBtn onClick={onAccept} title="Chấp nhận" active>📞</RoundBtn>
      </div>
    </div>
  );
}

// ============================================================
// 1-1 CALL MODAL
// ============================================================
export default function CallModal({ localStream, remoteStream, onEnd, callerName }) {
  const localRef  = useRef(null);
  const remoteRef = useRef(null);
  const { micOn, camOn, toggleMic, toggleCam } = useMediaControls(localStream);

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#0d0d0d", zIndex: 99999 }}>

      {/* Remote video */}
      <video
        ref={remoteRef} autoPlay playsInline
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#1a1a2e" }}
      />

      {/* Waiting overlay */}
      {!remoteStream && (
        <div style={{
          position: "absolute", inset: 0, background: "#1a1a2e",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", color: "white", gap: "16px",
        }}>
          <div style={{ fontSize: "72px" }}>👤</div>
          <div style={{ fontSize: "20px", fontWeight: 600 }}>{callerName || "Đang kết nối..."}</div>
          <div style={{ color: "#aaa", fontSize: "14px" }}>Đang chờ phản hồi...</div>
        </div>
      )}

      {/* Local video — ẩn khi tắt cam */}
      <video
        ref={localRef} autoPlay muted playsInline
        style={{
          position: "absolute", right: "20px", bottom: "100px",
          width: "160px", height: "110px", objectFit: "cover",
          borderRadius: "16px", border: "2px solid rgba(255,255,255,0.3)",
          background: "#333", zIndex: 2,
          display: camOn ? "block" : "none",
        }}
      />

      {/* Cam off placeholder */}
      {!camOn && (
        <div style={{
          position: "absolute", right: "20px", bottom: "100px",
          width: "160px", height: "110px", borderRadius: "16px",
          background: "#333", zIndex: 2, display: "flex",
          alignItems: "center", justifyContent: "center",
          border: "2px solid rgba(255,255,255,0.15)",
        }}>
          <span style={{ fontSize: "32px" }}>🚫</span>
        </div>
      )}

      {/* Controls */}
      <div style={{
        position: "absolute", bottom: "30px", left: 0, width: "100%",
        display: "flex", justifyContent: "center", gap: "20px", zIndex: 3,
      }}>
        <RoundBtn onClick={toggleMic} title={micOn ? "Tắt mic" : "Bật mic"} active={micOn}>
          {micOn ? "🎤" : "🔇"}
        </RoundBtn>

        <RoundBtn onClick={toggleCam} title={camOn ? "Tắt cam" : "Bật cam"} active={camOn}>
          {camOn ? "📷" : "🚫"}
        </RoundBtn>

        <RoundBtn onClick={onEnd} title="Kết thúc" danger>📵</RoundBtn>
      </div>
    </div>
  );
}