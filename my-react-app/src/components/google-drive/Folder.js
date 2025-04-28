import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function Folder({ folder }) {
  if (!folder) return null;

  return (
    <Button
      to={{
        pathname: `/folder/${folder.id}`,
        state: { folder: folder },
      }}
      as={Link}
      variant="outline-dark"
      className="text-truncate w-100"
    >
      <FontAwesomeIcon icon={faFolder} style={{ marginRight: 6 }} />
      {/* Show highlighted name if exists, fallback to normal name */}
      <span dangerouslySetInnerHTML={{ __html: folder.highlightedName || folder.name || "Unnamed Folder" }} />
    </Button>
  );
}
