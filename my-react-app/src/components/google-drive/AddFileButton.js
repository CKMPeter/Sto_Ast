import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { realtimeDatabase } from "../../firebase"; // Import Realtime Database
import { ref, set, serverTimestamp } from "firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp } from "@fortawesome/free-solid-svg-icons";
import { ROOT_FOLDER } from "../../hooks/useFolder";

export default function AddFileButton({ currentFolder }) {
  const { currentUser } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0); // State to track progress
  const [isUploading, setIsUploading] = useState(false); // State to check upload status

  function sanitizeFileName(fileName) {
    return fileName.replace(/[.#$[\]]/g, "_"); // Replace invalid characters
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (currentFolder == null || file == null) return;

    const reader = new FileReader();

    reader.onload = () => {
      const base64File = reader.result.split(",")[1]; // Extract Base64 content
      const sanitizedFileName = sanitizeFileName(file.name);

      const filePath =
        currentFolder === ROOT_FOLDER
          ? `${currentFolder.path.map((folder) => folder.id).join("/")}/${sanitizedFileName}`
          : `${currentFolder.path.map((folder) => folder.id).join("/")}/${currentFolder.id}/${sanitizedFileName}`;

      // Reference to the Realtime Database
      const fileRef = ref(realtimeDatabase, `files/${currentUser.uid}/${filePath}`);

      // Start the upload process
      setIsUploading(true);
      setUploadProgress(0);

      const fakeUploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(fakeUploadInterval);
            setIsUploading(false);
            console.log("File uploaded successfully!");
            return 100;
          }
          return prev + 10; // Increment progress
        });
      }, 200);

      // Simulating file upload using Firebase set()
      setTimeout(() => {
        set(fileRef, {
          name: sanitizedFileName,
          content: base64File,
          path: filePath,
          createdAt: serverTimestamp(),
          folderId: currentFolder.id,
        }).catch((error) => {
          console.error("Error uploading file:", error);
          setIsUploading(false);
        });
      }, 2000); // Simulate some delay
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };

    reader.readAsDataURL(file); // Convert file to Base64
  }

  return (
    <div>
      <label className="btn btn-outline-success btn-sm m-0 mr-2">
        <FontAwesomeIcon icon={faFileArrowUp} style={{ fontSize: "2rem" }} />
        <input
          type="file"
          onChange={handleUpload}
          style={{ opacity: 0, position: "absolute", left: "-9999px" }}
        />
      </label>

      {/* Progress Bar */}
      {isUploading && (
        <div style={{ marginTop: "10px" }}>
          <div style={{ width: "100%", backgroundColor: "#f3f3f3", borderRadius: "4px" }}>
            <div
              style={{
                width: `${uploadProgress}%`,
                height: "10px",
                backgroundColor: "#4caf50",
                borderRadius: "4px",
              }}
            ></div>
          </div>
          <p style={{ fontSize: "0.9rem", margin: "5px 0 0", color: "#555" }}>
            {uploadProgress}% uploaded
          </p>
        </div>
      )}
    </div>
  );
}
