import { Breadcrumb } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ROOT_FOLDER } from "../../hooks/useFolder";
import { useDarkMode } from "../../hooks/useDarkMode"; // Import the dark mode hook

export default function FolderBreadcrumbs({ currentFolder }) {
  // Initialize the path
  let path = currentFolder === ROOT_FOLDER ? [] : [ROOT_FOLDER];
  //Darkmode
  const { darkMode, loading } = useDarkMode();
  if (loading) return null; // ⛔ avoid flicker on initial load

  // Safely add `currentFolder.path` if it exists
  if (currentFolder && currentFolder.path) {
    path = [...path, ...currentFolder.path];
  }

  return (
    <Breadcrumb
      className={`flex-grow-1 ${darkMode ? "bg-dark text-white" : "bg-white text-dark"}`}
      listProps={{ className: "pl-0 m-0" }}
      style={{fontWeight: 'bold', fontSize: '2rem', background: "transparent", padding: '0'}}
    >
      {path.map((folder, index) => (
        <Breadcrumb.Item
          key={folder.id || index}
          className={`text-truncate d-inline-block ${darkMode ? "text-white" : "text-dark"}`}
          style={{ maxWidth: "200px", fontSize: '2rem' }}
          linkAs={Link}
          linkProps={{
            to: {
              pathname: folder.id ? `/folder/${folder.id}` : '/',
              state: { folder: { ...folder, path: path.slice(1, index) } },
            }
          }}
        >
          {folder.name || "Unnamed Folder"}
        </Breadcrumb.Item>
      ))}

      {currentFolder && (
        <Breadcrumb.Item
          className={`text-truncate d-inline-block ${darkMode ? "text-white" : "text-dark"}`}
          style={{ maxWidth: "200px", fontSize: '2rem' }}
          active
        >
          {currentFolder.name || "Unnamed Folder"}
        </Breadcrumb.Item>
      )}
    </Breadcrumb>
  );
}
