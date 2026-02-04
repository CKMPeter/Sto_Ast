import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { realtimeDatabase } from "../../firebase";
import { ref, set, serverTimestamp } from "firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

export default function UploadProfilePictureButton({ onUploadComplete }) {
  const { currentUser } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Sanitize filename to avoid Firebase key issues
  function sanitizeFileName(fileName) {
    return fileName.replace(/[.#$[\]]/g, "_");
  }

  function handleUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentUser) return;

    // Accept only image files
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const base64File = reader.result.split(",")[1];
      const sanitizedFileName = sanitizeFileName(file.name);
      console.log("reader.result:", reader.result);
      console.log("Base64 length:", base64File?.length);
      // Save profile picture under a known path in Realtime Database
      // e.g. users/{uid}/profilePicture
      const profilePicRef = ref(
        realtimeDatabase,
        `users/${currentUser.uid}/profilePicture`
      );

      setIsUploading(true);
      setUploadProgress(0);

      // Simulate progress (you can replace with real upload progress if using Storage SDK)
      const fakeUploadInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(fakeUploadInterval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Upload Base64 image to Realtime Database
      setTimeout(() => {
        set(profilePicRef, {
          name: sanitizedFileName,
          content: base64File,
          createdAt: serverTimestamp(),
        })
          .then(() => {
            onUploadComplete && onUploadComplete();
            console.log("Upload successful")
          })
          .catch((error) => {
            console.error("Error uploading profile picture:", error);
            alert("Failed to upload profile picture.");
            setIsUploading(false);
          });
      }, 2000);
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Failed to read the selected file.");
    };

    reader.readAsDataURL(file);
  }

  return (
    <div className="d-flex align-items-center flex-column">
      <label
        className="btn btn-outline-primary btn-sm"
        style={{ cursor: "pointer" }}
        title="Upload Profile Picture"
      >
        <FontAwesomeIcon icon={faCamera} style={{ fontSize: "2rem" }} />
        <input
          type="file"
          accept="image/*"
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
              height: "10px",
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: "100%",
                backgroundColor: "#007bff",
                borderRadius: "4px",
                transition: "width 0.2s ease",
              }}
            ></div>
          </div>
          <p
            style={{
              fontSize: "0.9rem",
              margin: "5px 0 0",
              color: "#555",
              textAlign: "center",
            }}
          >
            {uploadProgress}% uploaded
          </p>
        </div>
      )}
    </div>
  );
}
