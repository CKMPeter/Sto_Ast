import React, { useEffect, useState } from "react";

export default function TaskListComponent({ tasks, darkMode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div style={styleSheet(darkMode).container}>
      {tasks.map((task) => (
        <div
          key={task.id || task.name}
          style={{
            ...styleSheet(darkMode).card,
            ...(isMobile ? styleSheet(darkMode).cardMobile : {}),
          }}
        >
          <h3 style={styleSheet(darkMode).title}>{task.name}</h3>

          <p style={styleSheet(darkMode).text}>Group: {task.group?.name || "No Group"}</p>

          <p style={styleSheet(darkMode).text}>Progress: {task.progress || 0}%</p>

          <p style={styleSheet(darkMode).text}>Expire At: {formatDate(task.expireAt)}</p>
        </div>
      ))}
    </div>
  );
}

const styleSheet = (darkMode) => ({
  container: {
    width: "100%",
  },

  card: {
    margin: "10px",
    padding: "12px",
    border: "1px solid #caf0f8",
    borderRadius: "10px",
    width: "200px",
    backgroundColor: darkMode ? "#343a40" : "#ffffff",
    boxShadow: "0 4px 12px rgba(0,119,182,0.08)",
    wordBreak: "break-word",
  },

  cardMobile: {
    width: "100%",
    margin: "8px 0",
  },

  title: {
    fontSize: "1.1rem",
    marginBottom: "8px",
    color: darkMode ? "#f1f1f1" : "#023047",
  },

  text: {
    margin: "4px 0",
    fontSize: "0.9rem",
    color: darkMode ? "#adb5bd" : "#555",
  },
});