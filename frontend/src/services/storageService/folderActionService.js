const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

export async function renameFolderService({
  getIdToken,
  folderId,
  folderName,
}) {
  const token = await getIdToken();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const newName = folderName.trim();

  if (!newName) {
    throw new Error("Folder name cannot be empty");
  }

  const response = await fetch(`${BACKEND_URL}/api/folders/${folderId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      folderName: newName,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to rename folder");
  }

  return data;
}

export async function deleteFolderService({ getIdToken, folderId }) {
  const token = await getIdToken();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${BACKEND_URL}/api/folders/${folderId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to delete folder");
  }

  return data;
}