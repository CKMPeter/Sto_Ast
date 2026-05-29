import React from "react";

export default function TaskListComponent({ tasks }) {
  const expireAt =
    new Date(tasks[0]?.expireAt?._seconds * 1000).toLocaleDateString() ||
    "No Date";
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
            {task.expireAt
              ? new Date(task.expireAt._seconds * 1000).toLocaleDateString()
              : "No Date"}
          </p>
        </div>
      ))}
    </div>
  );
}
