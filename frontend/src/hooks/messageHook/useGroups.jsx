import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ||
  "https://localhost:5000";

export default function useGroups(userId) {

  const currentUser = useAuth().currentUser;

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //  FETCH USER GROUPS
  const fetchGroups = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const token = await currentUser?.getIdToken();

      const response = await fetch(
        `${BACKEND_URL}/api/groups/user/${userId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch groups");
      }

      setGroups(data.groups || []);

    } catch (err) {
      console.error("FETCH GROUPS ERROR:", err);
      setError(err.message);

    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  //  LOAD GROUPS
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  //  CREATE GROUP
  const createGroup = async (name, members) => {
    try {
      const token = await currentUser?.getIdToken();

      const response = await fetch(
        `${BACKEND_URL}/api/groups`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            members,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create group");
      }

      await fetchGroups();

      return data;

    } catch (err) {
      console.error("CREATE GROUP ERROR:", err);
      throw err;
    }
  };

  //  UPDATE GROUP
  const updateGroup = async (groupId, updateData) => {
    try {
      const token = await currentUser?.getIdToken();

      const response = await fetch(
        `${BACKEND_URL}/api/groups/${groupId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update group");
      }

      await fetchGroups();

      return data;

    } catch (err) {
      console.error("UPDATE GROUP ERROR:", err);
      throw err;
    }
  };

  //  DELETE GROUP
  const deleteGroup = async (groupId) => {
    try {
      const token = await currentUser?.getIdToken();

      const response = await fetch(
        `${BACKEND_URL}/api/groups/${groupId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete group");
      }

      await fetchGroups();

      return data;

    } catch (err) {
      console.error("DELETE GROUP ERROR:", err);
      throw err;
    }
  };

  //  ADD MEMBER
  const addMember = async (groupId, memberUserId) => {
    try {
      const token = await currentUser?.getIdToken();

      const response = await fetch(
        `${BACKEND_URL}/api/groups/${groupId}/add-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: memberUserId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add member");
      }

      await fetchGroups();

      return data;

    } catch (err) {
      console.error("ADD MEMBER ERROR:", err);
      throw err;
    }
  };

  //  REMOVE MEMBER
  const removeMember = async (groupId, memberUserId) => {
    try {
      const token = await currentUser?.getIdToken();

      const response = await fetch(
        `${BACKEND_URL}/api/groups/${groupId}/remove-member`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: memberUserId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove member");
      }

      await fetchGroups();

      return data;

    } catch (err) {
      console.error("REMOVE MEMBER ERROR:", err);
      throw err;
    }
  };

  return {
    groups,
    loading,
    error,

    fetchGroups,

    createGroup,
    updateGroup,
    deleteGroup,

    addMember,
    removeMember,
  };
}