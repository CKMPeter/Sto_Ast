import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  faFile,
  faFileAlt,
  faSearch,
  faTrash,
  faEdit,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
//import { ref, remove, update } from "../../../src/firebase";
//import { getDatabase } from "firebase/database";
import { useAuth } from "../../contexts/AuthContext";
import { FileClass } from "../classes/FileClass";
//darkmode
import { useDarkMode } from "../../hooks/useDarkMode"; // Adjust path if needed

export default function File({ file, onChange }) {
  const { currentUser, getIdToken } = useAuth();
  const fileObj = useMemo(
    () => new FileClass({ ...file, user: currentUser }),
    [file, currentUser]
  );

  const [showMainModal, setShowMainModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [fileContent, setFileContent] = useState(fileObj.decodeContent());
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedFileName, setUpdatedFileName] = useState(fileObj.name);
  //darkmode context
  const { darkMode } = useDarkMode(); // Use dark mode context

  // Rename/Preview states
  const [aiReName, setAiReName] = useState("");
  const [reName, setReName] = useState("");
  const [isFetchingAIRename, setIsFetchingAIRename] = useState(false);
  const isContentEdited = useRef(false);

  // Fetch AI rename/preview result based on task and file content
  const fetchAIWithTask = useCallback(
    async (base64Input, task, isImage = true) => {
      const token = await getIdToken();
      if (!token) {
        throw new Error("User not authenticated");
      }

      const api = task === "rename" ? "/api/aiRename" : "/api/aiPreview";
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL + api}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              input: base64Input,
              isImage,
              mimeType: isImage ? "image/jpeg" : "text/plain",
              fileName: fileObj.name,
            }),
          }
        );

        const data = await response.json();
        return data.result || null;
      } catch (error) {
        console.error("Error fetching AI response:", error);
        return null;
      }
    },
    [getIdToken, fileObj.name]
  );

  // Fetch AI rename when editing starts
  useEffect(() => {
    if (!isEditing) return;

    const fetchAIRename = async () => {
      setIsFetchingAIRename(true);

      try {
        const base64Content = fileObj.isImage
          ? fileObj.content
          : fileObj.decodeContent();

        // Fetch AI rename
        const aiRenameResult = await fetchAIWithTask(
          base64Content,
          "rename",
          fileObj.isImage
        );
        if (aiRenameResult && typeof aiRenameResult === "string") {
          let newName = aiRenameResult.trim();
          newName = newName.replace(/[^a-zA-Z0-9_.-]/g, "_"); // Sanitize name
          setAiReName(newName);
        }
      } catch (error) {
        console.error("AI fetch failed:", error.message);
      } finally {
        setIsFetchingAIRename(false);
      }
    };

    fetchAIRename();
  }, [isEditing, fileObj, fetchAIWithTask]);

  const handleFileClick = () => {
    setFileContent(fileObj.isText ? fileObj.decodeContent() : fileObj.content);
    setUpdatedFileName(fileObj.name);
    setShowMainModal(true);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      const token = await getIdToken();
      if (!token) {
        alert("User not authenticated");
        return;
      }
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/files/${fileObj.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filePath: fileObj.path,
            }),
          }
        );
        if (response.ok) {
          alert("File deleted successfully.");
          setShowMainModal(false);
          onChange();
        } else {
          alert("Error deleting file.");
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        alert("Error deleting file.");
      }
    }
  };

  const handleUpdate = () => setIsEditing(true);

  // Handle AI rename
  async function handleRename(ai = false) {
    if (!aiReName && !reName) {
      alert("Please provide a name using AI rename or custom rename.");
      return;
    }
    const name = ai ? aiReName : reName + fileObj.fileExtension;
    setUpdatedFileName(name);
  }

  const handleSaveUpdate = async () => {
    if (!updatedFileName.trim()) return alert("File name cannot be empty.");
    if (!fileContent.trim()) return alert("File content cannot be empty.");

    const token = await getIdToken();
    if (!token) {
      alert("User not authenticated");
      return;
    }

    try {
      // Fetch AI preview if needed
      let aiPreviewResult = fileObj.preview;
      if (isContentEdited.current) {
        const newPreview = await fetchAIWithTask(
          fileObj.content,
          "preview",
          fileObj.isImage
        );
        if (newPreview && typeof newPreview === "string") {
          aiPreviewResult = newPreview;
        }
      }

      // File update request
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/files/${fileObj.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: updatedFileName.trim(),
            content: fileObj.isImage ? fileContent : btoa(fileContent),
            preview: aiPreviewResult,
            filePath: fileObj.path,
          }),
        }
      );

      if (response.ok) {
        console.log("File updated successfully.");
        setIsEditing(false);
        setShowMainModal(false);
        onChange();
      } else {
        alert("Error updating file.");
      }
    } catch (error) {
      console.error("Error updating file:", error);
      alert("Error updating file.");
    }
  };

  const fetchAIResponse = async (task, isImage = false) => {
    const token = await getIdToken();
    if (!token) {
      throw new Error("User not authenticated");
    }

    let result = "Processing...";
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/ai`,
        {
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
        }
      );
      const data = await response.json();
      result = data.result || "No result returned.";
    } catch (error) {
      console.error("Error fetching AI response:", error);
      result = "Error processing content with AI.";
    }
    setAiResponse(result);
    setLoading(false);
  };

  const fetchAIDesrcibe = async (task, isImage = true) => {
    const token = await getIdToken();
    if (!token) {
      throw new Error("User not authenticated");
    }

    let result = "Processing...";
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/describe-image`,
        {
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
        }
      );
      const data = await response.json();
      result = data.result || "No result returned.";
    } catch (error) {
      console.error("Error fetching AI response:", error);
      result = "Error processing content with AI.";
    }
    setAiResponse(result);
    setLoading(false);
  };

  const closeModal = () => {
    setShowMainModal(false);
    setUpdatedFileName("");
    setFileContent("");
    setAiResponse("");
    setReName("");
    setAiReName("");
    setIsFetchingAIRename(false);
    setIsEditing(false);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const originalName = fileObj.name;

    // Extract file type from right to left until "_"
    const parts = originalName.split("_");
    const inferredExtension = parts.length > 1 ? parts.at(-1) : "txt"; // fallback to txt

    const baseName =
      originalName.substring(0, originalName.lastIndexOf("_")) || "download";
    const fileName = `${baseName}.${inferredExtension}`;

    if (fileObj.isText) {
      const fileBlob = new Blob([fileContent], {
        type: fileObj.mimeType || "text/plain",
      });
      element.href = URL.createObjectURL(fileBlob);
    } else if (fileObj.isImage) {
      element.href = `data:${fileObj.mimeType};base64,${fileObj.content}`;
    } else {
      const fileBlob = new Blob([fileObj.content], {
        type: fileObj.mimeType || "application/octet-stream",
      });
      element.href = URL.createObjectURL(fileBlob);
    }

    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      <Button
        onClick={handleFileClick}
        variant={darkMode ? "outline-light" : "outline-dark"}
        className={`text-truncate w-100 invert-hover`}
        style={{ cursor: "pointer", fontWeight: "bold" }}
        onContextMenu={(e) => {
          // Right-click to open preview modal
          e.preventDefault();
          setShowPreviewModal(true);
        }}
      >
        <FontAwesomeIcon
          icon={faFile}
          className="me-2 invert-hover"
          style={{ color: "inherit" }}
        />
        <span
          dangerouslySetInnerHTML={{
            __html:
              file.highlightedName && typeof file.highlightedName === "string"
                ? file.highlightedName
                : file.name,
          }}
        />
      </Button>

      {/* Modal for file details */}
      <Modal show={showMainModal}>
        <Modal.Header>
          <Modal.Title>
            {isEditing ? (
              <>
                <Form.Label className="form-label">
                  Current File name:{" "}
                  <span
                    style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}
                  >
                    {updatedFileName}
                  </span>
                </Form.Label>

                {/* Rename Options */}
                <Row>
                  <Col md="auto">
                    {/* AI Rename Option */}
                    <Form.Group>
                      <Form.Label>AI Rename</Form.Label>
                      <Form.Control
                        type="text"
                        value={aiReName}
                        placeholder="AI will suggest a name..."
                        readOnly
                        style={{ cursor: "not-allowed" }}
                      />
                      <Button
                        variant="outline-primary"
                        onClick={() => handleRename(true)}
                        disabled={!file || isFetchingAIRename}
                        style={{ marginTop: "10px" }}
                      >
                        Use AI Rename
                      </Button>
                    </Form.Group>
                  </Col>

                  <Col md="auto" offset={1}>
                    {/* Custom Rename Option */}
                    <Form.Group>
                      <Form.Label>Custom Rename</Form.Label>
                      <Form.Control
                        type="text"
                        value={reName}
                        placeholder="Enter custom name"
                        onChange={(e) => setReName(e.target.value)}
                        disabled={!file}
                      />
                      <Button
                        variant="outline-primary"
                        type="button"
                        onClick={() => handleRename()}
                        disabled={!reName}
                        style={{ marginTop: "10px" }}
                      >
                        Use Custom Name
                      </Button>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            ) : (
              <Form.Label className="form-label">
                File name:{" "}
                <span
                  style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}
                >
                  {fileObj.name}
                </span>
              </Form.Label>
            )}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              {fileObj.isImage ? (
                <>
                  <img
                    src={`data:${fileObj.mimeType};base64,${fileObj.content}`}
                    alt="file"
                    style={{ maxWidth: "100%", maxHeight: "400px" }}
                  />
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() => fetchAIDesrcibe("describe", true)}
                      disabled={isEditing}
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Describe Image
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => fetchAIDesrcibe("main_objects", true)}
                      disabled={isEditing}
                    >
                      <FontAwesomeIcon icon={faSearch} className="me-2" />
                      Identify Objects
                    </Button>
                  </div>
                </>
              ) : fileObj.isText ? (
                <>
                  <pre>{fileObj.decodeContent()}</pre>
                  {isEditing && (
                    <textarea
                      className={`form-control ${
                        darkMode ? "bg-dark text-light border-light" : ""
                      }`}
                      value={fileContent}
                      onChange={(e) => {
                        setFileContent(e.target.value);
                        isContentEdited.current = true; // Track content changes
                      }}
                      rows="10"
                      disabled={!isEditing}
                    />
                  )}
                  <div className="mt-3 d-flex flex-wrap gap-2">
                    <Button
                      variant="info"
                      onClick={handleDownload}
                      disabled={isEditing}
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Download
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => fetchAIResponse("summarize")}
                      disabled={isEditing}
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Summarize
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => fetchAIResponse("keywords")}
                      disabled={isEditing}
                    >
                      <FontAwesomeIcon icon={faSearch} className="me-2" />
                      Find Keywords
                    </Button>
                  </div>
                </>
              ) : (
                <p>{fileContent}</p>
              )}
              {aiResponse && (
                <div
                  className={`mt-3 p-3 rounded ${
                    darkMode ? "bg-secondary text-light" : "bg-light"
                  }`}
                >
                  <h5>AI Response:</h5>
                  <p>{aiResponse}</p>
                </div>
              )}
              <div className="mt-3 d-flex flex-wrap gap-2">
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
                <Button
                  variant="info"
                  onClick={handleDownload}
                  disabled={isEditing}
                >
                  <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                  Download
                </Button>
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="danger" onClick={handleDelete} disabled={isEditing}>
            <FontAwesomeIcon icon={faTrash} className="me-2" />
            Delete
          </Button>
          <Button
            variant={darkMode ? "light" : "secondary"}
            onClick={closeModal}
            disabled={isEditing}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Right-click preview modal */}
      <Modal show={showPreviewModal}>
        <Modal.Header>
          <Modal.Title>
            <Form.Label className="form-label">
              File name:{" "}
              <span style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>
                {fileObj.name}
              </span>
            </Form.Label>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Modal.Title>
            <Form.Label>File Preview</Form.Label>
          </Modal.Title>
          <textarea
            className={`form-control ${
              darkMode ? "bg-dark text-light border-light" : ""
            }`}
            style={{
              width: "100%",
              height: "100px",
              resize: "none",
            }}
            value={fileObj.preview}
            readOnly
            placeholder="No preview available"
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowPreviewModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
