import React, { useRef, useEffect } from "react";
import { useCallContext } from "../contexts/CallContext";

export default function CallModal({ onAccept, onEnd }) {
  const { call, incomingCall } = useCallContext();
  const localRef = useRef();
  const remoteRef = useRef();

  useEffect(() => {
    if (call?.localStream) {
      localRef.current.srcObject = call.localStream;
    }
    if (call?.remoteStream) {
      remoteRef.current.srcObject = call.remoteStream;
    }
  }, [call]);

  return (
    <div className="call-modal">
      {incomingCall && (
        <div>
          <h3>Incoming Call</h3>
          <button onClick={onAccept}>Accept</button>
        </div>
      )}

      {call && (
        <div>
          <video ref={localRef} autoPlay muted width="200" />
          <video ref={remoteRef} autoPlay width="300" />
          <button onClick={onEnd}>End Call</button>
        </div>
      )}
    </div>
  );
}