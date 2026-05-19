import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";

const getBackendUrl = () => {
  return (
    import.meta.env.VITE_APP_BACKEND_URL ||
    "http://localhost:5000"
  );
};

export default function useFriends(userId, { limit = 20 } = {}) {
  const { currentUser } = useAuth();

  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]); // 🔥 NEW

  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [error, setError] = useState(null);

  const base = getBackendUrl();

  // 🔥 helper fetch with auth
  const fetchWithAuth = useCallback(async (url, options = {}) => {
    const token = await currentUser?.getIdToken();

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} - ${text}`);
    }

    return res.json();
  }, [currentUser]);

  // ✅ FETCH FRIENDS
  const fetchFriends = useCallback(async () => {
    if (!userId) return;

    setLoadingFriends(true);
    try {
      const data = await fetchWithAuth(
        `${base}/api/users/${userId}/friends`
      );
      setFriends(Array.isArray(data) ? data.slice(0, limit) : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingFriends(false);
    }
  }, [userId, limit, base, fetchWithAuth]);

  // ✅ FETCH REQUESTS
  const fetchRequests = useCallback(async () => {
    if (!userId) return;

    setLoadingRequests(true);
    try {
      const data = await fetchWithAuth(
        `${base}/api/users/${userId}/requests`
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingRequests(false);
    }
  }, [userId, base, fetchWithAuth]);

  // 🔥 CHECK STATES
  const isFriend = (uid) => friends.some(f => f.uid === uid);
  const isRequested = (uid) => requests.some(r => r.uid === uid);
  const isSent = (uid) => sentRequests.includes(uid);

  // ✅ SEND REQUEST (FULL FIX)
  const sendRequest = async (toUserId) => {
    if (!currentUser?.uid || !toUserId) return;

    // 🔥 PREVENT DUPLICATE CALL
    if (isFriend(toUserId) || isSent(toUserId)) {
      console.log("Already friend or request sent");
      return;
    }

    try {
      await fetchWithAuth(`${base}/api/users/friend-request`, {
        method: "POST",
        body: JSON.stringify({
          from: currentUser.uid,
          to: toUserId
        })
      });

      // ✅ mark as sent locally
      setSentRequests(prev => [...prev, toUserId]);

      console.log("Request sent");

    } catch (err) {
      // 🔥 HANDLE ALREADY SENT
      if (err.message.includes("Request already sent")) {
        setSentRequests(prev => [...prev, toUserId]);
        return;
      }

      console.error(err);
      setError(err.message);
    }
  };

  // ✅ ACCEPT
  const acceptRequest = async (requesterId) => {
    try {
      await fetchWithAuth(`${base}/api/users/friend-request/accept`, {
        method: "POST",
        body: JSON.stringify({ requesterId })
      });

      fetchFriends();
      fetchRequests();

    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ REJECT
  const rejectRequest = async (requesterId) => {
    try {
      await fetchWithAuth(`${base}/api/users/friend-request/reject`, {
        method: "POST",
        body: JSON.stringify({ requesterId })
      });

      fetchRequests();

    } catch (err) {
      setError(err.message);
    }
  };

  // 🔄 LOAD
  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, [fetchFriends, fetchRequests]);

  return {
    friends,
    requests,
    sentRequests, // 🔥 expose this
    loadingFriends,
    loadingRequests,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    isFriend,
    isRequested,
    isSent
  };
}