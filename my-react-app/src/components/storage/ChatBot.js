import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';
 // Ensure fetch is available in your environment

const KEYWORDS = ["find", "locate", "get"];

const runGeminiAI = async (input, token, allUserFiles) => {
  try {
    // Check if input contains any of the keywords (case-insensitive)
    const inputLower = input.toLowerCase();
    const containsKeyword = KEYWORDS.some(keyword => inputLower.includes(keyword));

    let fullPrompt;

    if (containsKeyword) {
      // Prepare the prompt with embedded files info
      const filesSummary = JSON.stringify(allUserFiles);
      fullPrompt = `Files:\n${filesSummary}\n\nUser Query:\n${input} only return the path in plain text, do not include any other information.`;
    } else {
      // Just send the input as is
      fullPrompt = input;
    }

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


const Chatbot = ({allUserFiles}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { getIdToken } = useAuth();
  const { darkMode, loading: darkModeLoading } = useDarkMode();

  // Don't render chatbot UI until darkMode loading is complete
  if (darkModeLoading) {
    return null; // or a loading spinner if you prefer
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    setLoading(true);

    try {
      const token = await getIdToken();
      if (!token) throw new Error("User not authenticated");

      // Pass allUserFiles and input to runGeminiAI
      const aiResponse = await runGeminiAI(input, token, allUserFiles);
      setMessages(prev => [...prev, { text: aiResponse, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "Sorry, I couldn't get a response at the moment.", sender: 'bot' }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className={`chatbot ${darkMode ? "dark-mode" : "light-mode"}`} style={{
      padding: '10px',
      borderRadius: '8px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((message, index) => (
          <div key={index} style={{ textAlign: message.sender === 'user' ? 'right' : 'left' }}>
            <p style={{
              backgroundColor: message.sender === 'user' ? (darkMode ? '#264a8a' : '#d1e7ff') : (darkMode ? '#333' : '#f0f0f0'),
              padding: '8px',
              borderRadius: '8px',
              display: 'inline-block',
              maxWidth: '80%',
              color: darkMode ? '#eee' : '#222'
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
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          className="form-control"
          style={{
            flex: 1,
            borderRadius: '8px',
            border: darkMode ? '1px solid #555' : '1px solid #ddd',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#eee' : '#222',
            padding: '8px'
          }}
        />
        <button type="submit" className="btn btn-primary" style={{
          marginLeft: '8px',
          padding: '8px 12px',
          borderRadius: '8px'
        }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
