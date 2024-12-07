import React, { useState, useEffect } from "react";
import { faFile, faFileAlt, faSearch, faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal, Button, Form } from "react-bootstrap";
import '../../include/App.css';
import { database, ref, remove, update } from "../../../src/firebase";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDatabase } from "firebase/database";
import { useAuth } from "../../contexts/AuthContext";

console.log('API Key:', process.env.REACT_APP_GEMINI_API_KEY);

const client = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

// Function to run AI tasks (summarize or extract keywords)
async function run(input, task) {
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
  });

  const prompt =
    task === "summarize"
      ? `${input}\nSummarize the content of the file.`
      : `${input}\nExtract the main keywords from the file content.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    console.log(text);
    return text;
  } catch (error) {
    console.error("Error generating AI content:", error);
    return "Error processing content with AI.";
  }
}

// Firebase delete function
const handleDeleteFirebase = async (fileId, currentUser) => {
  const db = getDatabase();  // Initialize Firebase Database
  const fileRef = ref(db, `files/${currentUser.uid}/` + fileId);  // Get reference to the specific file

  try {
    await remove(fileRef);  // Delete the file from Firebase
    alert("File deleted successfully");
  } catch (error) {
    console.error("Error deleting file from Firebase:", error);
    alert("Error deleting file.");
  }
};

// Firebase update function
const handleUpdateFirebase = async (fileId, updatedName, currentUser) => {
  const db = getDatabase();  // Initialize Firebase Database
  const fileRef =  ref(db, `files/${currentUser.uid}/` + fileId); // Get reference to the specific file

  try {
    await update(fileRef, { name: updatedName });  // Update file name in Firebase
    alert("File updated successfully");
  } catch (error) {
    console.error("Error updating file in Firebase:", error);
    alert("Error updating file.");
  }
};
export default function File({ file, onDelete, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [task, setTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedFileName, setUpdatedFileName] = useState(file.name);
  const {currentUser} = useAuth()

  // Decode base64 content if necessary
  const decodeBase64Content = (base64Content) => {
    try {
      const decodedContent = atob(base64Content);
      setFileContent(decodedContent);
    } catch (error) {
      console.error("Error decoding base64 content:", error);
      setFileContent("Error decoding content.");
    }
  };

  const handleFileClick = () => {
    if (file.content) {
      setLoading(true);
      if (file.name.endsWith("_txt")) {
        decodeBase64Content(file.content);
      } else {
        setFileContent(file.content);
      }
      setLoading(false);
      setShowModal(true);
    } else {
      console.error("No content found for this file.");
    }
  };

  useEffect(() => {
    if (fileContent && task) {
      fetchAIResponse(task);
    }
  }, [fileContent, task]);

  const fetchAIResponse = async (task) => {
    if (!fileContent) {
      setAiResponse("No content to send to AI.");
      return;
    }

    setLoading(true);

    try {
      const aiText = await run(fileContent, task);
      console.log(aiText);
      setAiResponse(aiText);
    } catch (error) {
      console.error("Error calling Google Generative AI API:", error);
      setAiResponse("Error processing content with AI.");
    }

    setLoading(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      handleDeleteFirebase(file.id, currentUser); // Call Firebase delete function
      onDelete(file); // Call the onDelete prop to remove the file from UI
      setShowModal(false); // Close the modal after deletion
    }
  };

  const handleUpdate = () => {
    setIsEditing(true); // Enable editing mode for file name
  };

  const handleSaveUpdate = () => {
    if (updatedFileName.trim()) {
      handleUpdateFirebase(file.id, updatedFileName, currentUser); // Update file name in Firebase
      const updatedFile = { ...file, name: updatedFileName }; // Update local file state
      onUpdate(updatedFile); // Call onUpdate prop to update the file list in parent
      setIsEditing(false); // Exit editing mode
    } else {
      alert("File name cannot be empty.");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setFileContent("");
    setAiResponse("");
    setTask("");
    setIsEditing(false);
  };

  const isImage =
    file.name && (file.name.endsWith("_png") || file.name.endsWith("_jpg") || file.name.endsWith("_jpeg"));
  const isText = file.name && file.name.endsWith("_txt");

  return (
    <>
      <a
        onClick={handleFileClick}
        className="btn btn-outline-dark text-truncate w-100 mr-2"
        style={{ cursor: "pointer", fontFamily: "'Roboto', sans-serif" }}
      >
        <FontAwesomeIcon icon={faFile} style={{ marginRight: 4 }} />
        {file.name}
      </a>

      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? (
              <Form.Control
                type="text"
                value={updatedFileName}
                onChange={(e) => setUpdatedFileName(e.target.value)}
                style={{ fontSize: "16px" }}
              />
            ) : (
              `File Content: ${file.name}`
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            fontFamily: "'Roboto', sans-serif",
            fontSize: "14px",
          }}
        >
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {isImage ? (
                <img
                  src={`data:image/${file.name.split(".").pop()};base64,${file.content}`}
                  alt="file content"
                  style={{ maxWidth: "100%", maxHeight: "400px" }}
                />
              ) : isText ? (
                <pre>{fileContent}</pre>
              ) : (
                <p>{fileContent}</p>
              )}

              {isText && (
                <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <Button
                    variant="primary"
                    onClick={() => setTask("summarize")}
                  >
                    <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: "5px" }} />
                    Summarize File
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setTask("keywords")}
                  >
                    <FontAwesomeIcon icon={faSearch} style={{ marginRight: "5px" }} />
                    Find Keywords
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                  >
                    <FontAwesomeIcon icon={faTrash} style={{ marginRight: "5px" }} />
                    Delete
                  </Button>
                  {isEditing ? (
                    <Button
                      variant="success"
                      onClick={handleSaveUpdate}
                    >
                      <FontAwesomeIcon icon={faEdit} style={{ marginRight: "5px" }} />
                      Save
                    </Button>
                  ) : (
                    <Button
                      variant="warning"
                      onClick={handleUpdate}
                    >
                      <FontAwesomeIcon icon={faEdit} style={{ marginRight: "5px" }} />
                      Update
                    </Button>
                  )}
                </div>
              )}

              {aiResponse && (
                <div>
                  <h5>AI Response:</h5>
                  <p>{aiResponse}</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
