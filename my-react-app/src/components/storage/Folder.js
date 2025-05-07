import React from "react";
import { Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { Folder as FolderClass } from "../objects/FolderObject"; // import renamed to avoid naming conflict

export default function Folder({ folder }) {
  if (!folder || !(folder instanceof FolderClass)) return null;

  return (
    <Button
      as={Link}
      to={{
        pathname: `/folder/${folder.id}`,
        state: { folder: folder },
      }}
      variant="outline-dark"
      className="text-truncate w-100"
    >
      <FontAwesomeIcon icon={faFolder} style={{ marginRight: 6 }} />
      <span
        dangerouslySetInnerHTML={{
          __html: folder.highlightedName || folder.name || "Unnamed Folder",
        }}
      />
    </Button>
  );
}
