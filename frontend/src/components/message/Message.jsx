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

import {
  FaUserPlus,
  FaUsers,
  FaVideo,
  FaPaperclip,
  FaMicrophone,
  FaStop,
  FaPaperPlane,
  FaFile,
  FaCheckCircle,
  FaRegCircle,
  FaTimes,
} from "react-icons/fa";

import { useDarkMode } from "../../hooks/useDarkMode";

export function Message() {
  const { currentUser } = useAuth();
  const { darkMode } = useDarkMode();

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
  } = useChat(
    currentUser?.uid,
    selectedUserId,
    selectedGroupId,
    currentUser?.displayName || currentUser?.email,
  );

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
      if (!selectedUserId && !selectedGroupId) {
        alert("Please select a conversation first");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      let mimeType = "";

      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recordStartRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const finalType = recorder.mimeType || mimeType || "audio/webm";

          const blob = new Blob(chunksRef.current, {
            type: finalType,
          });

          stream.getTracks().forEach((track) => track.stop());

          if (!blob.size) {
            alert("Voice recording is empty");
            return;
          }

          const duration = Date.now() - recordStartRef.current;

          await sendVoiceMessage(blob, duration);
        } catch (err) {
          console.error("Send voice error:", err);
          alert("Cannot send voice message");
        }
      };

      recorder.start(250);

      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Cannot enable microphone");
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

  const isVoiceMessage = (msg) => {
    return (
      msg.type === "voice" ||
      msg.type === "audio" ||
      msg.type === "voiceMessage" ||
      msg.voiceDataUrl ||
      msg.voiceUrl ||
      msg.audioUrl
    );
  };

  const getVoiceSrc = (msg) => {
    return (
      msg.voiceDataUrl || msg.voiceUrl || msg.audioUrl || msg.fileUrl || ""
    );
  };

  return (
    <div>
      <Navbar />
      <Container darkMode={darkMode}>
        {/* SIDEBAR */}
        <Sidebar darkMode={darkMode}>
          <div style={styleSheet.buttonArea}>
            <button
              className="btn btn-warning"
              style={styleSheet.flexButton(darkMode)}
              onClick={() => setShowCreateGroup(true)}
            >
              <FaUsers
                style={{
                  fontSize: "25px",
                  color: darkMode ? "#0077b6" : "#ffffff",
                }}
              />
            </button>

            <button
              className="btn btn-success"
              style={styleSheet.flexButton(darkMode)}
              onClick={() => setShowAddFriend(true)}
            >
              <FaUserPlus
                style={{
                  fontSize: "25px",
                  color: darkMode ? "#0077b6" : "#ffffff",
                }}
              />
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
            darkMode={darkMode}
          />

          <div
            style={{
              ...styleSheet.groupsContainer,
              color: darkMode ? "#ffffff" : "#023047",
            }}
          >
            <strong>Groups</strong>

            {groups.map((g) => (
              <div
                key={g.id}
                onClick={() => {
                  setSelectedGroupId(g.id);
                  setSelectedUserId(null);
                }}
                style={styleSheet.groupItem(selectedGroupId === g.id, darkMode)}
              >
                <FaUsers
                  style={{
                    fontSize: "30px",
                    color: darkMode ? "#ffffff" : "#0077b6",
                    marginBottom: "3px",
                    paddingRight: "5px",
                  }}
                />
                {g.name}
              </div>
            ))}
          </div>
        </Sidebar>

        {/* CHAT */}
        <ChatArea darkMode={darkMode}>
          <Header darkMode={darkMode}>
            <div>
              {selectedGroup
                ? ` ${selectedGroup.name}`
                : selectedFriend
                  ? selectedFriend.email
                  : "Select a conversation"}
            </div>

            {selectedGroupId && (
              <CallBtn
                darkMode={darkMode}
                onClick={() => startGroupCall(selectedGroup)}
              >
                <FaVideo
                  style={{
                    fontSize: "25px",
                    color: darkMode ? "#0077b6" : "#ffffff",
                  }}
                />
              </CallBtn>
            )}

            {selectedUserId && (
              <CallBtn
                darkMode={darkMode}
                onClick={() =>
                  startCall(
                    selectedUserId,
                    currentUser?.displayName || currentUser?.email,
                  )
                }
              >
                <FaVideo
                  style={{
                    fontSize: "25px",
                    color: darkMode ? "#0077b6" : "#ffffff",
                  }}
                />
              </CallBtn>
            )}
          </Header>

          {/* CHAT BODY */}
          <ChatBody darkMode={darkMode}>
            {selectedUserId || selectedGroupId ? (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUser.uid;
                const timeLabel = msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";

                // Tra tên người gửi từ members của group (fallback về senderName, rồi senderId)
                const memberMap = selectedGroup?.members
                  ? Object.fromEntries(
                      selectedGroup.members.map((m) => [
                        m.uid,
                        m.name || m.email,
                      ]),
                    )
                  : {};
                const displayName =
                  msg.senderName || memberMap[msg.senderId] || msg.senderId;

                return (
                  <Row key={msg.id} isMe={isMe}>
                    <div
                      style={{
                        maxWidth: "65%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMe ? "flex-end" : "flex-start",
                      }}
                    >
                      {/* Tên người gửi: chỉ hiện trong group chat và không phải tin của mình */}
                      {selectedGroupId && !isMe && (
                        <span style={styleSheet.senderName}>{displayName}</span>
                      )}
                      <Bubble isMe={isMe} darkMode={darkMode}>
                        {msg.text && <div>{msg.text}</div>}

                        {isVoiceMessage(msg) &&
                          (getVoiceSrc(msg) ? (
                            <audio
                              controls
                              preload="metadata"
                              src={getVoiceSrc(msg)}
                              style={styleSheet.audio}
                              onError={(e) => {
                                console.error(
                                  "Voice audio cannot play:",
                                  msg,
                                  e,
                                );
                              }}
                            />
                          ) : (
                            <span style={{ fontSize: "12px", opacity: 0.7 }}>
                              <FaMicrophone
                                style={{
                                  fontSize: "20px",
                                  color: darkMode ? "#ffffff" : "#0077b6",
                                }}
                              />{" "}
                              Voice message cannot be played
                            </span>
                          ))}

                        {msg.fileUrl && msg.fileType?.startsWith("image") && (
                          <img
                            src={msg.fileUrl}
                            alt="shared-file"
                            style={styleSheet.imageMessage}
                          />
                        )}

                        {msg.fileUrl && !msg.fileType?.startsWith("image") && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FaPaperclip
                              style={{
                                fontSize: "25px",
                                color: darkMode ? "#ffffff" : "#0077b6",
                              }}
                            />{" "}
                            {msg.fileName}
                          </a>
                        )}
                      </Bubble>
                      {/* Thời gian */}
                      {timeLabel && (
                        <span style={styleSheet.timestamp(darkMode)}>
                          {timeLabel}
                        </span>
                      )}
                    </div>
                  </Row>
                );
              })
            ) : (
              <Empty darkMode={darkMode}>Select a conversation</Empty>
            )}

            <div ref={bottomRef} />
          </ChatBody>

          {/* FILE PREVIEW */}
          {filePreview && (
            <PreviewBox darkMode={darkMode}>
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
          <Footer darkMode={darkMode}>
            <FileBtn
              darkMode={darkMode}
              onClick={() => fileInputRef.current.click()}
            >
              <FaPaperclip
                style={{
                  fontSize: "20px",
                  color: darkMode ? "#ffffff" : "#0077b6",
                }}
              />
            </FileBtn>

            <input
              darkMode={darkMode}
              type="file"
              hidden
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <button
              onClick={isRecording ? stopRecording : startRecording}
              style={styleSheet.recordButton(isRecording, darkMode)}
            >
              {isRecording ? (
                "⏹"
              ) : (
                <FaMicrophone
                  style={{
                    fontSize: "20px",
                    color: darkMode ? "#ffffff" : "#0077b6",
                  }}
                />
              )}
            </button>

            <Input
              darkMode={darkMode}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
            />

            <SendBtn darkMode={darkMode} onClick={handleSend}>
              <FaPaperPlane
                style={{
                  fontSize: "20px",
                  color: "#fffff",
                }}
              />
            </SendBtn>
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
                darkMode={darkMode}
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
                darkMode={darkMode}
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

const COLORS = {
  lightBg: "#f8fdff",
  lightSurface: "#ffffff",
  lightAccentSoft: "#e6f7fc",
  lightBorder: "#caf0f8",
  lightText: "#023047",
  lightMuted: "#6c757d",

  darkBg: "#121212",
  darkSurface: "#1a1a1a",
  darkCard: "#202020",
  darkHover: "#2a2a2a",
  darkBorder: "#2d2d2d",
  darkText: "#ffffff",
  darkMuted: "#b8dce8",

  primary: "#0077b6",
  primaryHover: "#0096c7",
  danger: "#d62828",
  dangerHover: "#ef4444",
  success: "#28a745",
};

const styleSheet = {
  buttonArea: {
    display: "flex",
    gap: "10px",
    marginBottom: "12px",
    flexWrap: "wrap",
  },

  flexButton: (darkMode) => ({
    flex: 1,
    background: darkMode ? COLORS.darkCard : COLORS.primary,
    color: COLORS.darkText,
    border: darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.primary}`,
    borderRadius: "12px",
    padding: "10px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  }),

  groupsContainer: {
    marginTop: "15px",
  },

  groupItem: (selected, darkMode) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "12px",
    marginTop: "6px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    background: selected
      ? COLORS.primary
      : darkMode
        ? COLORS.darkSurface
        : COLORS.lightSurface,
    color: selected
      ? COLORS.darkText
      : darkMode
        ? COLORS.darkText
        : COLORS.lightText,
    border: selected
      ? `1px solid ${COLORS.primary}`
      : darkMode
        ? `1px solid ${COLORS.darkBorder}`
        : `1px solid ${COLORS.lightBorder}`,
  }),

  audio: {
    width: "100%",
    minWidth: "180px",
    height: "40px",
    display: "block",
  },  
  senderName: {
    fontSize: "12px",
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: "3px",
    paddingLeft: "4px",
  },

  timestamp: (darkMode) => ({
    fontSize: "11px",
    color: darkMode ? COLORS.darkMuted : "#90aab8",
    marginTop: "3px",
    paddingRight: "4px",
    paddingLeft: "4px",
  }),

  imageMessage: {
    maxWidth: "100%",
    width: "220px",
    borderRadius: "12px",
  },

  previewImage: {
    width: "100%",
    maxWidth: "120px",
    borderRadius: "12px",
  },

  icon: (darkMode) => ({
    color: darkMode ? COLORS.darkText : COLORS.primary,
  }),

  iconWhite: {
    color: COLORS.darkText,
  },

  recordButton: (recording, darkMode) => ({
    background: recording
      ? COLORS.danger
      : darkMode
        ? COLORS.darkCard
        : COLORS.lightAccentSoft,
    color: recording
      ? COLORS.darkText
      : darkMode
        ? COLORS.darkText
        : COLORS.primary,
    border: recording
      ? `1px solid ${COLORS.danger}`
      : darkMode
        ? `1px solid ${COLORS.darkBorder}`
        : `1px solid ${COLORS.lightBorder}`,
    borderRadius: "12px",
    padding: "8px 12px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  }),

  previewActionButton: (darkMode) => ({
    border: `1px solid ${COLORS.primary}`,
    borderRadius: "10px",
    padding: "8px 12px",
    background: COLORS.primary,
    color: COLORS.darkText,
    cursor: "pointer",
    fontWeight: 600,
  }),

  previewCloseButton: (darkMode) => ({
    border: darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.lightBorder}`,
    borderRadius: "10px",
    padding: "8px 12px",
    background: darkMode ? COLORS.darkCard : COLORS.lightAccentSoft,
    color: darkMode ? COLORS.darkText : COLORS.primary,
    cursor: "pointer",
  }),
};

const Container = styled("div")(({ darkMode }) => ({
  display: "flex",
  height: "calc(100vh - 64px)",
  background: darkMode ? COLORS.darkBg : COLORS.lightBg,

  "@media (max-width: 768px)": {
    flexDirection: "column",
    height: "auto",
    minHeight: "calc(100vh - 64px)",
  },
}));

const Sidebar = styled("div")(({ darkMode }) => ({
  width: "280px",
  padding: "16px",
  color: darkMode ? COLORS.darkText : COLORS.lightText,
  background: darkMode ? COLORS.darkSurface : COLORS.lightSurface,
  borderRight: darkMode
    ? `1px solid ${COLORS.darkBorder}`
    : `1px solid ${COLORS.lightBorder}`,
  boxShadow: darkMode
    ? "2px 0 10px rgba(0,0,0,0.35)"
    : "2px 0 10px rgba(0,119,182,0.08)",
  overflowY: "auto",

  "@media (max-width: 768px)": {
    width: "100%",
    maxHeight: "250px",
    borderRight: "none",
    borderBottom: darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.lightBorder}`,
  },
}));

const ChatArea = styled("div")(({ darkMode }) => ({
  flex: 1,
  display: "flex",
  flexDirection: "column",
  background: darkMode ? COLORS.darkBg : COLORS.lightBg,
  height: "88vh",

  "@media (max-width: 768px)": {
    height: "calc(100vh - 314px)",
  },
}));

const Header = styled("div")(({ darkMode }) => ({
  minHeight: "65px",
  padding: "12px 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  background: darkMode ? COLORS.darkSurface : COLORS.lightSurface,
  color: darkMode ? COLORS.darkText : COLORS.lightText,
  borderBottom: darkMode
    ? `1px solid ${COLORS.darkBorder}`
    : `1px solid ${COLORS.lightBorder}`,

  "@media (max-width: 768px)": {
    flexDirection: "column",
    alignItems: "stretch",
    textAlign: "center",
  },
}));

const ChatBody = styled("div")(({ darkMode }) => ({
  flex: 1,
  overflowY: "auto",
  padding: "20px",
  background: darkMode ? COLORS.darkBg : COLORS.lightBg,
}));

const Row = styled("div")(({ isMe }) => ({
  display: "flex",
  justifyContent: isMe ? "flex-end" : "flex-start",
  marginBottom: "10px",
  width: "100%",
}));

const Bubble = styled("div")(({ isMe, darkMode }) => ({
  background: isMe
    ? COLORS.primary
    : darkMode
      ? COLORS.darkCard
      : COLORS.lightSurface,
  color: isMe ? COLORS.darkText : darkMode ? COLORS.darkText : COLORS.lightText,
  padding: "12px 16px",
  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
  maxWidth: "100%",
  wordBreak: "break-word",
  border: isMe
    ? `1px solid ${COLORS.primary}`
    : darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.lightBorder}`,

  "@media (max-width: 768px)": {
    maxWidth: "100%",
  },
}));

const Footer = styled("div")(({ darkMode }) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "14px",
  background: darkMode ? COLORS.darkSurface : COLORS.lightSurface,
  borderTop: darkMode
    ? `1px solid ${COLORS.darkBorder}`
    : `1px solid ${COLORS.lightBorder}`,

  "@media (max-width: 768px)": {
    flexWrap: "wrap",
  },
}));

const Input = styled("input")(({ darkMode }) => ({
  flex: 1,
  minWidth: 0,
  padding: "12px 16px",
  borderRadius: "25px",
  border: darkMode
    ? `1px solid ${COLORS.darkBorder}`
    : `1px solid ${COLORS.lightBorder}`,
  background: darkMode ? COLORS.darkCard : COLORS.lightBg,
  color: darkMode ? COLORS.darkText : COLORS.lightText,
  outline: "none",

  "&::placeholder": {
    color: darkMode ? COLORS.darkMuted : COLORS.lightMuted,
  },

  "&:focus": {
    borderColor: COLORS.primary,
    boxShadow: `0 0 0 3px ${darkMode ? "rgba(0,119,182,0.22)" : "rgba(0,119,182,0.15)"}`,
  },

  "@media (max-width: 768px)": {
    width: "100%",
    order: 1,
  },
}));

const SendBtn = styled("button")(() => ({
  background: COLORS.primary,
  color: COLORS.darkText,
  border: `1px solid ${COLORS.primary}`,
  borderRadius: "14px",
  padding: "10px 18px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.2s ease",

  "&:hover": {
    background: COLORS.primaryHover,
    borderColor: COLORS.primaryHover,
    transform: "translateY(-1px)",
  },
}));

const FileBtn = styled("button")(({ darkMode }) => ({
  background: darkMode ? COLORS.darkCard : COLORS.lightAccentSoft,
  color: darkMode ? COLORS.darkText : COLORS.primary,
  border: darkMode
    ? `1px solid ${COLORS.darkBorder}`
    : `1px solid ${COLORS.lightBorder}`,
  borderRadius: "12px",
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "18px",
  transition: "all 0.2s ease",

  "&:hover": {
    background: darkMode ? COLORS.darkHover : "#d8f3ff",
    borderColor: COLORS.primary,
  },
}));

const PreviewBox = styled("div")(({ darkMode }) => ({
  padding: "12px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: darkMode ? COLORS.darkSurface : COLORS.lightSurface,
  color: darkMode ? COLORS.darkText : COLORS.lightText,
  borderTop: darkMode
    ? `1px solid ${COLORS.darkBorder}`
    : `1px solid ${COLORS.lightBorder}`,
}));

const Uploading = styled("div")(({ darkMode }) => ({
  padding: "8px 12px",
  color: COLORS.primary,
  background: darkMode ? COLORS.darkSurface : COLORS.lightSurface,
  fontWeight: "600",
}));

const IncomingBox = styled("div")(({ darkMode }) => ({
  background: darkMode ? COLORS.darkCard : COLORS.lightAccentSoft,
  color: darkMode ? COLORS.darkText : COLORS.lightText,
  padding: "12px",
  borderBottom: darkMode
    ? `1px solid ${COLORS.darkBorder}`
    : `1px solid ${COLORS.lightBorder}`,
}));

const Empty = styled("p")(({ darkMode }) => ({
  color: darkMode ? COLORS.darkMuted : COLORS.lightMuted,
  textAlign: "center",
  marginTop: "40px",
}));

const CallBtn = styled("button")(({ darkMode }) => ({
  background: darkMode ? COLORS.darkCard : "#005f91",
  color: COLORS.darkText,
  border: darkMode ? `1px solid ${COLORS.darkBorder}` : "none",
  borderRadius: "12px",
  padding: "10px 16px",
  cursor: "pointer",
  transition: "all 0.2s ease",

  "&:hover": {
    background: COLORS.primary,
    borderColor: COLORS.primary,
  },

  "@media (max-width: 768px)": {
    width: "100%",
  },
}));

const modalStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    backdropFilter: "blur(3px)",
  },

  modal: {
    width: "90%",
    maxWidth: "450px",
    maxHeight: "80vh",
    overflowY: "auto",
    background: COLORS.darkSurface,
    color: COLORS.darkText,
    border: `1px solid ${COLORS.darkBorder}`,
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
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
    background: COLORS.darkCard,
    color: COLORS.darkText,
    border: `1px solid ${COLORS.darkBorder}`,
    outline: "none",
  },

  searchButton: {
    border: `1px solid ${COLORS.primary}`,
    borderRadius: "10px",
    padding: "10px 14px",
    background: COLORS.primary,
    color: COLORS.darkText,
    cursor: "pointer",
    fontWeight: 600,
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
    border: `1px solid ${COLORS.darkBorder}`,
    borderRadius: "12px",
    background: COLORS.darkCard,
  },

  userName: {
    fontWeight: 600,
    color: COLORS.darkText,
  },

  userEmail: {
    fontSize: "14px",
    color: COLORS.darkMuted,
  },

  addButton: {
    background: COLORS.success,
    color: COLORS.darkText,
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: 600,
  },

  closeButton: {
    marginTop: "18px",
    width: "100%",
    border: `1px solid ${COLORS.danger}`,
    borderRadius: "10px",
    padding: "10px",
    background: COLORS.danger,
    color: COLORS.darkText,
    cursor: "pointer",
    fontWeight: 600,
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
    color: COLORS.darkText,
    marginBottom: "8px",
  },

  memberCard: (selected) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    borderRadius: "12px",
    border: selected
      ? `2px solid ${COLORS.primary}`
      : `1px solid ${COLORS.darkBorder}`,
    background: selected ? "rgba(0,119,182,0.18)" : COLORS.darkCard,
    color: COLORS.darkText,
    cursor: "pointer",
    transition: "0.2s",
  }),

  memberName: {
    fontWeight: 600,
    color: COLORS.darkText,
  },

  memberEmail: {
    fontSize: "14px",
    color: COLORS.darkMuted,
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  createButton: {
    flex: 1,
    border: `1px solid ${COLORS.primary}`,
    borderRadius: "10px",
    padding: "12px",
    background: COLORS.primary,
    color: COLORS.darkText,
    cursor: "pointer",
    fontWeight: 600,
  },

  cancelButton: {
    flex: 1,
    border: `1px solid ${COLORS.danger}`,
    borderRadius: "10px",
    padding: "12px",
    background: COLORS.danger,
    color: COLORS.darkText,
    cursor: "pointer",
    fontWeight: 600,
  },
};
