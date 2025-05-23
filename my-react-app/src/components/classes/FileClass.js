import { getDatabase } from "firebase/database";

export class FileClass {
  constructor({ id, name, content, path, createdAt, user }) {
    this.id = id;
    this.name = name;
    this.content = content;
    this.path = path;
    this.createdAt = createdAt;
    this.user = user;
    this.db = getDatabase();
  }

  get isImage() {
    return (
      this.name?.endsWith("_png") ||
      this.name?.endsWith("_jpg") ||
      this.name?.endsWith("_jpeg")
    );
  }

  get isText() {
    return this.name?.endsWith("_txt");
  }

  get mimeType() {
    if (this.name.endsWith("_png")) return "image/png";
    if (this.name.endsWith("_jpg") || this.name.endsWith("_jpeg"))
      return "image/jpeg";
    return "image/jpeg";
  }

  decodeContent() {
    try {
      return atob(this.content || "");
    } catch (error) {
      console.error("Decoding error:", error);
      return "Error decoding content.";
    }
  }

  async fetchAI(token, task, isImageRequest = false) {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/ai`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: isImageRequest ? this.content : this.decodeContent(),
            task,
            isImage: isImageRequest,
            mimeType: this.mimeType,
          }),
        }
      );
      const data = await response.json();
      return { success: true, result: data.result || "No result returned." };
    } catch (error) {
      console.error("AI API error:", error);
      return { success: false, result: "Error processing content with AI." };
    }
  }
}
