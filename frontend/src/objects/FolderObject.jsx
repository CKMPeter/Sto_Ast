import { FileObject } from "./FileObject";

export class FolderObject {
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
    if (folder instanceof FolderObject) {
      this.childFolder.push(folder);
    } else {
      throw new Error("Only instances of Folder can be added.");
    }
  }

  //Add this static method to safely recreate Folder instances
  static fromObject(obj) {
    const folder = new FolderObject(obj.id, obj.name, obj.path);
    if (Array.isArray(obj.childFile)) {
      folder.childFile = obj.childFile.map(
        (f) => Object.assign(new FileObject(), f)
      );
    }
    if (Array.isArray(obj.childFolder)) {
      folder.childFolder = obj.childFolder.map(
        (f) => FolderObject.fromObject(f) // recursively convert
      );
    }
    return folder;
  }
}