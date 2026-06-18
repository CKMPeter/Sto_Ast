import { ROOT_FOLDER } from "../../hooks/storageHook/useFolder";

export function buildFolderBreadcrumbPath(currentFolder) {
  let path = currentFolder === ROOT_FOLDER ? [] : [ROOT_FOLDER];

  if (currentFolder?.path) {
    path = [...path, ...currentFolder.path];
  }

  return path;
}

export function getBreadcrumbLink(folder, path, index) {
  return {
    pathname: folder.id ? `/folder/${folder.id}` : "/",
    state: {
      folder: {
        ...folder,
        path: path.slice(1, index),
      },
    },
  };
}