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
  faDownload,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal, Button, Form, Row, Col, Badge, Spinner } from "react-bootstrap";

import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../hooks/useDarkMode";
import { FileClass } from "../../classes/storageClass/FileClass";

import {
  sanitizeFileName,
  fetchAIWithTaskService,
  deleteFileService,
  updateFileService,
  runAIFileService,
} from "../../services/storageService/fileActionService";

export default function File({ file, onChange }) {
  const { currentUser, getIdToken } = useAuth();
  const { darkMode } = useDarkMode();

  const fileObj = useMemo(
    () => new FileClass({ ...file, user: currentUser }),
    [file, currentUser],
  );

  const [showMainModal, setShowMainModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedFileName, setUpdatedFileName] = useState(fileObj.name);
  const [aiReName, setAiReName] = useState("");
  const [reName, setReName] = useState("");
  const [isFetchingAIRename, setIsFetchingAIRename] = useState(false);
  const [linkedDates, setLinkedDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  const isContentEdited = useRef(false);

  const modalClass = darkMode ? "bg-dark text-light" : "bg-white text-dark";
  const inputClass = darkMode ? "bg-dark text-light border-light" : "";
  const neutralButton = darkMode ? "outline-light" : "outline-dark";
  const mainButton = darkMode ? "light" : "dark";

  const fetchAIWithTask = useCallback(
    async (input, task, isImage = true) => {
      try {
        return await fetchAIWithTaskService({
          getIdToken,
          fileObj,
          input,
          task,
          isImage,
        });
      } catch (error) {
        console.error("AI task error:", error);
        return null;
      }
    },
    [getIdToken, fileObj],
  );

  useEffect(() => {
    if (!isEditing) return;

    async function fetchAIRename() {
      setIsFetchingAIRename(true);

      try {
        const content = fileObj.isImage
          ? fileObj.content
          : fileObj.decodeContent();

        const result = await fetchAIWithTask(content, "rename", fileObj.isImage);

        if (result && typeof result === "string") {
          setAiReName(sanitizeFileName(result.trim()));
        }
      } catch (error) {
        console.error("AI rename failed:", error);
      } finally {
        setIsFetchingAIRename(false);
      }
    }

    fetchAIRename();
  }, [isEditing, fileObj, fetchAIWithTask]);

  function openMainModal() {
    setFileContent(fileObj.isText ? fileObj.decodeContent() : fileObj.content);
    setUpdatedFileName(fileObj.name);
    setShowMainModal(true);
  }

  function closeMainModal() {
    setShowMainModal(false);
    setIsEditing(false);
    setAiResponse("");
    setReName("");
    setAiReName("");
    setSelectedDate("");
    setIsFetchingAIRename(false);
    isContentEdited.current = false;
  }

  function handleRename(useAI = false) {
    const selectedName = useAI ? aiReName : reName;

    if (!selectedName.trim()) {
      alert("Please provide a name using AI rename or custom rename.");
      return;
    }

    const finalName = useAI
      ? selectedName
      : `${selectedName}${fileObj.fileExtension}`;

    setUpdatedFileName(finalName);
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteFileService({ getIdToken, fileObj });
      alert("File deleted successfully.");
      setShowMainModal(false);
      onChange();
    } catch (error) {
      console.error("Delete error:", error);
      alert(error.message || "Error deleting file.");
    }
  }

  async function handleSaveUpdate() {
    if (!updatedFileName.trim()) {
      alert("File name cannot be empty.");
      return;
    }

    if (fileObj.isText && !fileContent.trim()) {
      alert("File content cannot be empty.");
      return;
    }

    try {
      let preview = fileObj.preview;

      if (isContentEdited.current) {
        const previewInput = fileObj.isImage
          ? fileObj.content
          : btoa(fileContent);

        const newPreview = await fetchAIWithTask(
          previewInput,
          "preview",
          fileObj.isImage,
        );

        if (newPreview && typeof newPreview === "string") {
          preview = newPreview;
        }
      }

      await updateFileService({
        getIdToken,
        fileObj,
        updatedFileName,
        fileContent,
        preview,
        linkedDates,
      });

      setIsEditing(false);
      setShowMainModal(false);
      onChange();
    } catch (error) {
      console.error("Update error:", error);
      alert(error.message || "Error updating file.");
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setUpdatedFileName(fileObj.name);
    setFileContent(fileObj.decodeContent());
    setAiReName("");
    setReName("");
    setLinkedDates([]);
    isContentEdited.current = false;
  }

  async function handleRunAI(task, isImage = false, endpoint = "/api/ai") {
    setLoading(true);

    try {
      const result = await runAIFileService({
        getIdToken,
        fileObj,
        task,
        isImage,
        endpoint,
      });

      setAiResponse(result);
    } catch (error) {
      console.error("AI error:", error);
      setAiResponse("Error processing content with AI.");
    } finally {
      setLoading(false);
    }
  }

  function handleAddDate() {
    if (!selectedDate) return;

    if (!linkedDates.includes(selectedDate)) {
      setLinkedDates((prev) => [...prev, selectedDate]);
    }

    setSelectedDate("");
  }

  function handleRemoveDate(date) {
    setLinkedDates((prev) => prev.filter((item) => item !== date));
  }

  function handleDownload() {
    const element = document.createElement("a");
    const originalName = fileObj.name;

    const parts = originalName.split("_");
    const inferredExtension = parts.length > 1 ? parts.at(-1) : "txt";
    const baseName =
      originalName.substring(0, originalName.lastIndexOf("_")) || "download";

    element.download = `${baseName}.${inferredExtension}`;

    if (fileObj.isText) {
      const blob = new Blob([fileContent], {
        type: fileObj.mimeType || "text/plain",
      });

      element.href = URL.createObjectURL(blob);
    } else if (fileObj.isImage) {
      element.href = `data:${fileObj.mimeType};base64,${fileObj.content}`;
    } else {
      const blob = new Blob([fileObj.content], {
        type: fileObj.mimeType || "application/octet-stream",
      });

      element.href = URL.createObjectURL(blob);
    }

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <>
      <Button
        onClick={openMainModal}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowPreviewModal(true);
        }}
        variant={neutralButton}
        className="text-truncate w-100 invert-hover"
        style={styleSheet.fileButton}
      >
        <FontAwesomeIcon icon={faFile} className="me-2" />
        <span
          dangerouslySetInnerHTML={{
            __html:
              file.highlightedName && typeof file.highlightedName === "string"
                ? file.highlightedName
                : file.name,
          }}
        />
      </Button>

      <Modal show={showMainModal} onHide={closeMainModal} size="lg" centered>
        <Modal.Header closeButton className={modalClass}>
          <Modal.Title style={styleSheet.modalTitle}>
            <div className="d-flex flex-column gap-1">
              <span>{isEditing ? "Edit File" : "File Details"}</span>
              <small style={styleSheet.fileNameText}>{updatedFileName}</small>
            </div>
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className={modalClass}>
          {isEditing && (
            <div
              className={`p-3 mb-3 rounded border ${
                darkMode ? "border-light" : ""
              }`}
            >
              <h6>Rename File</h6>

              <Row className="g-3">
                <Col md={6}>
                  <Form.Label>AI Rename</Form.Label>
                  <Form.Control
                    className={inputClass}
                    value={aiReName}
                    readOnly
                    placeholder={
                      isFetchingAIRename
                        ? "Generating name..."
                        : "AI suggested name"
                    }
                  />

                  <Button
                    variant={neutralButton}
                    className="mt-2"
                    onClick={() => handleRename(true)}
                    disabled={!aiReName || isFetchingAIRename}
                  >
                    Use AI Rename
                  </Button>
                </Col>

                <Col md={6}>
                  <Form.Label>Custom Rename</Form.Label>
                  <Form.Control
                    className={inputClass}
                    value={reName}
                    placeholder="Enter custom file name"
                    onChange={(e) => setReName(e.target.value)}
                  />

                  <Button
                    variant={neutralButton}
                    className="mt-2"
                    onClick={() => handleRename(false)}
                    disabled={!reName}
                  >
                    Use Custom Name
                  </Button>
                </Col>
              </Row>

              <hr />

              <Form.Label>Link Dates</Form.Label>

              <div className="d-flex gap-2">
                <Form.Control
                  type="date"
                  className={inputClass}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />

                <Button variant={neutralButton} onClick={handleAddDate}>
                  Add
                </Button>
              </div>

              <div className="mt-2 d-flex flex-wrap gap-2">
                {linkedDates.map((date) => (
                  <Badge
                    key={date}
                    bg={darkMode ? "light" : "dark"}
                    text={darkMode ? "dark" : "light"}
                    style={styleSheet.badge}
                    onClick={() => handleRemoveDate(date)}
                  >
                    {date} ✕
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div style={styleSheet.loadingBox}>
              <Spinner animation="border" />
              <p className="mt-2">Processing...</p>
            </div>
          ) : (
            <>
              {fileObj.isImage && (
                <>
                  <div className="text-center">
                    <img
                      src={`data:${fileObj.mimeType};base64,${fileObj.content}`}
                      alt={fileObj.name}
                      style={styleSheet.imagePreview}
                    />
                  </div>

                  <div className="mt-3 d-flex flex-wrap gap-2">
                    <Button
                      variant={neutralButton}
                      disabled={isEditing}
                      onClick={() =>
                        handleRunAI("describe", true, "/api/describe-image")
                      }
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Describe Image
                    </Button>

                    <Button
                      variant={neutralButton}
                      disabled={isEditing}
                      onClick={() =>
                        handleRunAI("main_objects", true, "/api/describe-image")
                      }
                    >
                      <FontAwesomeIcon icon={faSearch} className="me-2" />
                      Identify Objects
                    </Button>
                  </div>
                </>
              )}

              {fileObj.isText && (
                <>
                  <h6>Content</h6>

                  {!isEditing ? (
                    <pre
                      className={`p-3 rounded border ${
                        darkMode
                          ? "bg-dark text-light border-light"
                          : "bg-white text-dark"
                      }`}
                      style={styleSheet.contentPreview}
                    >
                      {fileObj.decodeContent()}
                    </pre>
                  ) : (
                    <textarea
                      className={`form-control ${inputClass}`}
                      value={fileContent}
                      rows="10"
                      onChange={(e) => {
                        setFileContent(e.target.value);
                        isContentEdited.current = true;
                      }}
                      style={styleSheet.textArea}
                    />
                  )}

                  <div className="mt-3 d-flex flex-wrap gap-2">
                    <Button
                      variant={neutralButton}
                      disabled={isEditing}
                      onClick={() => handleRunAI("summarize")}
                    >
                      <FontAwesomeIcon icon={faFileAlt} className="me-2" />
                      Summarize
                    </Button>

                    <Button
                      variant={neutralButton}
                      disabled={isEditing}
                      onClick={() => handleRunAI("keywords")}
                    >
                      <FontAwesomeIcon icon={faSearch} className="me-2" />
                      Find Keywords
                    </Button>
                  </div>
                </>
              )}

              {!fileObj.isText && !fileObj.isImage && (
                <p className="text-muted">Preview is not available.</p>
              )}

              {aiResponse && (
                <div
                  className={`mt-3 p-3 rounded border ${
                    darkMode
                      ? "bg-dark text-light border-light"
                      : "bg-white text-dark"
                  }`}
                >
                  <h6>AI Response</h6>
                  <p style={styleSheet.aiResponse}>{aiResponse}</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer className={modalClass}>
          {isEditing ? (
            <>
              <Button variant={mainButton} onClick={handleSaveUpdate}>
                <FontAwesomeIcon icon={faSave} className="me-2" />
                Save Changes
              </Button>

              <Button variant={neutralButton} onClick={handleCancelEdit}>
                <FontAwesomeIcon icon={faTimes} className="me-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant={neutralButton} onClick={() => setIsEditing(true)}>
                <FontAwesomeIcon icon={faEdit} className="me-2" />
                Edit
              </Button>

              <Button variant={neutralButton} onClick={handleDownload}>
                <FontAwesomeIcon icon={faDownload} className="me-2" />
                Download
              </Button>

              <Button variant={neutralButton} onClick={handleDelete}>
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Delete
              </Button>

              <Button variant={mainButton} onClick={closeMainModal}>
                Close
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal>

      <Modal
        show={showPreviewModal}
        onHide={() => setShowPreviewModal(false)}
        centered
      >
        <Modal.Header closeButton className={modalClass}>
          <Modal.Title>File Preview</Modal.Title>
        </Modal.Header>

        <Modal.Body className={modalClass}>
          <p style={styleSheet.previewFileName}>{fileObj.name}</p>

          <textarea
            className={`form-control ${inputClass}`}
            value={fileObj.preview || ""}
            readOnly
            placeholder="No preview available"
            style={styleSheet.previewTextArea}
          />
        </Modal.Body>

        <Modal.Footer className={modalClass}>
          <Button
            variant={mainButton}
            onClick={() => setShowPreviewModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const styleSheet = {
  fileButton: {
    cursor: "pointer",
    fontWeight: "bold",
    borderRadius: "10px",
    padding: "10px",
  },

  modalTitle: {
    width: "100%",
  },

  fileNameText: {
    wordBreak: "break-all",
    whiteSpace: "pre-wrap",
    fontSize: "0.85rem",
    opacity: 0.8,
  },

  badge: {
    cursor: "pointer",
  },

  loadingBox: {
    textAlign: "center",
    padding: "1.5rem",
  },

  imagePreview: {
    maxWidth: "100%",
    maxHeight: "420px",
    borderRadius: "10px",
  },

  contentPreview: {
    maxHeight: "300px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
  },

  textArea: {
    resize: "none",
  },

  aiResponse: {
    whiteSpace: "pre-wrap",
  },

  previewFileName: {
    wordBreak: "break-all",
    fontWeight: "bold",
  },

  previewTextArea: {
    width: "100%",
    height: "120px",
    resize: "none",
  },
};