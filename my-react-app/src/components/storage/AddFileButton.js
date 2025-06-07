import React, { useCallback, useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp } from "@fortawesome/free-solid-svg-icons";
import { ROOT_FOLDER } from "../../hooks/useFolder";
import { Button, Modal, Form, Alert, Col, Row } from "react-bootstrap";
import { useDarkMode } from "../../hooks/useDarkMode";

export default function AddFileButton({ currentFolder, onAdd }) {
  const { currentUser, getIdToken } = useAuth();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [currentName, setCurrentName] = useState("");
  const [aiReName, setAiReName] = useState("");
  const [reName, setReName] = useState("");
  const [preview, setPreview] = useState("");
  const [isFetchingAIRename, setIsFetchingAIRename] = useState(false);
  const [isFetchingAIPreview, setIsFetchingAIPreview] = useState(false);
  const { darkMode } = useDarkMode();

  const fetchAI = useCallback(
    async (base64Input, task, isImage = true) => {
      const token = await getIdToken();
      if (!token) throw new Error("User not authenticated");

      const api = task === "rename" ? "/api/aiRename" : "/api/aiPreview";

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL + api}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: base64Input,
            isImage,
            mimeType: isImage ? "image/jpeg" : "text/plain",
            fileName: file.name,
          }),
        });

        const data = await response.json();
        return data.result || null;
      } catch (error) {
        console.error("Error fetching AI response:", error);
        return null;
      }
    },
    [getIdToken, file]
  );

  useEffect(() => {
    if (!open || !file) return;

    const fetchAIResults = async () => {
      setIsFetchingAIRename(true);
      setIsFetchingAIPreview(true);

      try {
        const base64Content = await fileToBase64(file);

        const aiRenameResult = await fetchAI(base64Content, "rename", file.type.startsWith("image/"));
        if (aiRenameResult && typeof aiRenameResult === "string") {
          let newName = sanitizeFileName(aiRenameResult.trim());
          setAiReName(newName);
        } else {
          setError("AI rename failed or returned invalid result");
        }

        const aiPreviewResult = await fetchAI(base64Content, "preview", file.type.startsWith("image/"));
        if (aiPreviewResult && typeof aiPreviewResult === "string") {
          setPreview(aiPreviewResult.trim());
        } else {
          setError("AI preview failed or returned invalid result");
        }
      } catch (error) {
        console.error("AI fetch failed:", error.message);
        setError("AI fetch failed: " + error.message);
      } finally {
        setIsFetchingAIRename(false);
        setIsFetchingAIPreview(false);
      }
    };

    fetchAIResults();
  }, [open, file, fetchAI]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  function openModal() {
    setOpen(true);
  }

  function closeModal() {
    setError("");
    setSuccess("");
    setFile(null);
    setCurrentName("");
    setAiReName("");
    setReName("");
    setPreview("");
    setIsFetchingAIRename(false);
    setIsFetchingAIPreview(false);
    setUploadProgress(0);
    setIsUploading(false);
    setOpen(false);
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) {
      setError("No file selected.");
      setSuccess("");
      setFile(null);
      setCurrentName("");
      return;
    }

    setReName("");
    setAiReName("");
    setPreview("");
    setFile(file);
    setCurrentName(file.name);
  }

  async function handleRename(ai = false) {
    if (!aiReName && !reName) {
      alert("Please provide a name using AI rename or custom rename.");
      return;
    }
    const name = ai
      ? aiReName
      : reName + file.name.slice(file.name.lastIndexOf("."));
    setCurrentName(name);
  }

  function sanitizeFileName(fileName) {
    return fileName.replace(/[^a-zA-Z0-9_.-]/g, "_");
  }

  function getFilePathSegments(currentFolder) {
    return currentFolder === ROOT_FOLDER
      ? currentFolder.path.map((folder) => folder.id)
      : [...currentFolder.path.map((folder) => folder.id), currentFolder.id];
  }

  function fileToBase64(file) {
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file || !currentFolder || !currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);
    for (let i = 1; i <= 80; i++) {
      setUploadProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 8));
    }

    try {
      const base64Content = await fileToBase64(file);
      const pathSegments = getFilePathSegments(currentFolder);
      const sanitizedFileName = sanitizeFileName(currentName || file.name);
      const filePath = [...pathSegments, sanitizedFileName].join("/");
      const token = await getIdToken();
      if (!token) throw new Error("User not authenticated");

      const body = JSON.stringify({
        name: sanitizedFileName,
        content: base64Content || "none",
        preview,
        path: filePath,
        folderId: currentFolder?.id || null,
      });

      setUploadProgress(85);
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/files`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body,
        }
      );

      for (let i = 86; i <= 100; i++) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || response.statusText);
      }

      setOpen(false);
      if (onAdd) onAdd();
    } catch (error) {
      setError(`Upload failed: ${error.message || "An error occurred"}`);
      setSuccess("");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setFile(null);
      setCurrentName("");
      setAiReName("");
      setReName("");
      setPreview("");
      setIsFetchingAIRename(false);
      setIsFetchingAIPreview(false);
      e.target.value = null;
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap">
      <div className="d-flex align-items-center flex-grow-1">
        <Button
          onClick={openModal}
          variant="outline-success"
          size="sm"
          style={{ marginRight: "5px" }}
        >
          <FontAwesomeIcon icon={faFileArrowUp} style={{ fontSize: "2rem" }} />
        </Button>

        <Modal
          show={open}
          onHide={closeModal}
          dialogClassName="custom-modal"
          contentClassName={darkMode ? "bg-dark text-light" : ""}
        >
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>
                <FontAwesomeIcon icon={faFileArrowUp} /> Add File
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {error && <Alert variant={darkMode ? "dark" : "danger"}>{error}</Alert>}
              {success && <Alert variant={darkMode ? "dark" : "success"}>{success}</Alert>}

              <Form.Group>
                <Form.Label>Upload File</Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleUpload}
                  required
                  style={{
                    marginTop: "10px",
                    backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
                    color: darkMode ? "#fff" : "#000",
                  }}
                />
              </Form.Group>

              {file && (
                <Form.Label className="form-label">
                  New File Name: {currentName || file.name}
                </Form.Label>
              )}

              <Row>
                <Col md="auto">
                  <Form.Group>
                    <Form.Label>AI Rename</Form.Label>
                    <Form.Control
                      type="text"
                      value={aiReName}
                      placeholder="AI will suggest a name..."
                      readOnly
                      style={{
                        cursor: "not-allowed",
                        backgroundColor: darkMode ? "#2a2a2a" : "#f8f9fa",
                        color: darkMode ? "#ccc" : "#000",
                      }}
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
                  <Form.Group>
                    <Form.Label>Custom Rename</Form.Label>
                    <Form.Control
                      type="text"
                      value={reName}
                      placeholder="Enter custom name"
                      onChange={(e) => setReName(e.target.value)}
                      style={{
                        backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
                        color: darkMode ? "#fff" : "#000",
                      }}
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

              <Form.Group>
                <Form.Label>File Preview</Form.Label>
                <div
                  className="form-control"
                  style={{
                    backgroundColor: darkMode ? "#2a2a2a" : "#f8f9fa",
                  }}
                >
                  {isFetchingAIPreview ? (
                    <p>Loading preview...</p>
                  ) : (
                    <textarea
                      value={preview}
                      readOnly
                      style={{
                        width: "100%",
                        height: "100px",
                        resize: "none",
                        backgroundColor: "transparent",
                        border: "none",
                        color: darkMode ? "#fff" : "#000",
                      }}
                      placeholder="No preview available"
                    />
                  )}
                </div>
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
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
                  <p style={{ fontSize: "0.9rem", margin: "5px 0 0", color: "#bbb" }}>
                    {uploadProgress}% uploaded
                  </p>
                </div>
              )}
              <Button variant="secondary" onClick={closeModal}>
                Close
              </Button>
              <Button variant="success" type="submit">
                Add File
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
