import { useEffect, useRef } from "react";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";
import { createPeerConnection, closePeer } from "./WebRTCService";
import { useCallContext } from "../contexts/CallContext";

export default function useCall(userId) {
  const db = getDatabase();
  const { incomingCall, setIncomingCall, call, setCall } = useCallContext();

  const localStreamRef = useRef(null);

  // CLEAN STREAM FUNCTION (IMPORTANT)
  const stopLocalStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  };

  // LISTEN CALLS
  useEffect(() => {
    if (!userId) return;

    const callsRef = ref(db, "calls");

    const unsubscribe = onValue(callsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      Object.entries(data).forEach(([callId, callData]) => {

        // INCOMING CALL
        if (
          callData.receiverId === userId &&
          callData.status === "ringing"
        ) {
          console.log("📲 Incoming call:", callData);
          setIncomingCall({ callId, ...callData });
        }

        // REMOTE END CALL
        if (
          callData.status === "ended" &&
          (callData.receiverId === userId || callData.callerId === userId)
        ) {
          console.log("Call ended remotely");

          stopLocalStream(); // TURN OFF CAMERA
          closePeer();
          setCall(null);
          setIncomingCall(null);
        }

      });
    });

    return () => unsubscribe();
  }, [userId]);

  // START CALL
  const startCall = async (friendId) => {
    console.log("START CALL:", userId, friendId);

    const callId = Date.now().toString();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          frameRate: 15
        },
        audio: true
      });

      console.log("GOT STREAM");

      localStreamRef.current = stream;

      const pc = createPeerConnection(
        (remoteStream) => {
          setCall((prev) => ({ ...prev, remoteStream }));
        },
        (candidate) => {
          push(ref(db, `calls/${callId}/candidates`), candidate);
        }
      );

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await set(ref(db, `calls/${callId}`), {
        callerId: userId,
        receiverId: friendId,
        offer,
        status: "ringing",
        createdAt: Date.now()
      });

      setCall({ callId, localStream: stream });

    } catch (err) {
      console.error("startCall error:", err);
    }
  };

  // ACCEPT CALL
  const acceptCall = async () => {
    if (!incomingCall) return;

    const { callId, offer } = incomingCall;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          frameRate: 15
        },
        audio: true
      });

      localStreamRef.current = stream;

      const pc = createPeerConnection(
        (remoteStream) => {
          setCall((prev) => ({ ...prev, remoteStream }));
        },
        (candidate) => {
          push(ref(db, `calls/${callId}/candidates`), candidate);
        }
      );

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // SEND ANSWER
      await set(ref(db, `calls/${callId}/answer`), answer);

      // UPDATE STATUS
      await set(ref(db, `calls/${callId}/status`), "accepted");

      setCall({ callId, localStream: stream });
      setIncomingCall(null);

    } catch (err) {
      console.error(" acceptCall error:", err);
    }
  };

  //  REJECT CALL
  const rejectCall = async () => {
    if (!incomingCall) return;

    const { callId } = incomingCall;

    try {
      await set(ref(db, `calls/${callId}/status`), "ended");
      await remove(ref(db, `calls/${callId}`));
    } catch (err) {
      console.error(" rejectCall error:", err);
    }

    stopLocalStream(); //  TURN OFF CAMERA
    setIncomingCall(null);
  };

  //  END CALL (FULL FIX)
  const endCall = async () => {
    if (!incomingCall && !call) return;

    const callId = incomingCall?.callId || call?.callId;

    try {
      console.log(" Ending call:", callId);

      await set(ref(db, `calls/${callId}/status`), "ended");

      // 🧹 CLEAN DB
      await remove(ref(db, `calls/${callId}`));

    } catch (err) {
      console.error(" endCall error:", err);
    }

    stopLocalStream(); // TURN OFF CAMERA
    closePeer();
    setCall(null);
    setIncomingCall(null);
  };

  return {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    incomingCall,
    call
  };
}