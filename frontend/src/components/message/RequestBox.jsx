import React from 'react';

export function RequestBox({ friendRequests = [], onAccept, onReject }) {

  // ✅ if empty → render nothing
  if (!friendRequests.length) return null;

  return (
    <div style={{ marginBottom: "10px" }}>
      <h5>Friend Requests</h5>

      {friendRequests.map((req) => (
        <div
          key={req.uid} //  FIX HERE
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "6px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            marginBottom: "6px"
          }}
        >
          <span>{req.email}</span>

          <div>
            <button
              onClick={() => onAccept(req.uid)}
              style={{
                marginRight: "5px",
                background: "green",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px"
              }}
            >
              Accept
            </button>

            <button
              onClick={() => onReject(req.uid)}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px"
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}