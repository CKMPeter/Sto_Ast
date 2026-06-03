import { Breadcrumb } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDarkMode } from "../../hooks/useDarkMode";

import {
  buildFolderBreadcrumbPath,
  getBreadcrumbLink,
} from "../../services/storageService/breadcrumbService";

export default function FolderBreadcrumbs({ currentFolder, darkMode }) {
  const { loading } = useDarkMode();

  if (loading) return null;

  const path = buildFolderBreadcrumbPath(currentFolder);

  const breadcrumbTextClass = darkMode ? "text-white" : "text-dark";

  return (
    <Breadcrumb
      className={`flex-grow-1 ${
        darkMode ? "bg-dark text-white" : "bg-white text-dark"
      }`}
      listProps={{
        className: "pl-0 m-0",
      }}
      style={{
        fontWeight: "bold",
        fontSize: "2rem",
        background: "transparent",
        padding: "0",
      }}
    >
      {path.map((folder, index) => (
        <Breadcrumb.Item
          key={folder.id || index}
          className={`text-truncate d-inline-block ${breadcrumbTextClass}`}
          style={{
            maxWidth: "200px",
            fontSize: "2rem",
          }}
          linkAs={Link}
          linkProps={{
            to: getBreadcrumbLink(folder, path, index),
          }}
        >
          {folder.name || "Unnamed Folder"}
        </Breadcrumb.Item>
      ))}

      {currentFolder && (
        <Breadcrumb.Item
          className={`text-truncate d-inline-block ${breadcrumbTextClass}`}
          style={{
            maxWidth: "200px",
            fontSize: "2rem",
          }}
          active
        >
          {currentFolder.name || "Unnamed Folder"}
        </Breadcrumb.Item>
      )}
    </Breadcrumb>
  );
}