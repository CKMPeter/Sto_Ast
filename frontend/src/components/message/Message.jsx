import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../shared/Navbar';
import useCall from "../../webrtc/useCall";
import { RequestBox } from './RequestBox';
import FriendsList from './FriendsList';
import { useAuth } from '../../contexts/AuthContext';
import useFriends from '../../hooks/messageHook/useFriends';
import useChat from '../../hooks/useChat';
import useGroups from '../../hooks/messageHook/useGroups';
import CallModal from './CallModal';
import { styled } from "@mui/material/styles";
import useCallGroup from "../../webrtc/useCallGroup";
import CallModalGroup from "./CallModalGroup";

export function Message() {
  const { currentUser } = useAuth();

  // CALL
  const {
    startCall,
    incomingCall,
    acceptCall,
    endCall,
    localStream,
    remoteStream,
  } = useCall(currentUser?.uid);

  // GROUP CALL
  const {
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

  // GROUPS
  const { groups = [], createGroup } = useGroups(currentUser?.uid);

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
  } = useChat(
    currentUser?.uid,
    selectedUserId,
    selectedGroupId
  );

  const selectedFriend = friends.find(
    f => f.uid === selectedUserId
  );

  const selectedGroup = groups.find(
    g => g.id === selectedGroupId
  );

  // // AUTO SCROLL
   const bottomRef = useRef();

  // useEffect(() => {
  //   bottomRef.current?.scrollIntoView({
  //     behavior: "smooth",
  //   });
  // }, [messages]);

  // GROUP CALL LISTENER
  useEffect(() => {
    if (!currentUser?.uid || groups.length === 0) return;

    const allMembers = [
      ...new Set(
        groups.flatMap(g => g.members || [])
      ),
    ];

    listenGroupIncoming(allMembers);

    return () => {
      endGroupCall();
    };
  }, [currentUser?.uid]);

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
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mimeType =
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
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

        const duration =
          Date.now() - recordStartRef.current;

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

    if (
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  // CREATE GROUP
  const [showCreateGroup, setShowCreateGroup] =
    useState(false);

  const [groupName, setGroupName] = useState("");

  const [
    selectedGroupMembers,
    setSelectedGroupMembers,
  ] = useState([]);

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
      const members = [
        ...new Set([
          currentUser?.uid,
          ...selectedGroupMembers,
        ].filter(Boolean)),
      ];

      const payload = {
        name: groupName.trim(),
        members,
        createdAt: Date.now(),
      };

      await createGroup(payload);

      setGroupName("");
      setSelectedGroupMembers([]);
      setShowCreateGroup(false);

    } catch (err) {
      console.error(err);
      alert("Không tạo được group");
    }
  };

  // ADD FRIEND
  const [showAddFriend, setShowAddFriend] =
    useState(false);

  const [friendSearch, setFriendSearch] =
    useState("");

  const [searchResults, setSearchResults] =
    useState([]);

  const handleSearchFriend = async () => {
    if (!friendSearch.trim() || !currentUser)
      return;

    try {
      const token =
        await currentUser.getIdToken();

      const res = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/users/search?query=${encodeURIComponent(friendSearch.trim())}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok)
        throw new Error("Search failed");

      const data = await res.json();

      const filtered = Array.isArray(data)
        ? data.filter(
            u => u.uid !== currentUser.uid
          )
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
              onClick={() =>
                setShowCreateGroup(true)
              }
            >
              + Group
            </button>

            <button
              className="btn btn-success"
              style={styleSheet.flexButton}
              onClick={() =>
                setShowAddFriend(true)
              }
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

          <div style={styleSheet.groupsContainer}>
            <strong>Groups</strong>

            {groups.map((g) => (
              <div
                key={g.id}
                onClick={() => {
                  setSelectedGroupId(g.id);
                  setSelectedUserId(null);
                }}
                style={styleSheet.groupItem(
                  selectedGroupId === g.id
                )}
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
              <CallBtn
                onClick={() =>
                  startGroupCall(selectedGroup)
                }
              >
                👥 Call Group
              </CallBtn>
            )}

            {selectedUserId && (
              <CallBtn
                onClick={() =>
                  startCall(selectedUserId)
                }
              >
                📹 Call
              </CallBtn>
            )}

          </Header>

          {/* INCOMING CALL */}
          {incomingCall && (
            <IncomingBox>
              <p>📞 {incomingCall.callerId}</p>

              <button onClick={acceptCall}>
                Accept
              </button>

              <button onClick={endCall}>
                Reject
              </button>
            </IncomingBox>
          )}

          {/* INCOMING GROUP CALL */}
          {incomingGroupCall && (
            <IncomingBox>
              <p>📞 Group call incoming</p>

              <button
                onClick={acceptGroupCall}
              >
                Accept
              </button>

              <button
                onClick={endGroupCall}
              >
                Reject
              </button>
            </IncomingBox>
          )}

          {/* CHAT BODY */}
          <ChatBody>

            {(selectedUserId ||
              selectedGroupId) ? (
              messages.map((msg) => {
                const isMe =
                  msg.senderId ===
                  currentUser.uid;

                return (
                  <Row
                    key={msg.id}
                    isMe={isMe}
                  >
                    <Bubble isMe={isMe}>

                      {msg.text && (
                        <div>{msg.text}</div>
                      )}

                      {msg.type === "voice" &&
                        msg.voiceDataUrl && (
                          <audio
                            controls
                            src={msg.voiceDataUrl}
                            style={styleSheet.audio}
                          />
                        )}

                      {msg.fileUrl &&
                        msg.fileType?.startsWith(
                          "image"
                        ) && (
                          <img
                            src={msg.fileUrl}
                            alt="shared-file"
                            style={
                              styleSheet.imageMessage
                            }
                          />
                        )}

                      {msg.fileUrl &&
                        !msg.fileType?.startsWith(
                          "image"
                        ) && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            📎 {msg.fileName}
                          </a>
                        )}

                    </Bubble>
                  </Row>
                );
              })
            ) : (
              <Empty>
                Select a conversation
              </Empty>
            )}

            <div ref={bottomRef} />

          </ChatBody>

          {/* FILE PREVIEW */}
          {filePreview && (
            <PreviewBox>

              {filePreview.file.type.startsWith(
                "image"
              ) ? (
                <img
                  src={filePreview.url}
                  alt="preview"
                  style={
                    styleSheet.previewImage
                  }
                />
              ) : (
                <span>
                  {filePreview.file.name}
                </span>
              )}

              <button onClick={handleSendFile}>
                Send
              </button>

              <button
                onClick={() =>
                  setFilePreview(null)
                }
              >
                ❌
              </button>

            </PreviewBox>
          )}

          {uploading && (
            <Uploading>
              Uploading...
            </Uploading>
          )}

          {/* FOOTER */}
          <Footer>

            <FileBtn
              onClick={() =>
                fileInputRef.current.click()
              }
            >
              📎
            </FileBtn>

            <input
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <button
              onClick={
                isRecording
                  ? stopRecording
                  : startRecording
              }
              style={styleSheet.recordButton(
                isRecording
              )}
            >
              {isRecording ? "⏹" : "🎤"}
            </button>

            <Input
              value={text}
              onChange={(e) =>
                setText(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" &&
                handleSend()
              }
              placeholder="Type a message..."
            />

            <SendBtn onClick={handleSend}>
              Send
            </SendBtn>

          </Footer>

        </ChatArea>

      </Container>

      {/* CALL MODAL */}
      {((localStream &&
        localStream.current) ||
        remoteStream) && (
        <CallModal
          localStream={
            localStream?.current
          }
          remoteStream={remoteStream}
          endCall={endCall}
        />
      )}

      {/* GROUP CALL MODAL */}
      {(groupLocalStream ||
        Object.keys(
          groupRemoteStreams || {}
        ).length > 0) && (
        <CallModalGroup
          localStream={groupLocalStream}
          remoteStreams={
            groupRemoteStreams
          }
          endCall={endGroupCall}
        />
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
    background: isSelected
      ? "#e3f2fd"
      : "transparent",
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
    background: isRecording
      ? "#ff4d4f"
      : "#eeeeee",
    color: isRecording
      ? "white"
      : "#222",
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
  justifyContent: isMe
    ? "flex-end"
    : "flex-start",
}));

const Bubble = styled("div")(({ isMe }) => ({
  background: isMe
    ? "#1976d2"
    : "#ffffff",
  color: isMe
    ? "#ffffff"
    : "#222",
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