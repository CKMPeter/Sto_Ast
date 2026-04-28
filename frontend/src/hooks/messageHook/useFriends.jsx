import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";

const getBackendUrl = () => {
  return (
    import.meta.env.VITE_APP_BACKEND_URL ||
    (typeof process !== "undefined" && process.env?.REACT_APP_BACKEND_URL) ||
    (typeof window !== "undefined" && window.REACT_APP_BACKEND_URL) ||
    "https://localhost:5000"
  );
};

export default function useFriends(userId, { limit = 20 } = {}) {
  const { currentUser } = useAuth();

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);

  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [error, setError] = useState(null);

  const base = getBackendUrl();

  //  helper fetch with auth
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const token = await currentUser?.getIdToken();

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [currentUser]);

  // ✅ FETCH FRIENDS
  const fetchFriends = useCallback(async () => {
    if (!userId) return;

    setLoadingFriends(true);
    setError(null);

    try {
      const data = await fetchWithAuth(
        `${base}/api/users/${encodeURIComponent(userId)}/friends`
      );

      setFriends(Array.isArray(data) ? data.slice(0, limit) : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoadingFriends(false);
    }
  }, [userId, limit, base, fetchWithAuth]);

  // ✅ FETCH REQUESTS
  const fetchRequests = useCallback(async () => {
    if (!userId) return;

    setLoadingRequests(true);
    setError(null);

    try {
      const data = await fetchWithAuth(
        `${base}/api/users/${encodeURIComponent(userId)}/requests`
      );

      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoadingRequests(false);
    }
  }, [userId, base, fetchWithAuth]);

  // ✅ SEND REQUEST
  const sendRequest = async (toUserId) => {
    if (!currentUser?.uid || !toUserId) return;

    try {
      await fetchWithAuth(`${base}/api/users/friend-request`, {
        method: "POST",
        body: JSON.stringify({
          from: currentUser.uid,
          to: toUserId
        })
      });
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  // ✅ ACCEPT REQUEST
  const acceptRequest = async (requesterId) => {
    try {
      await fetchWithAuth(`${base}/api/users/friend-request/accept`, {
        method: "POST",
        body: JSON.stringify({
          currentUserId: currentUser.uid,
          requesterId
        })
      });

      // refresh after action
      fetchFriends();
      fetchRequests();

    } catch (err) {
      setError(err.message || String(err));
    }
  };

  // ✅ REJECT REQUEST
  const rejectRequest = async (requesterId) => {
    try {
      await fetchWithAuth(`${base}/api/users/friend-request/reject`, {
        method: "POST",
        body: JSON.stringify({
          currentUserId: currentUser.uid,
          requesterId
        })
      });

      fetchRequests();

    } catch (err) {
      setError(err.message || String(err));
    }
  };

  // 🔄 AUTO LOAD
  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [fetchFriends, fetchRequests]);

  return {
    friends,
    requests,

    loadingFriends,
    loadingRequests,
    error,

    refreshFriends: fetchFriends,
    refreshRequests: fetchRequests,

    sendRequest,
    acceptRequest,
    rejectRequest
  };
}