import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../shared/Navbar';
import useCall from "../../webrtc/useCall";
import { RequestBox } from './RequestBox';
import FriendsList from './FriendsList';
import { useAuth } from '../../contexts/AuthContext';
import { useCallContext } from '../../contexts/CallContext';
import useFriends from '../../hooks/messageHook/useFriends';
import useChat from '../../hooks/useChat';
import useGroups from '../../hooks/messageHook/useGroups';
import CallModal from './CallModal';
import { styled } from "@mui/material/styles";
import useCallGroup from "../../webrtc/useCallGroup";
import CallModalGroup from "./CallModalGroup";

export function Message() {
  const { currentUser } = useAuth();

  // CALL LOGIC
  const { startCall, incomingCall, acceptCall, endCall } = useCall(currentUser?.uid);

  // STREAM CONTEXT
  const { call } = useCallContext();

  //  FRIEND HOOK (REAL DATA)
  const {
  startCall,
  incomingCall,
  acceptCall,
  endCall,
  localStream,
  remoteStream,
} = useCall(currentUser?.uid);

  // GROUP CALL
  const{
  startGroupCall,
  listenIncoming: listenGroupIncoming,
  acceptCall: acceptGroupCall,
  incomingCall: incomingGroupCall,
  endCall: endGroupCall,
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

  // GROUP
  const { groups, createGroup } = useGroups(currentUser?.uid);

  // CHAT TARGET
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [text, setText] = useState("");

  const { messages, sendMessage, sendFile, sendVoiceMessage, uploading } = useChat(
    currentUser?.uid,
    selectedUserId,
    selectedGroupId
  );

  const selectedFriend = friends.find(f => f.uid === selectedUserId);
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  // AUTO SCROLL
  const bottomRef = useRef();
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
  if (!currentUser?.uid) return;

  // listen tất cả group member
  const allMembers = groups.flatMap(g => g.members || []);

  listenGroupIncoming(allMembers);

  return () => {
    endGroupCall();
  };
  }, [currentUser?.uid, groups]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });

      chunksRef.current = [];
      recordStartRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (chunksRef.current.length === 0) return;

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const duration = Date.now() - recordStartRef.current;

        stream.getTracks().forEach(t => t.stop());

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
  
  // CREATE GROUP UI
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);

  const toggleGroupMember = (uid) => {
    setSelectedGroupMembers((prev) =>
      prev.includes(uid)
        ? prev.filter((id) => id !== uid)
        : [...prev, uid]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;

    try {
      const members = [...new Set([
        currentUser?.uid,
        ...selectedGroupMembers
      ].filter(Boolean))];

      const payload = {
        name: groupName.trim(),
        members,
        createdAt: Date.now(),
      };

      try {
        await createGroup(payload);
      } catch (e1) {
        try {
          await createGroup(payload.name, payload.members);
        } catch (e2) {
          await createGroup(payload.name);
        }
      }

      setGroupName("");
      setSelectedGroupMembers([]);
      setShowCreateGroup(false);
    } catch (err) {
      console.error("Create group error:", err);
      alert("Không tạo được group");
    }
  };

  // ADD FRIEND UI
  //  ADD FRIEND STATE
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
        }
      );

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      const filtered = Array.isArray(data)
        ? data.filter(u => u.uid !== currentUser.uid)
        : [];

      setSearchResults(filtered);
    } catch (err) {
      console.error("Search error:", err);
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

        {/* ===== LEFT ===== */}
        <Sidebar>

          {/* BUTTON AREA */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>

            <button
              className="btn btn-warning"
              style={{ flex: 1 }}
              onClick={() => setShowCreateGroup(true)}
            >
              + Group
            </button>

            <button
              className="btn btn-success"
              style={{ flex: 1 }}
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
              setSelectedUserId(uid);
              setSelectedGroupId(null);
            }}
            selectedUserId={selectedUserId}
          />

          <div style={{ marginTop: "10px", color: "white" }}>
            <strong>Groups</strong>
            {groups.map(g => (
              <div
                key={g.id}
                onClick={() => {
                  setSelectedGroupId(g.id);
                  setSelectedUserId(null);
                }}
                style={{
                  padding: "8px",
                  cursor: "pointer",
                  background: selectedGroupId === g.id ? "#333" : "transparent"
                }}
              >
                👥 {g.name}
              </div>
            ))}
          </div>

        </Sidebar>

        {/* ===== RIGHT ===== */}
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
              <CallBtn onClick={() => startCall(selectedUserId)}>
                📹 Call
              </CallBtn>
            )}
          </Header>

          {incomingCall && (
            <IncomingBox>
              <p>📞 {incomingCall.callerId}</p>
              <button onClick={acceptCall}>Accept</button>
              <button onClick={endCall}>Reject</button>
            </IncomingBox>
          )}

          {incomingGroupCall && (
            <IncomingBox>
              <p>📞 Group call incoming</p>

              <button onClick={acceptGroupCall}>
              Accept
              </button>

              <button onClick={endGroupCall}>
              Reject
              </button>
            </IncomingBox>
          )}

          <ChatBody>
            {(selectedUserId || selectedGroupId) ? (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser.uid;

                return (
                  <Row key={msg.id} isMe={isMe}>
                    <Bubble isMe={isMe}>
                      {msg.text && <div>{msg.text}</div>}

                      {msg.type === "voice" && msg.voiceDataUrl && (
                        <audio controls src={msg.voiceDataUrl} style={{ width: "220px" }} />
                      )}

                      {msg.fileUrl && msg.fileType?.startsWith("image") && (
                        <img src={msg.fileUrl} style={{ maxWidth: "200px", borderRadius: "10px" }} />
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

          {filePreview && (
            <PreviewBox>
              {filePreview.file.type.startsWith("image") ? (
                <img src={filePreview.url} width="80" />
              ) : (
                <span>{filePreview.file.name}</span>
              )}

              <button onClick={handleSendFile}>Send</button>
              <button onClick={() => setFilePreview(null)}>❌</button>
            </PreviewBox>
          )}

          {uploading && <Uploading>Uploading...</Uploading>}

          <Footer>

            <FileBtn onClick={() => fileInputRef.current.click()}>
              📎
            </FileBtn>

            <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />

            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                marginRight: "8px",
                background: isRecording ? "#ff4d4f" : "#333",
                color: "white",
                borderRadius: "8px",
                padding: "6px 10px"
              }}
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

      {((localStream && localStream.current) || remoteStream) && (
  <CallModal
    localStream={localStream?.current}
    remoteStream={remoteStream}
    endCall={endCall}
  />
)}

      {(groupLocalStream ||
        Object.keys(groupRemoteStreams || {}).length > 0) && (
        <CallModalGroup
          localStream={groupLocalStream}
          remoteStreams={groupRemoteStreams}
          endCall={endGroupCall}
        />
      )}

      {/* ADD FRIEND MODAL */}
      {showAddFriend && (
        <AddFriendOverlay>
          <AddFriendBox>
            <h3>Add Friend</h3>

            <input
              value={friendSearch}
              onChange={(e) => setFriendSearch(e.target.value)}
              placeholder="Search email..."
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            />

            <button
              onClick={handleSearchFriend}
              className="btn btn-primary w-100"
            >
              Search
            </button>

            <div style={{ marginTop: "10px" }}>
              {searchResults.map((user) => (
                <div
                  key={user.uid}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    padding: "6px 8px",
                    border: "1px solid #ddd",
                    borderRadius: "6px"
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
              onClick={() => {
                setShowAddFriend(false);
                setFriendSearch("");
                setSearchResults([]);
              }}
              className="btn btn-secondary w-100 mt-2"
            >
              Close
            </button>
          </AddFriendBox>
        </AddFriendOverlay>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <AddFriendOverlay>
          <AddFriendBox>
            <h3>Create Group</h3>

            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name..."
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "10px",
                borderRadius: "8px",
                border: "1px solid #ccc"
              }}
            />

            <div style={{ maxHeight: "220px", overflowY: "auto", marginBottom: "10px" }}>
              <div style={{ marginBottom: "8px", color: "#666" }}>
                Select friends to add:
              </div>

              {friends.map((friend) => (
                <label
                  key={friend.uid}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 0",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedGroupMembers.includes(friend.uid)}
                    onChange={() => toggleGroupMember(friend.uid)}
                  />
                  <span>{friend.email || friend.name || friend.uid}</span>
                </label>
              ))}
            </div>

            <div style={{ marginBottom: "10px" }}>
              <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
                Selected members:
              </div>

              {selectedGroupMembers.length === 0 ? (
                <div style={{ color: "#aaa", fontSize: "13px" }}>
                  No members selected
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {[currentUser?.uid, ...selectedGroupMembers]
                    .filter(Boolean)
                    .map((uid) => {
                      const user = friends.find(f => f.uid === uid);
                      const label = uid === currentUser?.uid
                        ? "You"
                        : (user?.email || user?.name || uid);

                      return (
                        <div
                          key={uid}
                          style={{
                            background: "#e0e0e0",
                            padding: "4px 8px",
                            borderRadius: "12px",
                            fontSize: "12px"
                          }}
                        >
                          {label}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <button
              onClick={handleCreateGroup}
              className="btn btn-primary w-100"
            >
              Create
            </button>

            <button
              onClick={() => {
                setShowCreateGroup(false);
                setGroupName("");
                setSelectedGroupMembers([]);
              }}
              className="btn btn-secondary w-100 mt-2"
            >
              Close
            </button>
          </AddFriendBox>
        </AddFriendOverlay>
      )}
    </div>
  );
}

/* ===== STYLE (giữ nguyên) ===== */

const Container = styled("div")(() => ({
  display: "flex",
  height: "calc(100vh - 64px)",
  background: "#0f0f0f",
}));

const Sidebar = styled("div")(() => ({
  width: "260px",
  borderRight: "1px solid #222",
  padding: "10px",
}));

const ChatArea = styled("div")(() => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
}));

const Header = styled("div")(() => ({
  height: "60px",
  padding: "0 15px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid #222",
  color: "white",
}));

const ChatBody = styled("div")(() => ({
  flex: 1,
  overflowY: "auto",
  padding: "15px",
  background: "#121212",
}));

const Row = styled("div")(({ isMe }) => ({
  display: "flex",
  justifyContent: isMe ? "flex-end" : "flex-start",
}));

const Bubble = styled("div")(({ isMe }) => ({
  background: isMe ? "#0084ff" : "#2a2a2a",
  color: "white",
  padding: "10px",
  borderRadius: "16px",
  maxWidth: "60%",
  marginBottom: "8px",
}));

const Footer = styled("div")(() => ({
  display: "flex",
  padding: "10px",
  background: "#181818",
}));

const Input = styled("input")(() => ({
  flex: 1,
  borderRadius: "20px",
  padding: "10px",
}));

const SendBtn = styled("button")(() => ({
  marginLeft: "10px",
  background: "#0084ff",
  color: "white",
}));

const FileBtn = styled("button")(() => ({
  background: "transparent",
  color: "white",
}));

const PreviewBox = styled("div")(() => ({
  padding: "10px",
  background: "#222",
  color: "white",
}));

const Uploading = styled("div")(() => ({
  color: "white",
}));

const IncomingBox = styled("div")(() => ({
  color: "white",
}));

const Empty = styled("p")(() => ({
  color: "#aaa",
}));

const CallBtn = styled("button")(() => ({
  background: "#1f8f5f",
  color: "white",
}));

const AddFriendOverlay = styled("div")(() => ({
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999,
}));

const AddFriendBox = styled("div")(() => ({
  background: "white",
  padding: "20px",
  width: "320px",
  borderRadius: "10px",
}));
