import { ROOT_FOLDER } from "../../hooks/storageHook/useFolder";

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

export function getFolderPath(currentFolder) {
  const path = [...currentFolder.path];

  if (currentFolder !== ROOT_FOLDER) {
    path.push({
      name: currentFolder.name,
      id: currentFolder.id,
    });
  }

  return path;
}

export async function createFolderService({
  currentUser,
  currentFolder,
  folderName,
}) {
  if (!currentUser) {
    throw new Error("User not authenticated");
  }

  if (!currentFolder) {
    throw new Error("Current folder is missing");
  }

  const pathArr = getFolderPath(currentFolder);

  const response = await fetch(`${BACKEND_URL}/api/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: currentUser.uid,
      folderName,
      parentId: currentFolder.id,
      pathArr,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to add folder");
  }

  return data;
}