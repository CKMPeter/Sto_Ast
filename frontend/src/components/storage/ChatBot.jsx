import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../hooks/useDarkMode";
import { runChatbotService } from "../../services/storageService/chatbotService";

const Chatbot = ({ allUserFiles }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { getIdToken } = useAuth();
  const { darkMode, loading: darkModeLoading } = useDarkMode();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!input.trim()) return;

      const userMessage = input.trim();

      setMessages((prev) => [
        ...prev,
        {
          text: userMessage,
          sender: "user",
        },
      ]);

      setLoading(true);
      setInput("");

      try {
        const aiResponse = await runChatbotService({
          input: userMessage,
          getIdToken,
          allUserFiles,
        });

        setMessages((prev) => [
          ...prev,
          {
            text: aiResponse,
            sender: "bot",
          },
        ]);
      } catch (error) {
        console.error("Chatbot error:", error);

        setMessages((prev) => [
          ...prev,
          {
            text: "Sorry, I couldn't get a response at the moment.",
            sender: "bot",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, getIdToken, allUserFiles]
  );

  if (darkModeLoading) {
    return null;
  }

  return (
    <div
      className={`chatbot ${darkMode ? "dark-mode" : "light-mode"}`}
      style={{
        padding: "10px",
        borderRadius: "8px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          marginBottom: "10px",
        }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              textAlign: message.sender === "user" ? "right" : "left",
            }}
          >
            <p
              style={{
                backgroundColor:
                  message.sender === "user"
                    ? darkMode
                      ? "#264a8a"
                      : "#d1e7ff"
                    : darkMode
                    ? "#333"
                    : "#f0f0f0",
                padding: "8px",
                borderRadius: "8px",
                display: "inline-block",
                maxWidth: "80%",
                color: darkMode ? "#eee" : "#222",
                wordWrap: "break-word",
                overflowWrap: "anywhere",
                whiteSpace: "pre-wrap",
              }}
            >
              {message.text}
            </p>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: "left", marginTop: "10px" }}>
            <p
              style={{
                backgroundColor: darkMode ? "#333" : "#f0f0f0",
                padding: "8px",
                borderRadius: "8px",
                display: "inline-block",
                color: darkMode ? "#eee" : "#222",
              }}
            >
              Thinking...
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          className="form-control"
          style={{
            flex: 1,
            borderRadius: "8px",
            border: darkMode ? "1px solid #555" : "1px solid #ddd",
            backgroundColor: darkMode ? "#333" : "#fff",
            color: darkMode ? "#eee" : "#222",
            padding: "8px",
          }}
        />

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
          style={{
            marginLeft: "8px",
            padding: "8px 12px",
            borderRadius: "8px",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;