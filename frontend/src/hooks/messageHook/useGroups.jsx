import { useEffect, useState } from "react";
import { getDatabase, ref, onValue, push } from "firebase/database";

export default function useGroups(userId) {
  const db = getDatabase();
  const [groups, setGroups] = useState([]);

  // 🔄 load groups realtime
  useEffect(() => {
    if (!userId) return;

    const groupRef = ref(db, "groups");

    const unsubscribe = onValue(groupRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setGroups([]);

      const list = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((g) => g.members?.includes(userId)); // 🔥 fix crash

      setGroups(list);
    });

    return () => unsubscribe();
  }, [userId]);

  // ➕ CREATE GROUP
  const createGroup = async (name, members) => {
    if (!name || members.length === 0) return;

    await push(ref(db, "groups"), {
      name,
      members,
      createdAt: Date.now(),
    });
  };

  // ✅ FIX QUAN TRỌNG
  return {
    groups,
    createGroup,
  };
}