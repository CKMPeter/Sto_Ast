import React, { useState } from "react";
import { Button, Modal, Form, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderPlus } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import { createFolderService } from "../../services/storageService/folderService";

export default function AddFolderButton({ currentFolder, onAdd, darkMode }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const { currentUser } = useAuth();

  const [isHoveringFolder, setIsHoveringFolder] = useState(false);

  function openModal() {
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setError("");
    setName("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await createFolderService({
        currentUser,
        currentFolder,
        folderName: name,
      });

      closeModal();

      if (onAdd) onAdd();
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
      console.error("Error adding folder:", err);
    }
  }

  return (
    <>
      <Button
        onClick={openModal}
        variant={darkMode ? "outline-light" : "outline-primary"}
        size="sm"
        onMouseEnter={() => setIsHoveringFolder(true)}
        onMouseLeave={() => setIsHoveringFolder(false)}
        style={{
          ...styleSheet.openButton,
          borderColor: darkMode ? "#f8f9fa" : "#0077b6",
          color: isHoveringFolder
            ? "#ffffff"
            : darkMode
              ? "#f8f9fa"
              : "#0077b6",
          backgroundColor: isHoveringFolder ? "#0077b6" : "transparent",
          transform: isHoveringFolder ? "translateY(-2px) scale(1.05)" : "none",
          boxShadow: isHoveringFolder
            ? "0 6px 14px rgba(0,119,182,0.35)"
            : "none",
          transition: "all 0.2s ease",
        }}
      >
        <FontAwesomeIcon icon={faFolderPlus} style={styleSheet.openIcon} />
      </Button>

      <Modal
        show={open}
        onHide={closeModal}
        centered
        style={styleSheet.modal}
        backdropClassName="storage-modal-backdrop"
        contentClassName={darkMode ? "bg-dark text-light" : ""}
      >
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>
              <FontAwesomeIcon icon={faFolderPlus} /> Add Folder
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {error && (
              <Alert variant={darkMode ? "dark" : "danger"}>{error}</Alert>
            )}

            <Form.Group>
              <Form.Label>Folder Name</Form.Label>

              <Form.Control
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  ...styleSheet.input,
                  backgroundColor: darkMode ? "#2a2a2a" : "#ffffff",
                  color: darkMode ? "#ffffff" : "#000000",
                  borderColor: darkMode ? "#555555" : "#ced4da",
                }}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>

            <Button variant="success" type="submit" disabled={!name.trim()}>
              Add Folder
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}

const styleSheet = {
  openButton: {
    marginRight: "5px",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "10px",
  },

  openIcon: {
    fontSize: "2rem",
  },

  modal: {
    zIndex: 5001,
  },

  input: {
    marginTop: "10px",
  },
};
