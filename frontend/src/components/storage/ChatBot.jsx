import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { runChatbotService } from "../../services/storageService/chatbotService";
import { useDarkMode } from "../../hooks/useDarkMode";

const Chatbot = ({ allUserFiles, darkMode }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const { getIdToken } = useAuth();
  
  const { loading: darkModeLoading } = useDarkMode();

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

  if (darkModeLoading) return null;

  return (
    <div
      className={`chatbot ${darkMode ? "dark-mode" : "light-mode"}`}
      style={{
        ...styleSheet.chatbot,
        ...(darkMode ? styleSheet.chatbotDark : styleSheet.chatbotLight),
      }}
    >
      <div style={styleSheet.header}>
        <div>
          <div style={styleSheet.headerTitle}>AI Assistant</div>
          <div style={styleSheet.headerSubtitle}>
            Ask about your files and storage
          </div>
        </div>

        <div style={styleSheet.avatar}>AI</div>
      </div>

      <div
        style={{
          ...styleSheet.messagesContainer,
          background: darkMode ? "#071923" : "#f8fdff",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              ...styleSheet.emptyState,
              color: darkMode ? "#b8dce8" : "#6c757d",
            }}
          >
            <div>
              <div style={styleSheet.emptyIcon}>💬</div>

              <div
                style={{
                  ...styleSheet.emptyTitle,
                  color: darkMode ? "#ffffff" : "#023047",
                }}
              >
                Start a conversation
              </div>

              <div style={styleSheet.emptyText}>
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
                ...styleSheet.messageRow,
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styleSheet.messageBoxWrapper,
                  alignItems: isUser ? "flex-end" : "flex-start",
                }}
              >
                <span
                  style={{
                    ...styleSheet.senderLabel,
                    color: darkMode ? "#90cce3" : "#0077b6",
                  }}
                >
                  {isUser ? "You" : "Assistant"}
                </span>

                <p
                  style={{
                    ...styleSheet.messageBubble,
                    ...(isUser
                      ? styleSheet.userBubble
                      : darkMode
                      ? styleSheet.botBubbleDark
                      : styleSheet.botBubbleLight),
                    borderRadius: isUser
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
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
              ...styleSheet.messageRow,
              justifyContent: "flex-start",
            }}
          >
            <div
              style={{
                ...styleSheet.thinkingBubble,
                ...(darkMode
                  ? styleSheet.botBubbleDark
                  : styleSheet.botBubbleLight),
              }}
            >
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          ...styleSheet.inputForm,
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
            ...styleSheet.input,
            background: darkMode ? "#071923" : "#f8fdff",
            color: darkMode ? "#ffffff" : "#023047",
            border: darkMode ? "1px solid #16425b" : "1px solid #caf0f8",
          }}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            ...styleSheet.sendButton,
            ...(loading || !input.trim()
              ? styleSheet.sendButtonDisabled
              : styleSheet.sendButtonActive),
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;

const styleSheet = {
  chatbot: {
    height: "100%",
    minHeight: "520px",
    display: "flex",
    flexDirection: "column",
    borderRadius: "20px",
    overflow: "hidden",
    position: "relative",
    zIndex: 5000,
  },

  chatbotDark: {
    background: "linear-gradient(180deg, #071923 0%, #0b2635 100%)",
    border: "1px solid #16425b",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  },

  chatbotLight: {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fdff 100%)",
    border: "1px solid #caf0f8",
    boxShadow: "0 12px 30px rgba(0,119,182,0.15)",
  },

  header: {
    padding: "16px 18px",
    background: "#0077b6",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: "18px",
    fontWeight: "700",
  },

  headerSubtitle: {
    fontSize: "13px",
    opacity: 0.9,
    marginTop: "2px",
  },

  avatar: {
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
  },

  messagesContainer: {
    flex: 1,
    overflowY: "auto",
    padding: "18px",
  },

  emptyState: {
    height: "100%",
    minHeight: "300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "20px",
  },

  emptyIcon: {
    fontSize: "42px",
    marginBottom: "12px",
  },

  emptyTitle: {
    fontSize: "18px",
    fontWeight: "700",
    marginBottom: "6px",
  },

  emptyText: {
    fontSize: "14px",
    maxWidth: "280px",
  },

  messageRow: {
    display: "flex",
    marginBottom: "14px",
  },

  messageBoxWrapper: {
    maxWidth: "78%",
    display: "flex",
    flexDirection: "column",
  },

  senderLabel: {
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "4px",
  },

  messageBubble: {
    margin: 0,
    padding: "12px 15px",
    wordWrap: "break-word",
    overflowWrap: "anywhere",
    whiteSpace: "pre-wrap",
    lineHeight: "1.5",
    fontSize: "14px",
  },

  userBubble: {
    background: "#0077b6",
    color: "#ffffff",
    border: "1px solid #0077b6",
    boxShadow: "0 6px 18px rgba(0,119,182,0.25)",
  },

  botBubbleLight: {
    background: "#ffffff",
    color: "#023047",
    border: "1px solid #caf0f8",
    boxShadow: "0 6px 16px rgba(0,119,182,0.08)",
  },

  botBubbleDark: {
    background: "#12384c",
    color: "#eaf8fc",
    border: "1px solid #16425b",
    boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
  },

  thinkingBubble: {
    padding: "12px 15px",
    borderRadius: "18px 18px 18px 4px",
    fontSize: "14px",
  },

  inputForm: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px",
  },

  input: {
    flex: 1,
    borderRadius: "999px",
    padding: "12px 16px",
    outline: "none",
    fontSize: "14px",
  },

  sendButton: {
    padding: "12px 18px",
    borderRadius: "999px",
    border: "none",
    color: "#ffffff",
    fontWeight: "700",
  },

  sendButtonActive: {
    background: "#0077b6",
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(0,119,182,0.28)",
  },

  sendButtonDisabled: {
    background: "#90cce3",
    cursor: "not-allowed",
    boxShadow: "none",
  },
};