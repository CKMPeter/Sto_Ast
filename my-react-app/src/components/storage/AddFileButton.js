import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp } from "@fortawesome/free-solid-svg-icons";
import { ROOT_FOLDER } from "../../hooks/useFolder";

export default function AddFileButton({ currentFolder, onAdd }) {
  const { currentUser, getIdToken } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Sanitize filename to allow only word chars, dots, hyphens, and underscores
  function sanitizeFileName(fileName) {
    return fileName.replace(/[^\w.-]/g, "_");
  }

  // Get path segments as IDs from currentFolder
  function getFilePathSegments(currentFolder) {
    return currentFolder === ROOT_FOLDER
      ? currentFolder.path.map((folder) => folder.id)
      : [...currentFolder.path.map((folder) => folder.id), currentFolder.id];
  }

  // Convert file to base64 string (without data:<type>;base64, prefix)
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result.split(",")[1]; // remove prefix
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Fetch AI rename result based on file content
  const fetchAIRename = async (base64Input, task, isImage = true) => {
    const token = await getIdToken();
    if (!token) {
      throw new Error("User not authenticated");
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/aiRename`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: base64Input,
            task,
            isImage,
            mimeType: isImage ? "image/jpeg" : "text/plain",
          }),
        }
      );

      const data = await response.json();
      return data.result || null;
    } catch (error) {
      console.error("Error fetching AI response:", error);
      return null;
    }
  };
  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentFolder || !currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const base64Content = await fileToBase64(file);

      // Prepare path segments
      const pathSegments = getFilePathSegments(currentFolder);

      // Use AI rename if filename length >= 20, else original filename
      let newName = file.name;
      if (file.name.length >= 20) {
        const extMatch = file.name.match(/\.[^.]+$/);
        const ext = extMatch ? extMatch[0] : "";

        const aiRenameResult = await fetchAIRename(
          base64Content,
          "rename based on content with in 5 words, without file extension",
          file.type.startsWith("image/")
        );

        if (aiRenameResult && typeof aiRenameResult === "string") {
          let baseName = aiRenameResult.trim();
          baseName = baseName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_'); // sanitize & replace spaces with underscores

          newName = baseName + ext;
        }

        console.log("AI rename result:", newName);
      }


      // Sanitize filename
      const sanitizedFileName = sanitizeFileName(newName);

      // Create full file path string
      const filePath = [...pathSegments, sanitizedFileName].join("/");

      // Get token for upload
      const token = await getIdToken();
      if (!token) {
        throw new Error("User not authenticated");
      }

      // Prepare upload body
      const body = JSON.stringify({
        name: sanitizedFileName,
        content: base64Content || "none",
        path: filePath,
        folderId: currentFolder?.id || null,
      });

      console.log("Uploading file with body:", body);

      // Upload to backend
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || response.statusText);
      }

      setUploadProgress(100);
      if (onAdd) onAdd();
    } catch (error) {
      console.error("Upload failed:", error.message);
      alert("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      e.target.value = null;
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap">
      <div className="d-flex align-items-center flex-grow-1">
        <label className="btn btn-outline-success btn-sm m-0 mr-2" style={{ cursor: "pointer" }}>
          <FontAwesomeIcon icon={faFileArrowUp} style={{ fontSize: "2rem" }} />
          <input
            type="file"
            onChange={handleUpload}
            style={{ opacity: 0, position: "absolute", left: "-9999px" }}
          />
        </label>

        {/* Progress Bar */}
        {isUploading && (
          <div style={{ marginTop: "10px", width: "100%" }}>
            <div
              style={{
                width: "100%",
                backgroundColor: "#f3f3f3",
                borderRadius: "4px",
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: "10px",
                  backgroundColor: "#4caf50",
                  borderRadius: "4px",
                  transition: "width 0.2s",
                }}
              ></div>
            </div>
            <p style={{ fontSize: "0.9rem", margin: "5px 0 0", color: "#555" }}>
              {uploadProgress}% uploaded
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
