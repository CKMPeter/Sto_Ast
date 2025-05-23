import React, { useState } from "react";
import { Button, Modal, Dropdown, Alert, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { FolderClass } from "../classes/FolderClass"; // import renamed to avoid naming conflict
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../hooks/useDarkMode"; // adjust path if needed

export default function Folder({ folder }) {
  const [showModals, setShowModals] = useState({ first: false, second: false });
  const [clickedFolder, setClickedFolder] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { getIdToken } = useAuth();
  // Use the dark mode hook
  const { darkMode } = useDarkMode(); // use dark mode context

  // Open modal on right-click
  const handleRightClick = (e) => {
    e.preventDefault();
    setClickedFolder(folder); // Store the folder clicked
    showFirstModal();
    console.log("Right-clicked on folder:", folder);
  };

  const resetState = () => {
    setFolderName("");
    setError("");
    setSuccess("");
  };

  // Close modal
  const handleCloseModals = () => {
    setShowModals({ first: false, second: false });
    resetState();
  };
  const handleCloseSecondModal = () => {
    setShowModals({ ...showModals, second: false });
    resetState();
  };
  const showFirstModal = () => setShowModals({ ...showModals, first: true });
  const showSecondModal = () => {
    setShowModals({ ...showModals, second: true });
    setFolderName(folder.name);
  };

  // Handle folder rename
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await getIdToken();
    if (!token) {
      setError("User not authenticated");
      return;
    }

    const newName = folderName.trim();
    if (!newName) {
      setError("Folder name cannot be empty");
      return;
    }
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/folders/${clickedFolder.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ folderName: newName }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to rename folder");
      }
      setSuccess("Folder renamed successfully");
      handleCloseModals();
    } catch (error) {
      setError("Failed to rename folder");
    }
  };

  // Handle folder delete
  const handleDelete = async () => {
    const token = await getIdToken();
    if (!token) {
      setError("User not authenticated");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/folders/${clickedFolder.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete folder");
      }
      setSuccess("Folder deleted successfully");
      handleCloseModals();
    } catch (error) {
      setError("Failed to delete folder");
    }
  };

  if (!folder || !(folder instanceof FolderClass)) return null;

  return (
    <>
      <Button
        as={Link}
        to={`/folder/${folder.id}`}
        variant={darkMode ? "outline-light" : "outline-dark"}
        className={`text-truncate w-100 invert-hover`}
        onContextMenu={handleRightClick}
        style={{fontWeight: "bold", textAlign: "left"}}
      >
        <FontAwesomeIcon
          icon={faFolder}
          style={{ marginRight: 6, color: "inherit" }}
        />
        <span
          dangerouslySetInnerHTML={{
            __html: folder.highlightedName || folder.name || "Unnamed Folder",
          }}
        />
      </Button>
      {/* Right-click Modal */}
      <Modal show={showModals.first} onHide={handleCloseModals}>
        <Modal.Header closeButton>
          <Modal.Title>Folder Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Dropdown.Divider />
          <Button variant="secondary" onClick={showSecondModal}>
            Rename
          </Button>
          <Button variant="danger" onClick={handleDelete} className="ml-2">
            Delete
          </Button>
        </Modal.Body>
      </Modal>

      {/* Rename Modal */}
      <Modal show={showModals.second} onHide={handleCloseModals}>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Form.Group>
              <Form.Label>New Folder Name</Form.Label>
              <Form.Control
                type="text"
                required
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseSecondModal}>
              Close
            </Button>
            <Button variant="success" type="submit">
              Confirm
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
