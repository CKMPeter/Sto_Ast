import React from 'react';
import Navbar from '../shared/Navbar';
import useCall from "../../webrtc/useCall";
import FriendBox from './FriendBox';
import FriendsList from '../shared/FriendsList';
import { useAuth } from '../../contexts/AuthContext';
import { useCallContext } from '../../contexts/CallContext'; // 🔥 ADD
import { styled } from "@mui/material/styles";

export function Message() {
  const { currentUser } = useAuth();

  // CALL LOGIC
  const { startCall, incomingCall, acceptCall, endCall } = useCall(currentUser?.uid);

  // GET STREAM FROM CONTEXT
  const { call } = useCallContext();

  // TEST USER (RECEIVER)
  const testFriendId = "2llsP93pmhcoLXZz0BIwdyKeDTv2";

  console.log("MY UID:", currentUser?.uid);

  return (
    <div>
      <Navbar />

      <ChatBoxContainer className="container-fluid d-flex flex-row gap-4">

        {/* LEFT */}
        <div style={{ minWidth: "220px" }}>
          <FriendsList userId={currentUser?.uid} />
        </div>

        {/* RIGHT */}
        <div className="flex-grow-1 mt-5">

          {/* CALL BUTTON */}
          <button
            onClick={() => startCall(testFriendId)}
            style={{
              padding: "10px 16px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginBottom: "10px"
            }}
          >
            Call
          </button>

          {/* INCOMING CALL */}
          {incomingCall && (
            <div style={{
              background: "#fff",
              padding: "20px",
              border: "2px solid red",
              marginBottom: "10px"
            }}>
              <h3>Incoming Call</h3>
              <p>From: {incomingCall.callerId}</p>

              <button
                onClick={acceptCall}
                style={{ marginRight: "10px" }}
              >
                Accept
              </button>

              <button onClick={endCall}>
                Reject
              </button>
            </div>
          )}

          {/* CHAT */}
          <ChatBox className="border p-3">
            <MessageContainer>
              <p><strong>Alice:</strong> Hi there!</p>
            </MessageContainer>
            <MessageContainer>
              <p><strong>You:</strong> Hello, Alice! How are you?</p>
            </MessageContainer>
            <MessageContainer>
              <p><strong>Alice:</strong> I'm good, thanks! Just wanted to check in.</p>
            </MessageContainer>
          </ChatBox>

          {/* VIDEO CALL UI */}
          {call && (
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>

              {/* LOCAL VIDEO */}
              <video
                autoPlay
                muted
                playsInline
                ref={(video) => {
                  if (video && call.localStream) {
                    video.srcObject = call.localStream;
                  }
                }}
                style={{ width: "200px", background: "black" }}
              />

              {/* REMOTE VIDEO */}
              <video
                autoPlay
                playsInline
                ref={(video) => {
                  if (video && call.remoteStream) {
                    video.srcObject = call.remoteStream;
                  }
                }}
                style={{ width: "200px", background: "black" }}
              />

              {/*  END CALL */}
              <button
                onClick={endCall}
                style={{
                  padding: "10px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "6px"
                }}
              >
                End Call
              </button>

            </div>
          )}

          {/* INPUT */}
          <div>
            <input
              type="text"
              className="form-control mt-3"
              placeholder="Type your message..."
            />
          </div>

        </div>
      </ChatBoxContainer>
    </div>
  )
}

const ChatBoxContainer = styled("div")(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  height: "100vh",
  marginRight: theme.spacing(2),
  overflowY: "auto",
  padding: theme.spacing(2),
}));

const ChatBox = styled("div")(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  height: "60vh",
  overflowY: "auto",
  padding: theme.spacing(2),
}));

const MessageContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));