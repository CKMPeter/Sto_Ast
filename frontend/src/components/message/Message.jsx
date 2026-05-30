import React, { useState, useEffect, useRef } from "react";
import Navbar from "../shared/Navbar";
import useCall from "../../webrtc/useCall";
import { RequestBox } from "./RequestBox";
import FriendsList from "./FriendsList";
import { useAuth } from "../../contexts/AuthContext";
import useFriends from "../../hooks/messageHook/useFriends";
import useChat from "../../hooks/messageHook/useChat";
import useGroups from "../../hooks/messageHook/useGroups";
import CallModal, { IncomingCallNotification } from "./CallModal";
import { styled } from "@mui/material/styles";
import useCallGroup from "../../webrtc/useCallGroup";
import CallModalGroup from "./CallModalGroup";

export function Message() {
  const { currentUser } = useAuth();

  // CALL
  const {
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    incomingCall,
    callState,
    localStream,
    remoteStream,
  } = useCall(currentUser?.uid);

  // GROUP CALL
  const {
    startGroupCall,
    acceptGroupCall,
    rejectGroupCall,
    endGroupCall,
    listenGroupInvites,
    incomingCall: incomingGroupCall,
    callState: groupCallState,
    localStream: groupLocalStream,
    remoteStreams: groupRemoteStreams,
  } = useCallGroup(currentUser?.uid);

  // FRIENDS
  const {
    friends = [],
    requests = [],
    acceptRequest,
    rejectRequest,
    sendRequest,
  } = useFriends(currentUser?.uid);

  // GROUPS
  const { groups = [], createGroup } = useGroups(
    currentUser?.uid,
    currentUser?.getIdToken,
    currentUser?.name,
  );

  // CHAT
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [text, setText] = useState("");

  const {
    messages = [],
    sendMessage,
    sendFile,
    sendVoiceMessage,
    uploading,
  } = useChat(currentUser?.uid, selectedUserId, selectedGroupId);

  const selectedFriend = friends.find((f) => f.uid === selectedUserId);

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // // AUTO SCROLL
  const bottomRef = useRef();

  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({
  //     behavior: "smooth",
  //   });
  // }, [messages]);

  // GROUP CALL LISTENER
  // Dùng groupIds string làm dep để tránh re-subscribe mỗi khi groups object thay đổi
  const groupIdsKey = groups.map((g) => g.id).join(",");

  useEffect(() => {
    if (!currentUser?.uid || !groupIdsKey) return;

    const groupIds = groupIdsKey.split(",");
    const cleanup = listenGroupInvites(groupIds);

    return () => {
      cleanup?.();
    };
  }, [currentUser?.uid, groupIdsKey]);

  // SEND TEXT
  const handleSend = async () => {
    if (!text.trim()) return;

    await sendMessage(text);
    setText("");
  };

  // FILE
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setFilePreview({
      file,
      url: URL.createObjectURL(file),
    });
  };

  const handleSendFile = async () => {
    if (!filePreview) return;

    await sendFile(filePreview.file);
    setFilePreview(null);
  };

  // VOICE
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const recordStartRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
      });

      chunksRef.current = [];
      recordStartRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (chunksRef.current.length === 0) return;

        const blob = new Blob(chunksRef.current, {
          type: mimeType,
        });

        const duration = Date.now() - recordStartRef.current;

        stream.getTracks().forEach((t) => t.stop());

        await sendVoiceMessage(blob, duration);
      };

      recorder.start(100);

      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert("Không bật được micro");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    if (mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  // CREATE GROUP
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const [groupName, setGroupName] = useState("");

  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  const toggleGroupMember = (uid) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const selectedFriends = friends.filter((friend) =>
        selectedGroupMembers.includes(friend.uid),
      );

      const members = [
        {
          uid: currentUser.uid,
          name: currentUser.displayName || currentUser.email,
          email: currentUser.email,
        },

        ...selectedFriends.map((friend) => ({
          uid: friend.uid,
          name: friend.name,
          email: friend.email,
        })),
      ];

      await createGroup(groupName.trim(), members);

      setGroupName("");
      setSelectedGroupMembers([]);
      setShowCreateGroup(false);
    } catch (err) {
      console.error(err);
      alert("Không tạo được group");
    }
  };

  // ADD FRIEND
  const [showAddFriend, setShowAddFriend] = useState(false);

  const [friendSearch, setFriendSearch] = useState("");

  const [searchResults, setSearchResults] = useState([]);

  const handleSearchFriend = async () => {
    if (!friendSearch.trim() || !currentUser) return;

    try {
      const token = await currentUser.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/users/search?query=${encodeURIComponent(friendSearch.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();

      const filtered = Array.isArray(data)
        ? data.filter((u) => u.uid !== currentUser.uid)
        : [];

      setSearchResults(filtered);
    } catch (err) {
      console.error(err);
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (user) => {
    await sendRequest(user.uid);

    setShowAddFriend(false);
    setFriendSearch("");
    setSearchResults([]);
  };

  return (
    <div>
      <Navbar />
      <Container>
        {/* SIDEBAR */}
        <Sidebar>
          <div style={styleSheet.buttonArea}>
            <button
              className="btn btn-warning"
              style={styleSheet.flexButton}
              onClick={() => setShowCreateGroup(true)}
            >
              + Group
            </button>

            <button
              className="btn btn-success"
              style={styleSheet.flexButton}
              onClick={() => setShowAddFriend(true)}
            >
              + Add
            </button>
          </div>

          <RequestBox
            friendRequests={requests}
            onAccept={acceptRequest}
            onReject={rejectRequest}
          />

          <FriendsList
            userId={currentUser?.uid}
            onSelect={(uid) => {
              if (uid === selectedUserId) {
                setSelectedUserId(null);
                setSelectedGroupId(null);
              } else {
                setSelectedUserId(uid);
                setSelectedGroupId(null);
              }
            }}
            selectedUserId={selectedUserId}
          />

          <div style={styleSheet.groupsContainer}>
            <strong>Groups</strong>

            {groups.map((g) => (
              <div
                key={g.id}
                onClick={() => {
                  setSelectedGroupId(g.id);
                  setSelectedUserId(null);
                }}
                style={styleSheet.groupItem(selectedGroupId === g.id)}
              >
                👥 {g.name}
              </div>
            ))}
          </div>
        </Sidebar>

        {/* CHAT */}
        <ChatArea>
          <Header>
            <div>
              {selectedGroup
                ? `👥 ${selectedGroup.name}`
                : selectedFriend
                  ? selectedFriend.email
                  : "Select a conversation"}
            </div>

            {selectedGroupId && (
              <CallBtn onClick={() => startGroupCall(selectedGroup)}>
                👥 Call Group
              </CallBtn>
            )}

            {selectedUserId && (
              <CallBtn onClick={() => startCall(selectedUserId, currentUser?.displayName || currentUser?.email)}>
                📹 Call
              </CallBtn>
            )}
          </Header>

          {/* CHAT BODY */}
          <ChatBody>
            {selectedUserId || selectedGroupId ? (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser.uid;

                return (
                  <Row key={msg.id} isMe={isMe}>
                    <Bubble isMe={isMe}>
                      {msg.text && <div>{msg.text}</div>}

                      {msg.type === "voice" && msg.voiceDataUrl && (
                        <audio
                          controls
                          src={msg.voiceDataUrl}
                          style={styleSheet.audio}
                        />
                      )}

                      {msg.fileUrl && msg.fileType?.startsWith("image") && (
                        <img
                          src={msg.fileUrl}
                          alt="shared-file"
                          style={styleSheet.imageMessage}
                        />
                      )}

                      {msg.fileUrl && !msg.fileType?.startsWith("image") && (
                        <a href={msg.fileUrl} target="_blank" rel="noreferrer">
                          📎 {msg.fileName}
                        </a>
                      )}
                    </Bubble>
                  </Row>
                );
              })
            ) : (
              <Empty>Select a conversation</Empty>
            )}

            <div ref={bottomRef} />
          </ChatBody>

          {/* FILE PREVIEW */}
          {filePreview && (
            <PreviewBox>
              {filePreview.file.type.startsWith("image") ? (
                <img
                  src={filePreview.url}
                  alt="preview"
                  style={styleSheet.previewImage}
                />
              ) : (
                <span>{filePreview.file.name}</span>
              )}

              <button onClick={handleSendFile}>Send</button>

              <button onClick={() => setFilePreview(null)}>❌</button>
            </PreviewBox>
          )}

          {uploading && <Uploading>Uploading...</Uploading>}

          {/* FOOTER */}
          <Footer>
            <FileBtn onClick={() => fileInputRef.current.click()}>📎</FileBtn>

            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={styleSheet.recordButton(isRecording)}
            >
              {isRecording ? "⏹" : "🎤"}
            </button>

            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
            />

            <SendBtn onClick={handleSend}>Send</SendBtn>
          </Footer>
        </ChatArea>
      </Container>
      {/* INCOMING CALL NOTIFICATION (popup góc phải, như Messenger) */}
      {callState === "incoming" && incomingCall && (
        <IncomingCallNotification
          incomingCall={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* INCOMING GROUP CALL NOTIFICATION */}
      {groupCallState === "incoming" && incomingGroupCall && (
        <IncomingCallNotification
          incomingCall={{
            callerName: `${incomingGroupCall.callerName} · ${incomingGroupCall.groupName}`,
            callerId: incomingGroupCall.callerId,
          }}
          onAccept={acceptGroupCall}
          onReject={rejectGroupCall}
        />
      )}

      {/* ACTIVE 1-1 CALL MODAL */}
      {(callState === "active" || callState === "calling") && (
        <CallModal
          localStream={localStream}
          remoteStream={remoteStream}
          onEnd={endCall}
          callerName={selectedFriend?.email}
        />
      )}

      {/* GROUP CALL MODAL */}
      {(groupCallState === "calling" || groupCallState === "active") && (
        <CallModalGroup
          localStream={groupLocalStream}
          remoteStreams={groupRemoteStreams}
          endCall={endGroupCall}
        />
      )}
      {/* ADD FRIEND MODAL */}
      {showAddFriend && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3>Add Friend</h3>

            <div style={modalStyles.searchRow}>
              <input
                type="text"
                placeholder="Search email..."
                value={friendSearch}
                onChange={(e) => setFriendSearch(e.target.value)}
                style={modalStyles.input}
              />

              <button
                onClick={handleSearchFriend}
                style={modalStyles.searchButton}
              >
                Search
              </button>
            </div>

            <div style={modalStyles.results}>
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div key={user.uid} style={modalStyles.userCard}>
                    <div>
                      <div style={modalStyles.userName}>
                        {user.name || "Unnamed"}
                      </div>

                      <div style={modalStyles.userEmail}>{user.email}</div>
                    </div>

                    <button
                      style={modalStyles.addButton}
                      onClick={() => handleSendRequest(user)}
                    >
                      Add
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: "#777" }}>No users found</p>
              )}
            </div>

            <button
              style={modalStyles.closeButton}
              onClick={() => {
                setShowAddFriend(false);
                setFriendSearch("");
                setSearchResults([]);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3>Create Group</h3>

            {/* GROUP NAME */}
            <div style={{ marginBottom: "16px" }}>
              <input
                type="text"
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={modalStyles.input}
              />
            </div>

            {/* FRIEND LIST */}
            <div style={groupStyles.membersContainer}>
              <p style={groupStyles.label}>Select Members</p>

              {friends.length > 0 ? (
                friends.map((friend) => {
                  const selected = selectedGroupMembers.includes(friend.uid);

                  return (
                    <div
                      key={friend.uid}
                      style={groupStyles.memberCard(selected)}
                      onClick={() => toggleGroupMember(friend.uid)}
                    >
                      <div>
                        <div style={groupStyles.memberName}>
                          {friend.name || "Unnamed"}
                        </div>

                        <div style={groupStyles.memberEmail}>
                          {friend.email}
                        </div>
                      </div>

                      <div>{selected ? "✅" : "⬜"}</div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: "#777" }}>No friends available</p>
              )}
            </div>

            {/* ACTIONS */}
            <div style={groupStyles.actions}>
              <button
                style={groupStyles.createButton}
                onClick={handleCreateGroup}
              >
                Create Group
              </button>

              <button
                style={groupStyles.cancelButton}
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName("");
                  setSelectedGroupMembers([]);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styleSheet = {
  buttonArea: {
    display: "flex",
    gap: "8px",
    marginBottom: "10px",
  },

  flexButton: {
    flex: 1,
  },

  groupsContainer: {
    marginTop: "10px",
    color: "#222",
  },

  groupItem: (isSelected) => ({
    padding: "8px",
    cursor: "pointer",
    borderRadius: "8px",
    background: isSelected ? "#e3f2fd" : "transparent",
    color: "#222",
  }),

  audio: {
    width: "220px",
  },

  imageMessage: {
    maxWidth: "200px",
    borderRadius: "10px",
  },

  previewImage: {
    width: "80px",
    borderRadius: "8px",
  },

  recordButton: (isRecording) => ({
    marginRight: "8px",
    background: isRecording ? "#ff4d4f" : "#eeeeee",
    color: isRecording ? "white" : "#222",
    borderRadius: "8px",
    border: "1px solid #ccc",
    padding: "6px 10px",
    cursor: "pointer",
  }),
};
/* STYLES */

// const Container = styled("div")(() => ({
//   display: "flex",
//   height: "calc(100vh - 64px)",
//   background: "#0f0f0f",
// }));

// const Sidebar = styled("div")(() => ({
//   width: "260px",
//   borderRight: "1px solid #222",
//   padding: "10px",
// }));

// const ChatArea = styled("div")(() => ({
//   flex: 1,
//   display: "flex",
//   flexDirection: "column",
// }));

// const Header = styled("div")(() => ({
//   height: "60px",
//   padding: "0 15px",
//   display: "flex",
//   justifyContent: "space-between",
//   alignItems: "center",
//   borderBottom: "1px solid #222",
//   color: "white",
// }));

// const ChatBody = styled("div")(() => ({
//   flex: 1,
//   overflowY: "auto",
//   padding: "15px",
//   background: "#121212",
// }));

// const Row = styled("div")(({ isMe }) => ({
//   display: "flex",
//   justifyContent: isMe
//     ? "flex-end"
//     : "flex-start",
// }));

// const Bubble = styled("div")(({ isMe }) => ({
//   background: isMe
//     ? "#0084ff"
//     : "#2a2a2a",
//   color: "white",
//   padding: "10px",
//   borderRadius: "16px",
//   maxWidth: "60%",
//   marginBottom: "8px",
// }));

// const Footer = styled("div")(() => ({
//   display: "flex",
//   padding: "10px",
//   background: "#181818",
// }));

// const Input = styled("input")(() => ({
//   flex: 1,
//   borderRadius: "20px",
//   padding: "10px",
// }));

// const SendBtn = styled("button")(() => ({
//   marginLeft: "10px",
//   background: "#0084ff",
//   color: "white",
// }));

// const FileBtn = styled("button")(() => ({
//   background: "transparent",
//   color: "white",
// }));

// const PreviewBox = styled("div")(() => ({
//   padding: "10px",
//   background: "#222",
//   color: "white",
// }));

// const Uploading = styled("div")(() => ({
//   color: "white",
// }));

// const IncomingBox = styled("div")(() => ({
//   color: "white",
// }));

// const Empty = styled("p")(() => ({
//   color: "#aaa",
// }));

// const CallBtn = styled("button")(() => ({
//   background: "#1f8f5f",
//   color: "white",
// }));
const Container = styled("div")(() => ({
  display: "flex",
  height: "calc(100vh - 64px)",
  background: "#f5f5f5",
}));

const Sidebar = styled("div")(() => ({
  width: "260px",
  borderRight: "1px solid #ddd",
  padding: "10px",
  background: "#ffffff",
}));

const ChatArea = styled("div")(() => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: "#fafafa",
  height: "88vh",
}));

const Header = styled("div")(() => ({
  height: "60px",
  padding: "0 15px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #ddd",
  background: "#ffffff",
  color: "#222",
}));

const ChatBody = styled("div")(() => ({
  flex: 1,
  overflowY: "auto",
  padding: "15px",
  background: "#f3f4f6",
}));

const Row = styled("div")(({ isMe }) => ({
  display: "flex",
  justifyContent: isMe ? "flex-end" : "flex-start",
}));

const Bubble = styled("div")(({ isMe }) => ({
  background: isMe ? "#1976d2" : "#ffffff",
  color: isMe ? "#ffffff" : "#222",
  padding: "10px",
  borderRadius: "16px",
  maxWidth: "60%",
  marginBottom: "8px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
}));

const Footer = styled("div")(() => ({
  display: "flex",
  padding: "10px",
  background: "#ffffff",
  borderTop: "1px solid #ddd",
}));

const Input = styled("input")(() => ({
  flex: 1,
  borderRadius: "20px",
  padding: "10px 14px",
  border: "1px solid #ccc",
  outline: "none",
  background: "#fff",
}));

const SendBtn = styled("button")(() => ({
  marginLeft: "10px",
  background: "#1976d2",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "0 16px",
  cursor: "pointer",
}));

const FileBtn = styled("button")(() => ({
  background: "transparent",
  color: "#333",
  border: "none",
  cursor: "pointer",
  fontSize: "18px",
}));

const PreviewBox = styled("div")(() => ({
  padding: "10px",
  background: "#ffffff",
  color: "#222",
  borderTop: "1px solid #ddd",
}));

const Uploading = styled("div")(() => ({
  color: "#333",
  padding: "6px 10px",
}));

const IncomingBox = styled("div")(() => ({
  color: "#222",
  background: "#fff3cd",
  padding: "10px",
  borderBottom: "1px solid #ffe69c",
}));

const Empty = styled("p")(() => ({
  color: "#777",
}));

const CallBtn = styled("button")(() => ({
  background: "#2e7d32",
  color: "white",
  border: "none",
  borderRadius: "10px",
  padding: "8px 14px",
  cursor: "pointer",
}));

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  modal: {
    width: "400px",
    maxHeight: "80vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },

  searchRow: {
    display: "flex",
    gap: "10px",
    marginBottom: "16px",
  },

  input: {
    flex: 1,
    padding: "10px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    outline: "none",
  },

  searchButton: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    background: "#1976d2",
    color: "white",
    cursor: "pointer",
  },

  results: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  userCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    border: "1px solid #eee",
    borderRadius: "12px",
    background: "#fafafa",
  },

  userName: {
    fontWeight: 600,
    color: "#222",
  },

  userEmail: {
    fontSize: "14px",
    color: "#666",
  },

  addButton: {
    background: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
  },

  closeButton: {
    marginTop: "18px",
    width: "100%",
    border: "none",
    borderRadius: "10px",
    padding: "10px",
    background: "#e53935",
    color: "white",
    cursor: "pointer",
  },
};

const groupStyles = {
  membersContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "300px",
    overflowY: "auto",
    marginBottom: "20px",
  },

  label: {
    fontWeight: 600,
    color: "#222",
    marginBottom: "8px",
  },

  memberCard: (selected) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    borderRadius: "12px",
    border: selected ? "2px solid #1976d2" : "1px solid #ddd",
    background: selected ? "#e3f2fd" : "#fafafa",
    cursor: "pointer",
    transition: "0.2s",
  }),

  memberName: {
    fontWeight: 600,
    color: "#222",
  },

  memberEmail: {
    fontSize: "14px",
    color: "#666",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  createButton: {
    flex: 1,
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    background: "#1976d2",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },

  cancelButton: {
    flex: 1,
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    background: "#e53935",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
};