import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDarkMode } from '../../hooks/useDarkMode';

const Chatbot = ({ allUserFiles }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { getIdToken } = useAuth();
  const { darkMode, loading: darkModeLoading } = useDarkMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages(prev => [...prev, { text: input, sender: 'user' }]);
    setLoading(true);

    try {
      const result = await getBotResponse(input);
      setMessages(prev => [...prev, { text: result, sender: 'bot' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: 'Something went wrong.', sender: 'bot' }]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  const getBotResponse = async (query) => {
    if (!Array.isArray(allUserFiles) || allUserFiles.length === 0) {
      return '⚠️ No files available.';
    }

    const extMatch = query.match(/\.(\w+)/);
    let folderMatch = query.match(/\b(?:in|from|inside|folder)\s+([a-zA-Z0-9_-]+)/i);

    // Fallback match to capture folder even if followed by punctuation
    if (!folderMatch) {
      folderMatch = query.match(/\b(?:in|from|inside|folder)\s+([a-zA-Z0-9_-]+)[\?\.\,]*/i);
    }

    const ext = extMatch?.[1]?.toLowerCase();
    const folder = folderMatch?.[1]?.toLowerCase();

    const matched = allUserFiles.filter((file) => {
      const path = file.path?.toLowerCase() || '';
      const name = file.name?.toLowerCase() || '';

      const matchExt = ext ? name.endsWith(`.${ext}`) : true;
      const matchFolder = folder
        ? path.split('/').some(part => part === folder)
        : true;

      return matchExt && matchFolder;
    });

    if (matched.length === 0) {
      return `⚠️ No ${ext ? `.${ext}` : ''} files${folder ? ` in ${folder}` : ''} found.`;
    }

    const lines = matched.map(file => `📄 ${file.path}`);
    return lines.join('\n');
  };

  if (darkModeLoading) return null;

  return (
    <div
      className={`chatbot ${darkMode ? 'dark-mode' : 'light-mode'}`}
      style={{
        padding: '10px',
        borderRadius: '8px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: darkMode ? '#1e1e1e' : '#fff',
        color: darkMode ? '#eee' : '#222',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.sender === 'user' ? 'right' : 'left' }}>
            <p
              style={{
                backgroundColor:
                  m.sender === 'user'
                    ? darkMode
                      ? '#264a8a'
                      : '#d1e7ff'
                    : darkMode
                    ? '#333'
                    : '#f0f0f0',
                padding: '8px',
                borderRadius: '8px',
                display: 'inline-block',
                maxWidth: '80%',
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.text}
            </p>
          </div>
        ))}
        {loading && (
          <div style={{ textAlign: 'left', marginTop: '10px' }}>
            <p
              style={{
                backgroundColor: darkMode ? '#333' : '#f0f0f0',
                padding: '8px',
                borderRadius: '8px',
                display: 'inline-block',
                color: darkMode ? '#eee' : '#222',
              }}
            >
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
          placeholder="Ask something..."
          style={{
            flex: 1,
            borderRadius: '8px',
            border: darkMode ? '1px solid #555' : '1px solid #ddd',
            backgroundColor: darkMode ? '#333' : '#fff',
            color: darkMode ? '#eee' : '#222',
            padding: '8px',
          }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ marginLeft: '8px', padding: '8px 12px', borderRadius: '8px' }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
