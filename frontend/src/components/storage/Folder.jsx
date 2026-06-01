import React, { useState } from "react";
import { Button, Modal, Dropdown, Alert, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

import { FolderClass } from "../../classes/storageClass/FolderClass";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../hooks/useDarkMode";

import {
  renameFolderService,
  deleteFolderService,
} from "../../services/storageService/folderActionService";

export default function Folder({ folder, onChange }) {
  const [showModals, setShowModals] = useState({
    first: false,
    second: false,
  });

  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState("");

  const { getIdToken } = useAuth();
  const { darkMode } = useDarkMode();

  if (!folder || !(folder instanceof FolderClass)) return null;

  const modalClass = darkMode ? "bg-dark text-light" : "";
  const inputClass = darkMode ? "bg-dark text-light border-light" : "";

  function resetState() {
    setFolderName("");
    setError("");
  }

  function handleRightClick(e) {
    e.preventDefault();

    setShowModals({
      first: true,
      second: false,
    });
  }

  function handleCloseModals() {
    setShowModals({
      first: false,
      second: false,
    });

    resetState();
  }

  function handleCloseSecondModal() {
    setShowModals((prev) => ({
      ...prev,
      second: false,
    }));

    resetState();
  }

  function showSecondModal() {
    setShowModals({
      first: false,
      second: true,
    });

    setFolderName(folder.name);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await renameFolderService({
        getIdToken,
        folderId: folder.id,
        folderName,
      });

      handleCloseModals();

      if (onChange) onChange();
    } catch (error) {
      setError(error.message || "Failed to rename folder");
    }
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this folder?")) {
      return;
    }

    try {
      await deleteFolderService({
        getIdToken,
        folderId: folder.id,
      });

      handleCloseModals();

      if (onChange) onChange();
    } catch (error) {
      setError(error.message || "Failed to delete folder");
    }
  }

  return (
    <>
      <Button
        as={Link}
        to={`/folder/${folder.id}`}
        variant={darkMode ? "outline-light" : "outline-dark"}
        className="text-truncate w-100 invert-hover"
        onContextMenu={handleRightClick}
        style={{
          fontWeight: "bold",
          textAlign: "left",
        }}
      >
        <FontAwesomeIcon
          icon={faFolder}
          style={{
            marginRight: 6,
            color: "inherit",
          }}
        />

        <span
          dangerouslySetInnerHTML={{
            __html: folder.highlightedName || folder.name || "Unnamed Folder",
          }}
        />
      </Button>

      <Modal show={showModals.first} onHide={handleCloseModals} centered>
        <Modal.Header closeButton className={modalClass}>
          <Modal.Title>Folder Options</Modal.Title>
        </Modal.Header>

        <Modal.Body className={modalClass}>
          {error && <Alert variant="danger">{error}</Alert>}

          <Dropdown.Divider />

          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={showSecondModal}>
              Rename
            </Button>

            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showModals.second} onHide={handleCloseSecondModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className={modalClass}>
            <Modal.Title>Rename Folder</Modal.Title>
          </Modal.Header>

          <Modal.Body className={modalClass}>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group>
              <Form.Label>New Folder Name</Form.Label>
              <Form.Control
                className={inputClass}
                type="text"
                required
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className={modalClass}>
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