import { ROOT_FOLDER } from "../../hooks/storageHook/useFolder";

const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

export function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getFilePathSegments(currentFolder) {
  return currentFolder === ROOT_FOLDER
    ? currentFolder.path.map((folder) => folder.id)
    : [...currentFolder.path.map((folder) => folder.id), currentFolder.id];
}

export async function fetchAIFileService({
  getIdToken,
  file,
  base64Input,
  task,
  isImage,
}) {
  const token = await getIdToken();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const api = task === "rename" ? "/api/aiRename" : "/api/aiPreview";

  const response = await fetch(`${BACKEND_URL}${api}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: base64Input,
      isImage,
      mimeType: isImage ? file.type : "text/plain",
      fileName: file.name,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "AI request failed");
  }

  return data.result || null;
}

export async function uploadFileService({
  getIdToken,
  file,
  currentName,
  currentFolder,
  preview,
}) {
  const token = await getIdToken();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const base64Content = await fileToBase64(file);
  const pathSegments = getFilePathSegments(currentFolder);
  const sanitizedFileName = sanitizeFileName(currentName || file.name);

  const filePath = [...pathSegments, sanitizedFileName].join("/");

  const response = await fetch(`${BACKEND_URL}/api/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: sanitizedFileName,
      content: base64Content || "none",
      preview,
      path: filePath,
      folderId: currentFolder?.id || null,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || response.statusText);
  }

  return data;
}