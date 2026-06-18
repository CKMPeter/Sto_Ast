import React, { useCallback, useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileArrowUp } from "@fortawesome/free-solid-svg-icons";
import { Button, Modal, Form, Alert, Col, Row } from "react-bootstrap";

import {
  fileToBase64,
  sanitizeFileName,
  fetchAIFileService,
  uploadFileService,
} from "../../services/storageService/fileService";

export default function AddFileButton({ currentFolder, onAdd, darkMode }) {
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

  const [isHoveringUpload, setIsHoveringUpload] = useState(false);

  const fetchAI = useCallback(
    async (base64Input, task, isImage = true) => {
      try {
        return await fetchAIFileService({
          getIdToken,
          file,
          base64Input,
          task,
          isImage,
        });
      } catch (error) {
        console.error("Error fetching AI response:", error);
        return null;
      }
    },
    [getIdToken, file],
  );

  useEffect(() => {
    if (!open || !file) return;

    const fetchAIResults = async () => {
      setIsFetchingAIRename(true);
      setIsFetchingAIPreview(true);

      try {
        const base64Content = await fileToBase64(file);

        const isImage = file.type.startsWith("image/");

        const aiRenameResult = await fetchAI(base64Content, "rename", isImage);

        if (aiRenameResult && typeof aiRenameResult === "string") {
          const newName = sanitizeFileName(aiRenameResult.trim());
          setAiReName(newName);
        } else {
          setError("AI rename failed or returned invalid result");
        }

        const aiPreviewResult = await fetchAI(
          base64Content,
          "preview",
          isImage,
        );

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
    if (!error && !success) return;

    const timer = setTimeout(() => {
      setError("");
      setSuccess("");
    }, 3000);

    return () => clearTimeout(timer);
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
    const selectedFile = e.target.files[0];

    if (!selectedFile) {
      setError("No file selected.");
      setSuccess("");
      setFile(null);
      setCurrentName("");
      return;
    }

    setReName("");
    setAiReName("");
    setPreview("");
    setError("");
    setSuccess("");

    setFile(selectedFile);
    setCurrentName(selectedFile.name);
  }

  async function handleRename(ai = false) {
    if (!file) return;

    if (!aiReName && !reName) {
      setError("Please provide a name using AI rename or custom rename.");
      return;
    }

    const extension = file.name.includes(".")
      ? file.name.slice(file.name.lastIndexOf("."))
      : "";

    const name = ai ? aiReName : sanitizeFileName(reName) + extension;

    setCurrentName(name);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file || !currentFolder || !currentUser) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 1; i <= 80; i++) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 8));
      }

      await uploadFileService({
        getIdToken,
        file,
        currentName,
        currentFolder,
        preview,
      });

      for (let i = 81; i <= 100; i++) {
        setUploadProgress(i);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      setSuccess("File uploaded successfully.");

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
    }
  }

  return (
    <div style={styleSheet.wrapper}>
      <div style={styleSheet.innerWrapper}>
        <Button
          onClick={openModal}
          variant={darkMode ? "outline-light" : "outline-primary"}
          size="sm"
          onMouseEnter={() => setIsHoveringUpload(true)}
          onMouseLeave={() => setIsHoveringUpload(false)}
          style={{
            ...styleSheet.openButton,
            borderColor: darkMode ? "#f8f9fa" : "#0077b6",
            color: isHoveringUpload
              ? "#ffffff"
              : darkMode
                ? "#f8f9fa"
                : "#0077b6",
            backgroundColor: isHoveringUpload
              ? darkMode
                ? "#0077b6"
                : "#0077b6"
              : "transparent",
            transform: isHoveringUpload
              ? "translateY(-2px) scale(1.05)"
              : "none",
            boxShadow: isHoveringUpload
              ? "0 6px 14px rgba(0, 119, 182, 0.35)"
              : "none",
            transition: "all 0.2s ease",
          }}
        >
          <FontAwesomeIcon icon={faFileArrowUp} style={styleSheet.openIcon} />
        </Button>

        <Modal
          show={open}
          onHide={closeModal}
          size="lg"
          centered
          contentClassName={darkMode ? "bg-dark text-light" : ""}
        >
          <Form onSubmit={handleSubmit}>
            <Modal.Header closeButton>
              <Modal.Title>
                <FontAwesomeIcon icon={faFileArrowUp} /> Add File
              </Modal.Title>
            </Modal.Header>

            <Modal.Body>
              {error && (
                <Alert variant={darkMode ? "dark" : "danger"}>{error}</Alert>
              )}

              {success && (
                <Alert variant={darkMode ? "dark" : "success"}>{success}</Alert>
              )}

              <Form.Group style={styleSheet.formGroup}>
                <Form.Label>Upload File</Form.Label>
                <Form.Control
                  type="file"
                  onChange={handleUpload}
                  required
                  style={{
                    ...styleSheet.input,
                    backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
                    color: darkMode ? "#ffffff" : "#000000",
                  }}
                />
              </Form.Group>

              {file && (
                <Form.Label style={styleSheet.currentName}>
                  New File Name: {currentName || file.name}
                </Form.Label>
              )}

              <Row style={styleSheet.renameRow}>
                <Col xs={12} md={6}>
                  <Form.Group style={styleSheet.formGroup}>
                    <Form.Label>AI Rename</Form.Label>

                    <Form.Control
                      type="text"
                      value={aiReName}
                      placeholder={
                        isFetchingAIRename
                          ? "AI is generating name..."
                          : "AI will suggest a name..."
                      }
                      readOnly
                      style={{
                        ...styleSheet.input,
                        backgroundColor: darkMode ? "#2a2a2a" : "#f8f9fa",
                        color: darkMode ? "#cccccc" : "#000000",
                      }}
                    />

                    <Button
                      variant="outline-primary"
                      onClick={() => handleRename(true)}
                      disabled={!file || isFetchingAIRename || !aiReName}
                      style={styleSheet.actionButton}
                    >
                      Use AI Rename
                    </Button>
                  </Form.Group>
                </Col>

                <Col xs={12} md={6}>
                  <Form.Group style={styleSheet.formGroup}>
                    <Form.Label>Custom Rename</Form.Label>

                    <Form.Control
                      type="text"
                      value={reName}
                      placeholder="Enter custom name"
                      onChange={(e) => setReName(e.target.value)}
                      style={{
                        ...styleSheet.input,
                        backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
                        color: darkMode ? "#ffffff" : "#000000",
                      }}
                      disabled={!file}
                    />

                    <Button
                      variant="outline-primary"
                      type="button"
                      onClick={() => handleRename(false)}
                      disabled={!file || !reName}
                      style={styleSheet.actionButton}
                    >
                      Use Custom Name
                    </Button>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group style={styleSheet.formGroup}>
                <Form.Label>File Preview</Form.Label>

                <div
                  style={{
                    ...styleSheet.previewBox,
                    backgroundColor: darkMode ? "#2a2a2a" : "#f8f9fa",
                    borderColor: darkMode ? "#555555" : "#dee2e6",
                  }}
                >
                  {isFetchingAIPreview ? (
                    <p style={styleSheet.previewLoading}>Loading preview...</p>
                  ) : (
                    <textarea
                      value={preview}
                      readOnly
                      placeholder="No preview available"
                      style={{
                        ...styleSheet.previewTextArea,
                        color: darkMode ? "#ffffff" : "#000000",
                      }}
                    />
                  )}
                </div>
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              {isUploading && (
                <div style={styleSheet.progressWrapper}>
                  <div style={styleSheet.progressContainer}>
                    <div
                      style={{
                        ...styleSheet.progressBar,
                        width: `${uploadProgress}%`,
                      }}
                    />
                  </div>

                  <p style={styleSheet.progressText}>
                    {uploadProgress}% uploaded
                  </p>
                </div>
              )}

              <Button variant="secondary" onClick={closeModal}>
                Close
              </Button>

              <Button
                variant="success"
                type="submit"
                disabled={!file || isUploading || !currentName}
              >
                Add File
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </div>
  );
}

const styleSheet = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    zIndex: 1,
  },

  innerWrapper: {
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
  },

  openButton: {
    marginRight: "5px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "10px",
  },

  openIcon: {
    fontSize: "2rem",
  },

  formGroup: {
    marginBottom: "1rem",
  },

  input: {
    marginTop: "10px",
  },

  currentName: {
    marginTop: "0.75rem",
    fontWeight: "600",
    wordBreak: "break-word",
  },

  renameRow: {
    rowGap: "1rem",
  },

  actionButton: {
    marginTop: "10px",
  },

  previewBox: {
    border: "1px solid",
    borderRadius: "0.375rem",
    padding: "0.75rem",
  },

  previewLoading: {
    margin: 0,
  },

  previewTextArea: {
    width: "100%",
    height: "100px",
    resize: "none",
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
  },

  progressWrapper: {
    marginTop: "10px",
    width: "100%",
  },

  progressContainer: {
    width: "100%",
    backgroundColor: "#f3f3f3",
    borderRadius: "4px",
    overflow: "hidden",
  },

  progressBar: {
    height: "10px",
    backgroundColor: "#0077b6",
    borderRadius: "4px",
    transition: "width 0.2s",
  },

  progressText: {
    fontSize: "0.9rem",
    margin: "5px 0 0",
    color: "#6c757d",
  },
};
