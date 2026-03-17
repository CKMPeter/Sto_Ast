import { getDatabase } from "firebase/database";

export class FileClass {
  constructor({ id, name, content, preview, path, createdAt, user }) {
    this.id = id;
    this.name = name;
    this.content = content; // keep raw base64
    this.preview = preview;
    this.path = path;
    this.createdAt = createdAt;
    this.user = user;
    this.db = getDatabase();
  }

  get fileExtension() {
    return this.name.slice(this.name.lastIndexOf("."));
  }

  get isImage() {
    return (
      this.name?.endsWith(".png") ||
      this.name?.endsWith(".jpg") ||
      this.name?.endsWith(".jpeg")
    );
  }

  get isText() {
    return this.name?.endsWith(".txt");
  }

  get mimeType() {
    if (this.name.endsWith(".png")) return "image/png";
    if (this.name.endsWith(".jpg") || this.name.endsWith(".jpeg"))
      return "image/jpeg";
    if (this.isText) return "text/plain";
    return "application/octet-stream"; // generic fallback
  }

  decodeContent() {
    if (!this.isText) return this.content;
    try {
      return atob(this.content); // base64 decode to plain string
    } catch (error) {
      console.error("Decoding error:", error);
      return "Error decoding content.";
    }
  }
}
