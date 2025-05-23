import React, { useState } from "react";
import { Button, Modal, Form, Alert } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolderPlus } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../contexts/AuthContext";
import { ROOT_FOLDER } from "../../hooks/useFolder";

export default function CreateFolderButton({ currentFolder }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { getIdToken } = useAuth();

  // Open modal
  function openModal() {
    setOpen(true);
  }

  // Close modal
  function closeModal() {
    setOpen(false);
    setError("");
    setSuccess("");
  }

  // Handle form submit
  async function handleSubmit(e) {
    e.preventDefault();

    const token = await getIdToken();
    if (!token) {
      setError("User not authenticated");
    }

    if (currentFolder == null) return;

    const path = [...currentFolder.path];

    if (currentFolder !== ROOT_FOLDER) {
      path.push({ name: currentFolder.name, id: currentFolder.id });
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/folders`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folderName: name,
            parentId: currentFolder.id,
            pathArr: path,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess("Folder added successfully!");
        setName(""); // Clear the input field
        closeModal();
      } else {
        setError(data.error || "Failed to add folder");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error adding folder:", err);
    }
  }

  return (
    <>
      <Button
        onClick={openModal}
        variant="outline-success"
        size="sm"
        style={{ marginRight: "5px" }}
      >
        <FontAwesomeIcon icon={faFolderPlus} style={{ fontSize: "2rem" }} />
      </Button>

      <Modal show={open} onHide={closeModal}>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form.Group>
              <Form.Label>Folder Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Close
            </Button>
            <Button variant="success" type="submit">
              Create Folder
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
