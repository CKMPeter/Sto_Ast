import { useEffect, useState } from "react";
import { getDatabase, ref, onValue } from "firebase/database";

export default function useFriends(userId) {
  const [friends, setFriends] = useState([]);
  const db = getDatabase();

  useEffect(() => {
    if (!userId) return;

    const friendsRef = ref(db, `friends/${userId}`);

    const unsubscribe = onValue(friendsRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setFriends([]);
        return;
      }

      const friendIds = Object.keys(data);

      const usersRef = ref(db, "users");

      onValue(usersRef, (snap) => {
        const usersData = snap.val() || {};

        const list = friendIds.map((id) => ({
          uid: id,
          name: usersData[id]?.name || "Unknown",
          avatar: usersData[id]?.avatar || "",
        }));

        setFriends(list);
      });
    });

    return () => unsubscribe();
  }, [userId]);

  return friends;
}