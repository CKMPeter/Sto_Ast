import React, { useEffect, useState } from "react";

export function TaskLog({ taskLog, darkMode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      style={{
        ...styleSheet(darkMode).taskLogContainer,
        ...(isMobile ? styleSheet(darkMode).taskLogContainerMobile : {}),
      }}
    >
      <h2 style={styleSheet(darkMode).title}>Task Log</h2>

      {taskLog.length > 0 ? (
        <ul style={styleSheet(darkMode).list}>
          {taskLog.map((log, index) => (
            <li key={log.id || index} style={styleSheet(darkMode).logItem}>
              <div>
                <strong>{log.action}</strong>
              </div>

              <div>{log.message}</div>

              {log.progress !== undefined && (
                <div>Progress: {log.progress}%</div>
              )}

              {log.updatedFields && (
                <div>Updated Fields: {JSON.stringify(log.updatedFields)}</div>
              )}

              <div style={styleSheet.date}>
                {log.createdAt?.seconds
                  ? new Date(log.createdAt.seconds * 1000).toLocaleString()
                  : "No date"}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={styleSheet.emptyText}>No logs available yet.</p>
      )}
    </div>
  );
}

const styleSheet = (darkMode) => ({
  taskLogContainer: {
    padding: "20px",
    backgroundColor: darkMode ? "#343a40" : "#f8f9fa",
    borderRadius: "10px",
    border: "1px solid #caf0f8",
    height: "400px",
    overflowY: "auto",
    width: "80%",
    // flexShrink: 0,
    scrollbarWidth: "thin",
    scrollbarColor: "#495057 transparent",
  },

  taskLogContainerMobile: {
    width: "100%",
    height: "250px",
    marginTop: "15px",
  },

  title: {
    fontSize: "1.4rem",
    marginBottom: "12px",
    color: darkMode ? "#f1f1f1" : "#023047",
  },

  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },

  logItem: {
    padding: "10px",
    marginBottom: "10px",
    backgroundColor: darkMode ? "#495057" : "#ffffff",
    border: "1px solid #caf0f8",
    borderRadius: "8px",
    wordBreak: "break-word",
  },

  date: {
    marginTop: "5px",
    fontSize: "12px",
    color: darkMode ? "#adb5bd" : "#666",
  },

  emptyText: {
    color: "#6c757d",
    margin: 0,
  },
});