import React, {
  useRef,
  useEffect,
} from "react";

export default function CallModal({
  localStream,
  remoteStream,
  incomingCall,
  acceptCall,
  endCall,
}) {

  const localRef = useRef(null);
  const remoteRef = useRef(null);

  // LOCAL
  useEffect(() => {

    if (
      localRef.current &&
      localStream
    ) {
      localRef.current.srcObject =
        localStream;
    }

  }, [localStream]);

  // REMOTE
  useEffect(() => {

    if (
      remoteRef.current &&
      remoteStream
    ) {
      remoteRef.current.srcObject =
        remoteStream;
    }

  }, [remoteStream]);

  // IMPORTANT
  if (
    !incomingCall &&
    !localStream &&
    !remoteStream
  ) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <div
        style={{
          background: "#fff",
          padding: "20px",
          borderRadius: "12px",
          minWidth: "720px",
        }}
      >

        {incomingCall && (
          <div
            style={{
              marginBottom: "15px",
            }}
          >
            <h3>Incoming Call</h3>

            <button onClick={acceptCall}>
              Accept
            </button>

            <button onClick={endCall}>
              Reject
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            width="300"
            style={{
              background: "#000",
            }}
          />

          <video
            ref={remoteRef}
            autoPlay
            playsInline
            width="300"
            style={{
              background: "#000",
            }}
          />

        </div>

        <button onClick={endCall}>
          End Call
        </button>

      </div>

    </div>
  );
}