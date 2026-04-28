import React, { useState } from 'react';
import Navbar from '../shared/Navbar';
import useCall from "../../webrtc/useCall";
import { RequestBox } from './RequestBox';
import FriendsList from './FriendsList';
import { useAuth } from '../../contexts/AuthContext';
import { useCallContext } from '../../contexts/CallContext';
import useFriends from '../../hooks/messageHook/useFriends'; //  ADD
import { styled } from "@mui/material/styles";

export function Message() {
  const { currentUser } = useAuth();

  // CALL LOGIC
  const { startCall, incomingCall, acceptCall, endCall } = useCall(currentUser?.uid);

  // STREAM CONTEXT
  const { call } = useCallContext();

  //  FRIEND HOOK (REAL DATA)
  const {
    requests,
    sendRequest,
    acceptRequest,
    rejectRequest
  } = useFriends(currentUser?.uid);

  //  ADD FRIEND STATE
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    if (!search || !currentUser) return;

    try {
      const token = await currentUser.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/users/search?query=${encodeURIComponent(search)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();

      const filtered = data.filter(u => u.uid !== currentUser.uid);

      console.log(filtered);
      setResults(filtered);

    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    }
  };
  // 👉 REAL SEND REQUEST
  const handleSendRequest = async (user) => {
    await sendRequest(user.uid);

    setShowAddFriend(false);
    setSearch("");
    setResults([]);
  };

  return (
    <div>
      <Navbar />

      <ChatBoxContainer className="container-fluid d-flex flex-row gap-4">

        {/* LEFT */}
        <div style={{ minWidth: "220px" }}>

          {/* ADD FRIEND BUTTON */}
          <button
            onClick={() => setShowAddFriend(true)}
            style={{
              padding: "8px 12px",
              background: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "6px",
              marginBottom: "10px",
              cursor: "pointer",
              width: "100%"
            }}
          >
            + Add Friend
          </button>

          {/*  REAL REQUEST BOX */}
          <RequestBox
            friendRequests={requests}
            onAccept={acceptRequest}
            onReject={rejectRequest}
          />

          <FriendsList userId={currentUser?.uid} />
        </div>

        {/* RIGHT */}
        <div className="flex-grow-1 mt-5">

          {/* CALL BUTTON */}
          <button
            onClick={() => startCall("2llsP93pmhcoLXZz0BIwdyKeDTv2")}
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

              <button onClick={acceptCall} style={{ marginRight: "10px" }}>
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

          {/* VIDEO CALL */}
          {call && (
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>

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

      {/* ADD FRIEND MODAL */}
      {showAddFriend && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            width: "320px"
          }}>
            <h3>Add Friend</h3>

            <input
              type="text"
              placeholder="Enter UID or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control mb-2"
            />

            <button
              onClick={handleSearch}
              className="btn btn-primary w-100"
            >
              Search
            </button>

            {/* RESULTS */}
            <div style={{ marginTop: "10px" }}>
              {results.map((user) => (
                <div
                  key={user.uid}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                    padding: "5px",
                    border: "1px solid #ddd",
                    borderRadius: "5px"
                  }}
                >
                  <span>{user.email}</span>

                  <button
                    onClick={() => handleSendRequest(user)}
                    style={{
                      background: "green",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "4px"
                    }}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAddFriend(false)}
              className="btn btn-secondary w-100 mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
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

const MessageContainer = styled("div")(() => ({
  display: "flex",
  flexDirection: "column",
}));