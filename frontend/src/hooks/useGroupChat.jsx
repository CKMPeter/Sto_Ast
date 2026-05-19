import { getDatabase, ref, push } from "firebase/database";

export default function useGroupChat() {
  const db = getDatabase();

  const createGroup = async (name, members) => {
    const groupRef = ref(db, "groups");

    const newGroup = {
      type: "group",
      name,
      members,
      createdAt: Date.now(),
    };

    const result = await push(groupRef, newGroup);

    return {
      id: result.key,
      ...newGroup,
    };
  };

  return { createGroup };
}