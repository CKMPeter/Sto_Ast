import { Breadcrumb } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ROOT_FOLDER } from "../../hooks/useFolder";

export default function FolderBreadcrumbs({ currentFolder }) {
  // Initialize the path
  let path = currentFolder === ROOT_FOLDER ? [] : [ROOT_FOLDER];

  // Safely add `currentFolder.path` if it exists
  if (currentFolder && currentFolder.path) {
    path = [...path, ...currentFolder.path];
  }

  return (
    <Breadcrumb
      className="flex-grow-1"
      listProps={{ className: "bg-white pl-0 m-0"}}
    >
      {/* Map through the path */}
      {path.map((folder, index) => (
        <Breadcrumb.Item
          key={folder.id || index} // Fallback to index if id is missing
          className="text-truncate d-inline-block"
          style={{ maxWidth: "200px", fontSize: '2rem'}}
          linkAs={Link}
          linkProps={{
            to: {
                    pathname: folder.id ? `/folder/${folder.id}` : '/',
                    state: { folder: {...folder, path: path.slice(1, index)}},
                }
            }}
        >
          {folder.name || "Unnamed Folder"} {/* Fallback for undefined name */}
        </Breadcrumb.Item>
      ))}

      {/* Render the current folder as active */}
      {currentFolder && (
        <Breadcrumb.Item
          className="text-truncate d-inline-block"
          style={{ maxWidth: "200px", fontSize: '2rem'}}
          active
        >
          {currentFolder.name || "Unnamed Folder"} {/* Fallback for undefined name */}
        </Breadcrumb.Item>
      )}
    </Breadcrumb>
  );
}
