import React from "react";
import useFriends from "../../hooks/messageHook/useFriends";

export default function FriendsList({ userId, onSelect, selectedUserId }) {
  const {
    friends = [],
    loading
  } = useFriends(userId);

  if (!userId) return <p>Loading user...</p>;

  return (
    <div>
      <h5 style={{ marginBottom: "10px" }}>Friends</h5>

      {loading && <p>Loading...</p>}

      {!loading && friends.length === 0 && (
        <p style={{ color: "#888" }}>No friends yet</p>
      )}

      {friends.map((friend) => (
        <div
          key={friend.uid}
          onClick={() => onSelect && onSelect(friend.uid)}
          style={{
            padding: "10px",
            marginBottom: "5px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background:
              selectedUserId === friend.uid ? "#e3f2fd" : "transparent",
            border:
              selectedUserId === friend.uid
                ? "1px solid #2196f3"
                : "1px solid #eee",
          }}
        >
          {/* AVATAR */}
          <img
            src={
              friend.photoURL ||
              "https://via.placeholder.com/40"
            }
            alt="avatar"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />

          {/* NAME */}
          <div>
            <div style={{ fontWeight: "500" }}>
              {friend.name || friend.email || friend.uid}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}