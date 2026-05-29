import { useEffect, useRef, useState } from "react";

import {
  getDatabase,
  ref,
  set,
  push,
  onValue,
  off,
  remove,
} from "firebase/database";

export default function useCall(currentUserId) {

  const db = getDatabase();

  const [incomingCall, setIncomingCall] =
    useState(null);

  const [localStream, setLocalStream] =
    useState(null);

  const [remoteStream, setRemoteStream] =
    useState(null);

  const peerConnection = useRef(null);

  const listeners = useRef([]);

  // =====================
  // CLEANUP
  // =====================

  const cleanup = async () => {

    try {

      // LOCAL STREAM
      if (localStream) {

        localStream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        setLocalStream(null);
      }

      // REMOTE STREAM
      if (remoteStream) {

        remoteStream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        setRemoteStream(null);
      }

      // PEER
      if (peerConnection.current) {

        peerConnection.current.ontrack = null;

        peerConnection.current.onicecandidate =
          null;

        peerConnection.current.close();

        peerConnection.current = null;
      }

      // REMOVE LISTENERS
      listeners.current.forEach((item) => {

        off(item.ref, "value", item.callback);
      });

      listeners.current = [];

    } catch (err) {

      console.error(
        "cleanup error:",
        err
      );
    }
  };

  // =====================
  // CREATE PEER
  // =====================

  const createPeer = () => {

    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls:
            "stun:stun.l.google.com:19302",
        },
      ],
    });

    peerConnection.current = pc;

    return pc;
  };

  // =====================
  // START CALL
  // =====================

  const startCall = async (
    targetUserId
  ) => {

    try {

      await cleanup();

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      setLocalStream(stream);

      const pc = createPeer();

      // LOCAL TRACKS
      stream
        .getTracks()
        .forEach((track) => {

          pc.addTrack(track, stream);
        });

      // REMOTE TRACK
      pc.ontrack = (event) => {

        const remote =
          event.streams[0];

        if (remote) {

          setRemoteStream(remote);
        }
      };

      // ICE
      pc.onicecandidate = async (
        event
      ) => {

        if (!event.candidate) return;

        await push(
          ref(
            db,
            `calls/${targetUserId}/candidate`
          ),
          JSON.stringify(event.candidate)
        );
      };

      // OFFER
      const offer =
        await pc.createOffer();

      await pc.setLocalDescription(
        offer
      );

      await set(
        ref(
          db,
          `calls/${targetUserId}/offer`
        ),
        {
          callerId: currentUserId,
          offer: JSON.stringify(offer),
          createdAt: Date.now(),
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
            pc.currentRemoteDescription
          ) {
            return;
          }

          try {

            await pc.setRemoteDescription(
              new RTCSessionDescription(
                JSON.parse(data.answer)
              )
            );

          } catch (err) {

            console.error(
              "answer error:",
              err
            );
          }
        };

      onValue(
        answerRef,
        answerCallback
      );

      listeners.current.push({
        ref: answerRef,
        callback: answerCallback,
      });

      // =====================
      // LISTEN CANDIDATES
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

          const candidates =
            Object.values(data);

          for (const candidate of candidates) {

            try {

              await pc.addIceCandidate(
                new RTCIceCandidate(
                  JSON.parse(candidate)
                )
              );

            } catch (err) {

              console.error(
                "candidate error:",
                err
              );
            }
          }
        };

      onValue(
        candidateRef,
        candidateCallback
      );

      listeners.current.push({
        ref: candidateRef,
        callback: candidateCallback,
      });

    } catch (err) {

      console.error(
        "startCall error:",
        err
      );
    }
  };

  // =====================
  // ACCEPT CALL
  // =====================

  const acceptCall = async () => {

    try {

      if (!incomingCall) return;

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      setLocalStream(stream);

      const pc = createPeer();

      // LOCAL TRACKS
      stream
        .getTracks()
        .forEach((track) => {

          pc.addTrack(track, stream);
        });

      // REMOTE TRACK
      pc.ontrack = (event) => {

        const remote =
          event.streams[0];

        if (remote) {

          setRemoteStream(remote);
        }
      };

      // SET REMOTE OFFER
      await pc.setRemoteDescription(
        new RTCSessionDescription(
          JSON.parse(
            incomingCall.offer
          )
        )
      );

      // ICE
      pc.onicecandidate = async (
        event
      ) => {

        if (!event.candidate) return;

        await push(
          ref(
            db,
            `calls/${incomingCall.callerId}/candidate`
          ),
          JSON.stringify(event.candidate)
        );
      };

      // CREATE ANSWER
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
      // LISTEN CANDIDATES
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

          const candidates =
            Object.values(data);

          for (const candidate of candidates) {

            try {

              await pc.addIceCandidate(
                new RTCIceCandidate(
                  JSON.parse(candidate)
                )
              );

            } catch (err) {

              console.error(
                "candidate error:",
                err
              );
            }
          }
        };

      onValue(
        candidateRef,
        candidateCallback
      );

      listeners.current.push({
        ref: candidateRef,
        callback: candidateCallback,
      });

      // REMOVE OFFER
      await remove(
        ref(
          db,
          `calls/${currentUserId}/offer`
        )
      );

      setIncomingCall(null);

    } catch (err) {

      console.error(
        "acceptCall error:",
        err
      );
    }
  };

  // =====================
  // END CALL
  // =====================

  const endCall = async () => {

    try {

      await cleanup();

      await remove(
        ref(
          db,
          `calls/${currentUserId}`
        )
      );

      setIncomingCall(null);

    } catch (err) {

      console.error(
        "endCall error:",
        err
      );
    }
  };

  // =====================
  // LISTEN OFFER
  // =====================

  useEffect(() => {

    if (!currentUserId) return;

    const offerRef = ref(
      db,
      `calls/${currentUserId}/offer`
    );

    const callback = (
      snapshot
    ) => {

      const data =
        snapshot.val();

      if (!data) {

        setIncomingCall(null);

        return;
      }

      setIncomingCall(data);
    };

    onValue(
      offerRef,
      callback
    );

    listeners.current.push({
      ref: offerRef,
      callback,
    });

    return () => {

      off(
        offerRef,
        "value",
        callback
      );

      cleanup();
    };

  }, [currentUserId]);

  // =====================

  return {
    startCall,
    acceptCall,
    endCall,
    incomingCall,
    localStream,
    remoteStream,
  };
}