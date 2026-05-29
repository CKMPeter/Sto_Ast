import { useState, useRef } from "react";
import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  off,
  remove,
} from "firebase/database";

export default function useCallGroup(currentUserId) {
  const db = getDatabase();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [incomingCall, setIncomingCall] = useState(null);

  const peersRef = useRef({});
  const listenersRef = useRef([]);

  // =========================
  // GET MEDIA
  // =========================

  const initMedia = async () => {
    if (localStream) return localStream;

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    setLocalStream(stream);

    return stream;
  };

  // =========================
  // PEER KEY
  // =========================

  const getRoomKey = (uid1, uid2) => {
    return [uid1, uid2].sort().join("_");
  };

  // =========================
  // CREATE PEER
  // =========================

  const createPeer = async (
    remoteUserId,
    stream,
    isCaller = false
  ) => {
    const roomKey = getRoomKey(
      currentUserId,
      remoteUserId
    );

    if (peersRef.current[roomKey]) {
      return peersRef.current[roomKey];
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    peersRef.current[roomKey] = pc;

    // =========================
    // ADD TRACKS
    // =========================

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // =========================
    // REMOTE STREAM
    // =========================

    pc.ontrack = (event) => {
      const stream = event.streams[0];

      if (!stream) return;

      setRemoteStreams((prev) => ({
        ...prev,
        [remoteUserId]: stream,
      }));
    };

    // =========================
    // ICE
    // =========================

    pc.onicecandidate = async (event) => {
      if (!event.candidate) return;

      await push(
        ref(
          db,
          `groupCalls/${roomKey}/candidates/${currentUserId}`
        ),
        event.candidate.toJSON()
      );
    };

    // =========================
    // OFFER
    // =========================

    if (isCaller) {
      const offer = await pc.createOffer();

      await pc.setLocalDescription(offer);

      await set(
        ref(
          db,
          `groupCalls/${roomKey}/offer`
        ),
        {
          from: currentUserId,
          to: remoteUserId,
          offer: offer.toJSON(),
        }
      );
    }

    // =========================
    // LISTEN ANSWER
    // =========================

    const answerRef = ref(
      db,
      `groupCalls/${roomKey}/answer`
    );

    const answerCallback = async (snap) => {
      const data = snap.val();

      if (!data) return;

      if (pc.currentRemoteDescription) return;

      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
      } catch (err) {
        console.log("answer error", err);
      }
    };

    onValue(answerRef, answerCallback);

    listenersRef.current.push({
      ref: answerRef,
      callback: answerCallback,
    });

    // =========================
    // LISTEN ICE
    // =========================

    const remoteIceRef = ref(
      db,
      `groupCalls/${roomKey}/candidates/${remoteUserId}`
    );

    const iceCallback = async (snap) => {
      const data = snap.val();

      if (!data) return;

      Object.values(data).forEach(async (candidate) => {
        try {
          await pc.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch {}
      });
    };

    onValue(remoteIceRef, iceCallback);

    listenersRef.current.push({
      ref: remoteIceRef,
      callback: iceCallback,
    });

    return pc;
  };

  // =========================
  // START GROUP CALL
  // =========================

  const startGroupCall = async (group) => {
    try {
      const stream = await initMedia();

      const others = group.members.filter(
        (id) => id !== currentUserId
      );

      for (const uid of others) {
        await createPeer(uid, stream, true);
      }
    } catch (err) {
      console.log("startGroupCall error", err);
    }
  };

  // =========================
  // LISTEN INCOMING
  // =========================

  const listenIncoming = (groupMembers = []) => {
    groupMembers.forEach((memberId) => {
      if (memberId === currentUserId) return;

      const roomKey = getRoomKey(
        currentUserId,
        memberId
      );

      const offerRef = ref(
        db,
        `groupCalls/${roomKey}/offer`
      );

      const callback = (snap) => {
        const data = snap.val();

        if (!data) return;

        // chỉ nhận offer gửi cho mình
        if (data.to !== currentUserId) return;

        setIncomingCall(data);
      };

      onValue(offerRef, callback);

      listenersRef.current.push({
        ref: offerRef,
        callback,
      });
    });
  };

  // =========================
  // ACCEPT CALL
  // =========================

  const acceptCall = async () => {
    try {
      if (!incomingCall) return;

      const stream = await initMedia();

      const remoteUserId = incomingCall.from;

      const roomKey = getRoomKey(
        currentUserId,
        remoteUserId
      );

      const pc = await createPeer(
        remoteUserId,
        stream,
        false
      );

      await pc.setRemoteDescription(
        new RTCSessionDescription(
          incomingCall.offer
        )
      );

      const answer = await pc.createAnswer();

      await pc.setLocalDescription(answer);

      await set(
        ref(
          db,
          `groupCalls/${roomKey}/answer`
        ),
        {
          from: currentUserId,
          answer: answer.toJSON(),
        }
      );

      setIncomingCall(null);
    } catch (err) {
      console.log("acceptCall error", err);
    }
  };

  // =========================
  // END CALL
  // =========================

  const endCall = async () => {
    try {
      // close peers
      Object.values(peersRef.current).forEach((pc) => {
        try {
          pc.ontrack = null;
          pc.onicecandidate = null;
          pc.close();
        } catch {}
      });

      peersRef.current = {};

      // stop local camera
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // remove listeners
      listenersRef.current.forEach((item) => {
        try {
          off(item.ref, item.callback);
        } catch {}
      });

      listenersRef.current = [];

      // cleanup firebase
      try {
        await remove(ref(db, `groupCalls`));
      } catch {}

      // reset
      setRemoteStreams({});
      setLocalStream(null);
      setIncomingCall(null);

    } catch (err) {
      console.log("endCall error", err);
    }
  };

  return {
    startGroupCall,
    listenIncoming,
    acceptCall,
    incomingCall,
    endCall,
    localStream,
    remoteStreams,
  };
}