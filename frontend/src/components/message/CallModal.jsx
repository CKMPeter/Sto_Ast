import React, {
  useEffect,
  useRef,
} from "react";

export default function CallModal({
  localStream,
  remoteStream,
  endCall,
}) {

  const localRef = useRef(null);

  const remoteRef = useRef(null);

  useEffect(() => {

    if (
      localRef.current &&
      localStream
    ) {
      localRef.current.srcObject =
        localStream;
    }

    if (
      remoteRef.current &&
      remoteStream
    ) {
      remoteRef.current.srcObject =
        remoteStream;
    }

  }, [localStream, remoteStream]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
      }}
    >

      <video
        ref={remoteRef}
        autoPlay
        playsInline
        style={{
          width: "70%",
          borderRadius: "20px",
          background: "#000",
        }}
      />

      <video
        ref={localRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "220px",
          position: "absolute",
          right: "20px",
          bottom: "20px",
          borderRadius: "16px",
          background: "#000",
        }}
      />

      <button
        onClick={endCall}
        style={{
          background: "red",
          color: "white",
          border: "none",
          padding: "14px 24px",
          borderRadius: "12px",
          cursor: "pointer",
        }}
      >
        End Call
      </button>

    </div>
  );
}