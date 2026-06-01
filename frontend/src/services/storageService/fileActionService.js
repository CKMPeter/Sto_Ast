const BACKEND_URL = import.meta.env.VITE_APP_BACKEND_URL;

export function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

export async function fetchAIWithTaskService({
  getIdToken,
  fileObj,
  input,
  task,
  isImage = true,
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
      input,
      isImage,
      mimeType: isImage ? "image/jpeg" : "text/plain",
      fileName: fileObj.name,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "AI request failed");
  }

  return data.result || null;
}

export async function deleteFileService({ getIdToken, fileObj }) {
  const token = await getIdToken();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${BACKEND_URL}/api/files/${fileObj.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filePath: fileObj.path,
    }),
  });

  if (!response.ok) {
    throw new Error("Error deleting file");
  }

  return true;
}

export async function updateFileService({
  getIdToken,
  fileObj,
  updatedFileName,
  fileContent,
  preview,
  linkedDates,
}) {
  const token = await getIdToken();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${BACKEND_URL}/api/files/${fileObj.id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: updatedFileName.trim(),
      content: fileObj.isImage ? fileContent : btoa(fileContent),
      preview,
      filePath: fileObj.path,
      linkedDates,
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Error updating file");
  }

  return data;
}

export async function runAIFileService({
  getIdToken,
  fileObj,
  task,
  isImage = false,
  endpoint = "/api/ai",
}) {
  const token = await getIdToken();

  if (!token) {
    throw new Error("User not authenticated");
  }

  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: isImage ? fileObj.content : fileObj.decodeContent(),
      task,
      isImage,
      mimeType: fileObj.mimeType,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "AI processing failed");
  }

  return data.result || "No result returned.";
}