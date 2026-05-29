import { useEffect, useRef, useState } from "react";
import {
  getDatabase,
  ref,
  set,
  onValue,
  off,
  remove,
} from "firebase/database";

export default function useCall(currentUserId) {

  const db = getDatabase();

  const [incomingCall, setIncomingCall] =
    useState(null);

  const [remoteStream, setRemoteStream] =
    useState(null);

  const [localStream, setLocalStream] =
    useState(null);

  const [callAccepted, setCallAccepted] =
    useState(false);

  const [targetUserId, setTargetUserId] =
    useState(null);

  const peerConnection = useRef(null);

  const listeners = useRef([]);

  // =========================
  // CLEANUP MEDIA
  // =========================

  const cleanupMedia = () => {

    if (localStream) {

      localStream
        .getTracks()
        .forEach((track) => track.stop());

      setLocalStream(null);
    }

    if (remoteStream) {

      remoteStream
        .getTracks()
        .forEach((track) => track.stop());

      setRemoteStream(null);
    }

    if (peerConnection.current) {

      peerConnection.current.ontrack = null;
      peerConnection.current.onicecandidate = null;

      peerConnection.current.close();

      peerConnection.current = null;
    }
  };

  // =========================
  // CREATE PEER
  // =========================

  const createPeer = () => {

    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    peerConnection.current = pc;

    return pc;
  };

  // =========================
  // END CALL
  // =========================

  const endCall = async (
    userId = targetUserId
  ) => {

    try {

      cleanupMedia();

      setIncomingCall(null);

      setCallAccepted(false);

      // remove listeners
      listeners.current.forEach((item) => {
        off(item.ref, item.callback);
      });

      listeners.current = [];

      // remove mine
      await remove(
        ref(db, `calls/${currentUserId}`)
      );

      // remove target
      if (userId) {

        await remove(
          ref(db, `calls/${userId}`)
        );
      }

      setTargetUserId(null);

    } catch (err) {

      console.error(
        "endCall error:",
        err
      );
    }
  };

  // =========================
  // START CALL
  // =========================

  const startCall = async (
    targetId
  ) => {

    try {

      await endCall();

      setTargetUserId(targetId);

      setCallAccepted(true);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      setLocalStream(stream);

      const pc = createPeer();

      // local tracks
      stream
        .getTracks()
        .forEach((track) => {
          pc.addTrack(track, stream);
        });

      // remote stream
      pc.ontrack = (event) => {

        const stream =
          event.streams[0];

        if (stream) {
          setRemoteStream(stream);
        }
      };

      // ICE
      pc.onicecandidate =
        async (event) => {

          if (!event.candidate)
            return;

          await set(
            ref(
              db,
              `calls/${targetId}/candidate`
            ),
            JSON.stringify(
              event.candidate
            )
          );
        };

      // offer
      const offer =
        await pc.createOffer();

      await pc.setLocalDescription(
        offer
      );

      await set(
        ref(
          db,
          `calls/${targetId}/offer`
        ),
        {
          callerId:
            currentUserId,

          offer:
            JSON.stringify(offer),
        }
      );

      // =====================
      // LISTEN ANSWER
      // =====================

      const answerRef = ref(
        db,
        `calls/${currentUserId}/answer`
      );

      const answerCallback =
        async (snapshot) => {

          const data =
            snapshot.val();

          if (!data) return;

          if (
            pc.remoteDescription
          )
            return;

          try {

            await pc.setRemoteDescription(
              new RTCSessionDescription(
                JSON.parse(
                  data.answer
                )
              )
            );

          } catch (err) {
            console.error(err);
          }
        };

      onValue(
        answerRef,
        answerCallback
      );

      listeners.current.push({
        ref: answerRef,
        callback:
          answerCallback,
      });

      // =====================
      // LISTEN CANDIDATE
      // =====================

      const candidateRef = ref(
        db,
        `calls/${currentUserId}/candidate`
      );

      const candidateCallback =
        async (snapshot) => {

          const data =
            snapshot.val();

          if (!data) return;

          try {

            await pc.addIceCandidate(
              new RTCIceCandidate(
                JSON.parse(data)
              )
            );

          } catch (err) {
            console.error(err);
          }
        };

      onValue(
        candidateRef,
        candidateCallback
      );

      listeners.current.push({
        ref: candidateRef,
        callback:
          candidateCallback,
      });

    } catch (err) {

      console.error(
        "startCall error:",
        err
      );
    }
  };

  // =========================
  // ACCEPT CALL
  // =========================

  const acceptCall = async () => {

    try {

      if (!incomingCall)
        return;

      setTargetUserId(
        incomingCall.callerId
      );

      setCallAccepted(true);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      setLocalStream(stream);

      const pc = createPeer();

      // local tracks
      stream
        .getTracks()
        .forEach((track) => {
          pc.addTrack(track, stream);
        });

      // remote stream
      pc.ontrack = (event) => {

        const stream =
          event.streams[0];

        if (stream) {
          setRemoteStream(stream);
        }
      };

      // remote offer
      await pc.setRemoteDescription(
        new RTCSessionDescription(
          JSON.parse(
            incomingCall.offer
          )
        )
      );

      // ICE
      pc.onicecandidate =
        async (event) => {

          if (!event.candidate)
            return;

          await set(
            ref(
              db,
              `calls/${incomingCall.callerId}/candidate`
            ),
            JSON.stringify(
              event.candidate
            )
          );
        };

      // answer
      const answer =
        await pc.createAnswer();

      await pc.setLocalDescription(
        answer
      );

      await set(
        ref(
          db,
          `calls/${incomingCall.callerId}/answer`
        ),
        {
          answer:
            JSON.stringify(answer),
        }
      );

      // =====================
      // LISTEN CANDIDATE
      // =====================

      const candidateRef = ref(
        db,
        `calls/${currentUserId}/candidate`
      );

      const candidateCallback =
        async (snapshot) => {

          const data =
            snapshot.val();

          if (!data) return;

          try {

            await pc.addIceCandidate(
              new RTCIceCandidate(
                JSON.parse(data)
              )
            );

          } catch (err) {
            console.error(err);
          }
        };

      onValue(
        candidateRef,
        candidateCallback
      );

      listeners.current.push({
        ref: candidateRef,
        callback:
          candidateCallback,
      });

      setIncomingCall(null);

    } catch (err) {

      console.error(
        "acceptCall error:",
        err
      );
    }
  };

  // =========================
  // LISTEN INCOMING
  // =========================

  useEffect(() => {

    if (!currentUserId)
      return;

    const offerRef = ref(
      db,
      `calls/${currentUserId}/offer`
    );

    const callback =
      (snapshot) => {

        const data =
          snapshot.val();

        if (
          !data ||
          !data.offer
        ) {

          setIncomingCall(
            null
          );

          return;
        }

        setIncomingCall(data);
      };

    onValue(
      offerRef,
      callback
    );

    return () => {
      off(offerRef, callback);
    };

  }, [currentUserId]);

  // =========================

  return {
    startCall,
    incomingCall,
    acceptCall,
    endCall,
    localStream,
    remoteStream,
    callAccepted,
  };
}