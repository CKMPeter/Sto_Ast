import { getDatabase, ref, remove, update } from "firebase/database";

export class FileObject {
  constructor({ id, name, content, path, createdAt, user, apiUrl = "http://localhost:5000/ai" }) {
    this.id = id;
    this.name = name;
    this.content = content;
    this.path = path;
    this.createdAt = createdAt;
    this.user = user;
    this.apiUrl = apiUrl;
    this.db = getDatabase();
  }

  get isImage() {
    return this.name?.endsWith("_png") || this.name?.endsWith("_jpg") || this.name?.endsWith("_jpeg");
  }

  get isText() {
    return this.name?.endsWith("_txt");
  }

  get mimeType() {
    if (this.name.endsWith("_png")) return "image/png";
    if (this.name.endsWith("_jpg") || this.name.endsWith("_jpeg")) return "image/jpeg";
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

  async delete() {
    const fileRef = ref(this.db, `files/${this.user.uid}/${this.id}`);
    try {
      await remove(fileRef);
      return { success: true };
    } catch (error) {
      console.error("Error deleting file:", error);
      return { success: false, error };
    }
  }

  async update(newName, newContent) {
    const fileRef = ref(this.db, `files/${this.user.uid}/${this.id}`);
    try {
      await update(fileRef, {
        name: newName.trim(),
        content: btoa(newContent),
      });
      this.name = newName.trim();
      this.content = btoa(newContent);
      return { success: true };
    } catch (error) {
      console.error("Error updating file:", error);
      return { success: false, error };
    }
  }

  async fetchAI(task, isImageRequest = false) {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: isImageRequest ? this.content : this.decodeContent(),
          task,
          isImage: isImageRequest,
          mimeType: this.mimeType,
        }),
      });
      const data = await response.json();
      return { success: true, result: data.result || "No result returned." };
    } catch (error) {
      console.error("AI API error:", error);
      return { success: false, result: "Error processing content with AI." };
    }
  }
}
