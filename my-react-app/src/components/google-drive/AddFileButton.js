import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { realtimeDatabase } from "../../firebase"; // Import Realtime Database
import { ref, set, serverTimestamp } from "firebase/database";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFileArrowUp } from "@fortawesome/free-solid-svg-icons"
import { ROOT_FOLDER } from "../../hooks/useFolder";

export default function AddFileButton({ currentFolder }) {
  const { currentUser } = useAuth();

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
          ? `${currentFolder.path.map(folder => folder.id).join("/")}/${sanitizedFileName}`
          : `${currentFolder.path.map(folder => folder.id).join("/")}/${currentFolder.id}/${sanitizedFileName}`;

      console.log("current folder path:", currentFolder.path.map(folder => folder.id)); // Log the folder ids
      console.log("file path:", filePath);

      // Reference to the Realtime Database
      const fileRef = ref(realtimeDatabase, `files/${currentUser.uid}/${filePath}`);
  
      set(fileRef, {
        name: sanitizedFileName,
        content: base64File,
        path: filePath,
        createdAt: serverTimestamp(),
        folderId: currentFolder.id,
      })
        .then(() => {
          console.log("File uploaded successfully!");
        })
        .catch((error) => {
          console.error("Error uploading file:", error);
        });
    };
  
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
    };
  
    reader.readAsDataURL(file); // Convert file to Base64
  }
  

  return (
    <label className="btn btn-outline-success btn-sm m-0 mr-2">
      <FontAwesomeIcon icon={faFileArrowUp} style= {{fontSize: '2rem'}}/>
      <input
        type="file"
        onChange={handleUpload}
        style={{ opacity: 0, position: "absolute", left: "-9999px" }}
      />
    </label>
  );
}
