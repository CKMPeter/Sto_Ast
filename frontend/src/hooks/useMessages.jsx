import { useState, useEffect, useCallback } from 'react';

const getBackendUrl = () => {
  // prefer Vite env, fallback to legacy REACT_APP, then localhost
  return (
    import.meta.env.VITE_APP_BACKEND_URL ||
    (typeof process !== 'undefined' && process.env?.REACT_APP_BACKEND_URL) ||
    (typeof window !== 'undefined' && window.REACT_APP_BACKEND_URL) ||
    'https://localhost:5000'
  );
};

export default function useMessages(userId, friendId, { limit = 20 } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = useCallback(async () => {
    if (!userId || !friendId) return;
    setLoading(true);
    setError(null);
    try {
      const base = getBackendUrl();
      const res = await fetch(
        `${base}/api/${encodeURIComponent(userId)}/${encodeURIComponent(friendId)}/message`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // backend returns up to 20 messages sorted newest first
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [userId, friendId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, loading, error, refresh: fetchMessages };
}
