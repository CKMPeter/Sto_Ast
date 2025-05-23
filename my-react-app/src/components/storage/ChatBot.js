import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const run = async (input, token) => {
  try {
<<<<<<< HEAD
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/chatbot`, {
=======
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/chatbot`, {
>>>>>>> 8e253eed6e7569779758e99574e4ef4a3e653a97
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data.result; // Access the 'result' field from the response
  } catch (error) {
    console.error("Error interacting with backend:", error);
    return "Sorry, an error occurred while processing your request.";
  }
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const {getIdToken} = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const token = await getIdToken();
    if (!token) {
      throw new Error('User not authenticated');
    }

    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    setLoading(true);

    try {
      const aiResponse = await run(input, token);
      setMessages(prev => [...prev, { text: aiResponse, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { text: "Sorry, I couldn't get a response at the moment.", sender: 'bot' },
      ]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div style={{
      backgroundColor: '#fff',
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
              backgroundColor: message.sender === 'user' ? '#d1e7ff' : '#f0f0f0',
              padding: '8px',
              borderRadius: '8px',
              display: 'inline-block',
              maxWidth: '80%'
            }}>
              {message.text}
            </p>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'left', marginTop: '10px' }}>
            <p style={{
              backgroundColor: '#f0f0f0',
              padding: '8px',
              borderRadius: '8px',
              display: 'inline-block'
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
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}
        />
        <button type="submit" style={{
          marginLeft: '8px',
          padding: '8px 12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px'
        }}>
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
