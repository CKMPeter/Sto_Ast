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

export default function useFriends(userId, { limit = 20 } = {}) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFriends = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const base = getBackendUrl();
      const res = await fetch(`${base}/api/${encodeURIComponent(userId)}/friends`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // assume backend returns an array; slice to `limit` for safety
      setFriends(Array.isArray(data) ? data.slice(0, limit) : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  return { friends, loading, error, refresh: fetchFriends };
}
