import React from "react";
import useFriends from "../../hooks/messageHook/useFriends";

export default function FriendsList({
  userId,
  onSelect,
  selectedUserId,
  darkMode,
}) {
  const { friends = [], loading } = useFriends(userId);

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
              selectedUserId === friend.uid
                ? darkMode
                  ? "#2d3748"
                  : "#e3f2fd"
                : "transparent",

            border:
              selectedUserId === friend.uid
                ? darkMode
                  ? "1px solid #60a5fa"
                  : "1px solid #2196f3"
                : darkMode
                  ? "1px solid #444"
                  : "1px solid #eee",

            color: darkMode ? "#fff" : "#000",
          }}
        >
          {/* AVATAR */}
          {friend.photoURL ? (
            <img
              src={friend.photoURL}
              alt="avatar"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#0077b6",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "16px",
                flexShrink: 0,
              }}
            >
              {(friend.name || friend.email || "?")[0].toUpperCase()}
            </div>
          )}

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
