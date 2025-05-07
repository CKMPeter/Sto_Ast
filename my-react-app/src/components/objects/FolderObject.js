import { FileObject } from "./FileObject"; // import FileObject

export class Folder {
  constructor(id, name, path) {
    this.id = id;
    this.name = name;
    this.path = path;
    this.childFile = [];   // Array of FileObject instances
    this.childFolder = []; // Array of Folder instances
  }

  addFile(file) {
    if (file instanceof FileObject) {
      this.childFile.push(file);
    } else {
      throw new Error("Only instances of FileObject can be added.");
    }
  }

  addFolder(folder) {
    if (folder instanceof Folder) {
      this.childFolder.push(folder);
    } else {
      throw new Error("Only instances of Folder can be added.");
    }
  }
}
