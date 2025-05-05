import React, { useState } from "react";
import { faFile, faFileAlt, faSearch, faTrash, faEdit, faSave } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal, Button, Form } from "react-bootstrap";
import { ref, remove, update } from "../../../src/firebase";
import { getDatabase } from "firebase/database";
import { useAuth } from "../../contexts/AuthContext";

//const client = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
/*
async function run(input, task, isImage = false, mimeType = "image/jpeg") {
  const model = client.getGenerativeModel({
    model: isImage ? "gemini-pro-vision" : "gemini-2.0-flash",
  });
  const prompt =
    isImage && task === "describe"
      ? "Describe the image content."
      : isImage && task === "objects"
      ? "Identify key objects or elements in the image."
      : task === "summarize"
      ? `${input}\nSummarize the content of the file.`
      : `${input}\nExtract the main keywords from the file content.`;

  try {
    if (isImage) {
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: input, // base64 without data:image/...;base64,
        },
      };

      const result = await model.generateContent({
        contents: [{ parts: [prompt, imagePart] }],
      });

      const response = await result.response;
      return await response.text();
    } else {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return await response.text();
    }
  } catch (error) {
    console.error("Error generating AI content:", error);
    return "Error processing content with AI.";
  }
}
*/
const handleDeleteFirebase = async (fileId, currentUser) => {
  const db = getDatabase();
  const fileRef = ref(db, `files/${currentUser.uid}/${fileId}`);

  try {
    await remove(fileRef);
    alert("File deleted successfully.");
  } catch (error) {
    console.error("Error deleting file from Firebase:", error);
    alert("Error deleting file.");
  }
};

const handleUpdateFirebase = async (fileId, updatedName, updatedContent, currentUser) => {
  const db = getDatabase();
  const fileRef = ref(db, `files/${currentUser.uid}/${fileId}`);

  try {
    await update(fileRef, {
      name: updatedName.trim(),
      content: btoa(updatedContent),
    });
    alert("File updated successfully.");
  } catch (error) {
    console.error("Error updating file in Firebase:", error);
    alert("Error updating file.");
  }
};

export default function File({ file, onDelete, onUpdate }) {
  const [showModal, setShowModal] = useState(false);
  const [fileContent, setFileContent] = useState(atob(file.content || ""));
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedFileName, setUpdatedFileName] = useState(file.name);
  const { currentUser } = useAuth();

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

  const isImage =
    file.name &&
    (file.name.endsWith("_png") ||
      file.name.endsWith("_jpg") ||
      file.name.endsWith("_jpeg"));
  const isText = file.name && file.name.endsWith("_txt");

  const getMimeType = (filename) => {
    if (filename.endsWith("_png")) return "image/png";
    if (filename.endsWith("_jpg") || filename.endsWith("_jpeg")) return "image/jpeg";
    return "image/jpeg";
  };
/*
  const fetchAIResponse = async (task, isImageRequest = false) => {
    setLoading(true);
    try {
      const mimeType = isImageRequest ? getMimeType(file.name) : null;
      const base64Data = isImageRequest
        ? file.content // already base64, no need to decode
        : fileContent;
      const aiText = await run(base64Data, task, isImageRequest, mimeType);
      setAiResponse(aiText);
    } catch (error) {
      console.error("Error calling Google Generative AI API:", error);
      setAiResponse("Error processing content with AI.");
    }
    setLoading(false);
  };
*/
  const fetchAIResponse = async (task, isImageRequest = false) => {
    setLoading(true);
    try {
      const mimeType = isImageRequest ? getMimeType(file.name) : null;
      const base64Data = isImageRequest ? file.content : fileContent;

      const response = await fetch("http://localhost:5000/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: base64Data,
          task,
          isImage: isImageRequest,
          mimeType,
        }),
      });

      const data = await response.json();
      setAiResponse(data.result || "No result returned.");
    } catch (error) {
      console.error("Error calling backend AI API:", error);
      setAiResponse("Error processing content with AI.");
    }
    setLoading(false);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      handleDeleteFirebase(file.id, currentUser);
      onDelete?.(file);
      setShowModal(false);
    }
  };

  const handleUpdate = () => setIsEditing(true);

  const handleSaveUpdate = () => {
    if (!updatedFileName.trim()) {
      alert("File name cannot be empty.");
      return;
    }
    if (!fileContent.trim()) {
      alert("File content cannot be empty.");
      return;
    }

    handleUpdateFirebase(file.id, updatedFileName, fileContent, currentUser);
    onUpdate?.({ ...file, name: updatedFileName, content: btoa(fileContent) });
    setIsEditing(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setAiResponse("");
    setIsEditing(false);
  };

  return (
    <>
      <Button
        onClick={handleFileClick}
        variant="outline-dark"
        className="text-truncate w-100"
        style={{ cursor: "pointer" }}
      >
        <FontAwesomeIcon icon={faFile} style={{ marginRight: 6 }} />
        <span
          dangerouslySetInnerHTML={{
            __html:
              file.highlightedName && typeof file.highlightedName === "string"
                ? file.highlightedName
                : file.name,
          }}
        />
      </Button>

      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? (
              <Form.Control
                type="text"
                value={updatedFileName}
                onChange={(e) => setUpdatedFileName(e.target.value)}
                autoFocus
              />
            ) : (
              `File: ${file.name}`
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {isImage ? (
                <>
                  <img
                    src={`data:image/${file.name.split(".").pop()};base64,${file.content}`}
                    alt="file content"
                    style={{ maxWidth: "100%", maxHeight: "400px" }}
                  />
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => fetchAIResponse("describe", true)}>
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Describe Image
                    </Button>
                    <Button variant="secondary" onClick={() => fetchAIResponse("objects", true)}>
                      <FontAwesomeIcon icon={faSearch} className="me-2" />
                      Identify Objects
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                      <FontAwesomeIcon icon={faTrash} className="me-2" />
                      Delete
                    </Button>
                  </div>
                  {aiResponse && (
                    <div className="mt-3">
                      <h5>AI Response:</h5>
                      <p>{aiResponse}</p>
                    </div>
                  )}
                </>
              ) : isText ? (
                <>
                  <pre>{fileContent}</pre>
                  <textarea
                    className="form-control"
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    rows="10"
                    disabled={!isEditing}
                  />
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    <Button variant="primary" onClick={() => fetchAIResponse("summarize")}>
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Summarize
                    </Button>
                    <Button variant="secondary" onClick={() => fetchAIResponse("keywords")}>
                      <FontAwesomeIcon icon={faSearch} className="me-2" />
                      Find Keywords
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                      <FontAwesomeIcon icon={faTrash} className="me-2" />
                      Delete
                    </Button>
                    {isEditing ? (
                      <Button variant="success" onClick={handleSaveUpdate}>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Save Changes
                      </Button>
                    ) : (
                      <Button variant="warning" onClick={handleUpdate}>
                        <FontAwesomeIcon icon={faEdit} className="me-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {aiResponse && (
                    <div className="mt-3">
                      <h5>AI Response:</h5>
                      <p>{aiResponse}</p>
                    </div>
                  )}
                </>
              ) : (
                <p>{fileContent}</p>
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