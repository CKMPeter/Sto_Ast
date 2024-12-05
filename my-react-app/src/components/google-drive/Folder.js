import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Folder({ folder }) {
  // Safeguard for null or undefined folder
  if (!folder) {
    return null; // Optionally, return a placeholder or empty state instead
  }

  return (
    <Button
      to={{
        pathname: `/folder/${folder.id}`,
        state: { folder: folder },
      }}
      as={Link}
      variant="outline-dark"
      className="text-truncate 2-100"
    >
      <FontAwesomeIcon icon={faFolder} style={{ marginRight: 2 }} />
      {folder.name || "Unnamed Folder"} {/* Fallback if folder.name is missing */}
    </Button>
  );
}
