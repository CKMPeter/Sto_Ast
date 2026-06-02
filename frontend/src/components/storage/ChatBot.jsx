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

      if (!input.trim() || loading) return;

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
    [input, loading, getIdToken, allUserFiles]
  );

  if (darkModeLoading) {
    return null;
  }

  return (
    <div
      className={`chatbot ${darkMode ? "dark-mode" : "light-mode"}`}
      style={{
        height: "100%",
        minHeight: "520px",
        display: "flex",
        flexDirection: "column",
        borderRadius: "20px",
        overflow: "hidden",
        background: darkMode
          ? "linear-gradient(180deg, #071923 0%, #0b2635 100%)"
          : "linear-gradient(180deg, #ffffff 0%, #f8fdff 100%)",
        border: darkMode ? "1px solid #16425b" : "1px solid #caf0f8",
        boxShadow: darkMode
          ? "0 12px 30px rgba(0,0,0,0.35)"
          : "0 12px 30px rgba(0,119,182,0.15)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "16px 18px",
          background: "#0077b6",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            AI Assistant
          </div>

          <div
            style={{
              fontSize: "13px",
              opacity: 0.9,
              marginTop: "2px",
            }}
          >
            Ask about your files and storage
          </div>
        </div>

        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "#caf0f8",
            color: "#0077b6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
            fontWeight: "700",
          }}
        >
          AI
        </div>
      </div>

      {/* MESSAGES */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "18px",
          background: darkMode ? "#071923" : "#f8fdff",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              height: "100%",
              minHeight: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: darkMode ? "#b8dce8" : "#6c757d",
              padding: "20px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "42px",
                  marginBottom: "12px",
                }}
              >
                💬
              </div>

              <div
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: darkMode ? "#ffffff" : "#023047",
                  marginBottom: "6px",
                }}
              >
                Start a conversation
              </div>

              <div
                style={{
                  fontSize: "14px",
                  maxWidth: "280px",
                }}
              >
                Ask the assistant to summarize files, suggest names, or search
                your stored content.
              </div>
            </div>
          </div>
        )}

        {messages.map((message, index) => {
          const isUser = message.sender === "user";

          return (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  maxWidth: "78%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: darkMode ? "#90cce3" : "#0077b6",
                    marginBottom: "4px",
                  }}
                >
                  {isUser ? "You" : "Assistant"}
                </span>

                <p
                  style={{
                    margin: 0,
                    background: isUser
                      ? "#0077b6"
                      : darkMode
                      ? "#12384c"
                      : "#ffffff",
                    color: isUser
                      ? "#ffffff"
                      : darkMode
                      ? "#eaf8fc"
                      : "#023047",
                    padding: "12px 15px",
                    borderRadius: isUser
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    border: isUser
                      ? "1px solid #0077b6"
                      : darkMode
                      ? "1px solid #16425b"
                      : "1px solid #caf0f8",
                    boxShadow: isUser
                      ? "0 6px 18px rgba(0,119,182,0.25)"
                      : darkMode
                      ? "0 6px 16px rgba(0,0,0,0.25)"
                      : "0 6px 16px rgba(0,119,182,0.08)",
                    wordWrap: "break-word",
                    overflowWrap: "anywhere",
                    whiteSpace: "pre-wrap",
                    lineHeight: "1.5",
                    fontSize: "14px",
                  }}
                >
                  {message.text}
                </p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                background: darkMode ? "#12384c" : "#ffffff",
                color: darkMode ? "#eaf8fc" : "#023047",
                padding: "12px 15px",
                borderRadius: "18px 18px 18px 4px",
                border: darkMode ? "1px solid #16425b" : "1px solid #caf0f8",
                boxShadow: darkMode
                  ? "0 6px 16px rgba(0,0,0,0.25)"
                  : "0 6px 16px rgba(0,119,182,0.08)",
                fontSize: "14px",
              }}
            >
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px",
          background: darkMode ? "#0b2635" : "#ffffff",
          borderTop: darkMode ? "1px solid #16425b" : "1px solid #caf0f8",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something about your files..."
          style={{
            flex: 1,
            borderRadius: "999px",
            border: darkMode ? "1px solid #16425b" : "1px solid #caf0f8",
            background: darkMode ? "#071923" : "#f8fdff",
            color: darkMode ? "#ffffff" : "#023047",
            padding: "12px 16px",
            outline: "none",
            fontSize: "14px",
          }}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 18px",
            borderRadius: "999px",
            border: "none",
            background: loading || !input.trim() ? "#90cce3" : "#0077b6",
            color: "#ffffff",
            fontWeight: "700",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            boxShadow:
              loading || !input.trim()
                ? "none"
                : "0 6px 16px rgba(0,119,182,0.28)",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;