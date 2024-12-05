import { faFile } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap"; // Import Modal and Button for showing the content

export default function File({ file }) {
  const [showModal, setShowModal] = useState(false);
  const [fileContent, setFileContent] = useState("");

  // This function will be triggered when the file is clicked
  const handleFileClick = () => {
    // Here, we're assuming that the base64 content is stored in the `file.content` field.
    // You can replace `file.content` with the actual field where the base64 content is stored.
    if (file.content) {
      console.log(file.content)
      setShowModal(true); // Show the modal
    } else {
      console.error("No content found for this file.");
    }
  };

  // Close the modal
  const closeModal = () => {
    setShowModal(false);
    setFileContent(""); // Clear content when the modal is closed
  };

  // Check if the file is an image by looking at the start of the base64 string


  return (
    <>
      <a
        onClick={handleFileClick} // Trigger handleFileClick on click
        className="btn btn-outline-dark text-truncate w-100"
        style={{ cursor: "pointer" }}
      >
        <FontAwesomeIcon icon={faFile} className="mr-2" />
        {file.name}
      </a>

      {/* Modal to show the file content */}
      <Modal show={showModal} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>File Content: {file.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
         <img src={`data:image/jpeg;base64,${file.content}`} />
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
