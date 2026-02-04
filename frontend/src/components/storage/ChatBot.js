import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';

const KEYWORDS = ["find", "locate", "get"];

const buildPrompt = (input, allUserFiles) => {
  const inputLower = input.toLowerCase();
  const containsKeyword = KEYWORDS.some(keyword => inputLower.includes(keyword));

  if (containsKeyword) {
    const filesSummary = JSON.stringify(
    allUserFiles.map(file => ({
        name: file.name,
        path: file.path
      }))
    );
    return `You are a file path assistant. Below is a list of files with their names and paths (in JSON format). Some files may have the same name but different paths.

Files:
${filesSummary}

User Query:
${input}

Instructions:
If multiple files share the same name, return all matching paths in plain text, each on a new line. Do not include extra commentary or formatting. Only output the file paths.`;
  }

  return input;
};

const runGeminiAI = async (input, token, allUserFiles) => {
  try {
    const fullPrompt = buildPrompt(input, allUserFiles);

    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chatbot`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: fullPrompt }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error("Error interacting with backend:", error);
    return "Sorry, an error occurred while processing your request.";
  }
};

const Chatbot = ({ allUserFiles }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { getIdToken } = useAuth();
  const { darkMode, loading: darkModeLoading } = useDarkMode();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    setLoading(true);

    try {
      const token = await getIdToken();
      if (!token) throw new Error("User not authenticated");

      const aiResponse = await runGeminiAI(input, token, allUserFiles);
      setMessages(prev => [...prev, { text: aiResponse, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        text: "Sorry, I couldn't get a response at the moment.",
        sender: 'bot'
      }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  }, [input, getIdToken, allUserFiles]);

  if (darkModeLoading) {
    return null; // or <LoadingSpinner />
  }

  return (
    <div
      className={`chatbot ${darkMode ? "dark-mode" : "light-mode"}`}
      style={{
        padding: '10px',
        borderRadius: '8px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((message, index) => (
          <div key={index} style={{ textAlign: message.sender === 'user' ? 'right' : 'left' }}>
            <p style={{
              backgroundColor: message.sender === 'user'
                ? (darkMode ? '#264a8a' : '#d1e7ff')
                : (darkMode ? '#333' : '#f0f0f0'),
              padding: '8px',
              borderRadius: '8px',
              display: 'inline-block',
              maxWidth: '80%',
              color: darkMode ? '#eee' : '#222',
              wordWrap: 'break-word',        // 🟢 Ensures long words/URLs break
              overflowWrap: 'anywhere',      // 🟢 Breaks long unbreakable content (like file paths)
              whiteSpace: 'pre-wrap',        // 🟢 Preserves line breaks from Gemini and wraps content
            }}>
              {message.text}
            </p>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'left', marginTop: '10px' }}>
            <p style={{
              backgroundColor: darkMode ? '#333' : '#f0f0f0',
              padding: '8px',
              borderRadius: '8px',
              display: 'inline-block',
              color: darkMode ? '#eee' : '#222'
            }}>
              Thinking...
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          className="form-control"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit(e);
            }
          }}
          style={{
            flex: 1,
            borderRadius: '8px',
            border: darkMode ? '1px solid #555' : '1px solid #ddd',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#eee' : '#222',
            padding: '8px'
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{
            marginLeft: '8px',
            padding: '8px 12px',
            borderRadius: '8px'
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
