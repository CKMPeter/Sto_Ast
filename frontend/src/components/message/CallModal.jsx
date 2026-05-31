import React, { useEffect, useRef } from "react";

// ============================================================
// INCOMING CALL NOTIFICATION (giống Messenger)
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

      {/* Avatar */}
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          animation: "pulse 1.5s infinite",
        }}
      >
        📹
      </div>

      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px" }}>
          {incomingCall.callerName || incomingCall.callerId}
        </div>
        <div style={{ fontSize: "13px", color: "#aaa" }}>
          Đang gọi video cho bạn...
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px" }}>
        {/* Từ chối */}
        <button
          onClick={onReject}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#e53935",
            border: "none",
            cursor: "pointer",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          title="Từ chối"
        >
          📵
        </button>

        {/* Chấp nhận */}
        <button
          onClick={onAccept}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "#43a047",
            border: "none",
            cursor: "pointer",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          title="Chấp nhận"
        >
          📞
        </button>
      </div>
    </div>
  );
}

// ============================================================
// ACTIVE CALL SCREEN (full screen, giống Messenger)
// ============================================================
export default function CallModal({ localStream, remoteStream, onEnd, callerName }) {
  const localRef  = useRef(null);
  const remoteRef = useRef(null);

  useEffect(() => {
    if (localRef.current && localStream) {
      localRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) {
      remoteRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0d0d0d",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Remote video (lớn, nền) */}
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          background: "#1a1a2e",
        }}
      />

      {/* Overlay mờ nếu chưa có remote stream */}
      {!remoteStream && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#1a1a2e",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            gap: "16px",
          }}
        >
          <div style={{ fontSize: "72px" }}>👤</div>
          <div style={{ fontSize: "20px", fontWeight: 600 }}>
            {callerName || "Đang kết nối..."}
          </div>
          <div style={{ color: "#aaa", fontSize: "14px" }}>
            Đang chờ phản hồi...
          </div>
        </div>
      )}

      {/* Local video (nhỏ, góc phải dưới) */}
      <video
        ref={localRef}
        autoPlay
        muted
        playsInline
        style={{
          position: "absolute",
          right: "20px",
          bottom: "100px",
          width: "160px",
          height: "110px",
          objectFit: "cover",
          borderRadius: "16px",
          border: "2px solid rgba(255,255,255,0.3)",
          background: "#333",
          zIndex: 2,
        }}
      />

      {/* Bottom controls */}
      <div
        style={{
          position: "absolute",
          bottom: "30px",
          display: "flex",
          gap: "24px",
          zIndex: 3,
        }}
      >
        <button
          onClick={onEnd}
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "#e53935",
            border: "none",
            cursor: "pointer",
            fontSize: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(229,57,53,0.5)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          title="Kết thúc cuộc gọi"
        >
          📵
        </button>
      </div>
    </div>
  );
}
