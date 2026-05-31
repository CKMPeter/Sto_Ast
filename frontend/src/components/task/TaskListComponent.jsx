import React from "react";

export default function TaskListComponent({ tasks }) {
  const formatDate = (expireAt) => {
    if (!expireAt) return "No Expiration";

    if (typeof expireAt === "string") {
      return new Date(expireAt).toLocaleDateString();
    }

    if (typeof expireAt.toDate === "function") {
      return expireAt.toDate().toLocaleDateString();
    }

    if (expireAt._seconds) {
      return new Date(expireAt._seconds * 1000).toLocaleDateString();
    }

    return "Invalid Date";
  };
  return (
    <div>
      {tasks.map((task) => (
        <div
          key={task.name}
          style={{
            margin: "10px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            width: "200px",
          }}
        >
          <h3>{task.name}</h3>
          <p>Group: {task.group?.name || "No Group"}</p>
          <p>Progress: {task.progress}%</p>
          <p>
            Expire At:{" "}
            {formatDate(task.expireAt)}
          </p>
        </div>
      ))}
    </div>
  );
}
