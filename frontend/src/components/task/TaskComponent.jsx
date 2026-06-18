// TaskComponent.jsx
// This component renders a draggable task card

import React, { useEffect, useState } from "react";

export default function TaskComponent({
  task,
  onDragStart,
  darkMode,
}) {
  const [isMobile, setIsMobile] =
    useState(window.innerWidth <= 768);
  
  useEffect(() => {
    function handleResize() {
      setIsMobile(
        window.innerWidth <= 768
      );
    }

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  return (
    <div
      style={{
        ...styleSheet(darkMode).taskComponent,
        ...(isMobile
          ? styleSheet(darkMode).taskComponentMobile
          : {}),
      }}
      draggable={!isMobile}
      onDragStart={() =>
        onDragStart?.(task)
      }
    >
      <h3 style={styleSheet(darkMode).title}>
        {task.name}
      </h3>

      <p style={styleSheet(darkMode).text}>
        Assignee:{" "}
        {task.assignedTo ||
          "Unassigned"}
      </p>

      {task.status && (
        <p style={styleSheet(darkMode).status}>
          Status: {task.status}
        </p>
      )}

      {task.progress !==
        undefined && (
        <div
          style={
            styleSheet(darkMode).progressContainer
          }
        >
          <div
            style={{
              ...styleSheet(darkMode).progressBar,
              width: `${task.progress}%`,
            }}
          />

          <span
            style={
              styleSheet(darkMode).progressText
            }
          >
            {task.progress}%
          </span>
        </div>
      )}
    </div>
  );
}

const styleSheet = (darkMode) => ({
  taskComponent: {
    border: "1px solid #caf0f8",
    padding: "12px",
    margin: "10px 0",
    borderRadius: "10px",
    backgroundColor: darkMode ? "#343a40" : "#ffffff",
    cursor: "grab",
    boxShadow:
      "0 4px 12px rgba(0,119,182,0.08)",
    transition: "0.2s",
    width: "100%",
    wordBreak: "break-word",
  },

  taskComponentMobile: {
    minWidth: "220px",
    margin: "8px",
  },

  title: {
    margin: "0 0 8px 0",
    fontSize: "1rem",
    color: darkMode ? "#f1f1f1" : "#023047",
  },

  text: {
    margin: "4px 0",
    fontSize: "0.9rem",
    color: darkMode ? "#adb5bd" : "#555",
  },

  status: {
    margin: "4px 0",
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: darkMode ? "#0077b6" : "#0077b6",
  },

  progressContainer: {
    position: "relative",
    width: "100%",
    height: "20px",
    backgroundColor: "#e9ecef",
    borderRadius: "999px",
    overflow: "hidden",
    marginTop: "10px",
  },

  progressBar: {
    height: "100%",
    backgroundColor: "#0077b6",
    transition: "width 0.3s ease",
  },

  progressText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform:
      "translate(-50%, -50%)",
    fontSize: "0.75rem",
    fontWeight: "bold",
    color: darkMode ? "#fff" : "#000",
  },
});