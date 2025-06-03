const {
  updateFileInDB,
  deleteFileFromDB,
  getFileByFolderPathFromDB,
  getFilesByFolderIdFromDB,
  uploadFileToDB,
  getAllFilesByUserFromDB,
  getFileOrFolderById,
} = require("../DAOs/FileDAO");
const { FieldValue } = require("../firebase-admin-setup");

module.exports = {
  //Function to upload a file
  uploadFile: async (req, res) => {
    const { name, content, preview, path, folderId } = req.body;
    const { uid: userId } = req.decodedToken;

    if (!name || !content || !path) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      console.log(
        "Uploading file:",
        name + "\n" + preview + "\n" + path + "\n" + folderId
      );
      const uploadedFile = await uploadFileToDB(
        name.trim(),
        content,
        preview,
        path,
        folderId,
        userId
      );

      console.log(
        "File uploaded successfully. File id: ",
        uploadedFile.id,
        "\nname: ",
        uploadedFile.name,
        "\nfolderId: ",
        uploadedFile.folderId,
        "\nuserId: ",
        uploadedFile.userId
      );

      res
        .status(200)
        .json({ message: "File uploaded successfully", file: uploadedFile });
    } catch (err) {
      console.error("Error uploading file to Firebase:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // Function to update a file
  updateFile: async (req, res) => {
    const { fileId } = req.params;
    const { name, content, preview, filePath } = req.body;
    const { uid: userId } = req.decodedToken;

    if (!name || !content) {
      return res
        .status(400)
        .json({ success: false, error: "Missing name or content" });
    }

    try {
      console.log(
        "Updating file:",
        fileId + "\n" + name + "\n" + preview + "\n" + filePath
      );

      await updateFileInDB(fileId, name.trim(), content, preview);

      console.log("File updated successfully");

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Function to delete a file
  deleteFile: async (req, res) => {
    const { fileId } = req.params;
    const { filePath } = req.body;
    const { uid: userId } = req.decodedToken;

    try {
      console.log("Deleting file:", fileId + "\n" + filePath);

      await deleteFileFromDB(fileId);

      console.log("File deleted successfully");

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // Function to fetch files by folderPath
  fetchFilesByFolderPath: async (req, res) => {
    const { folderPath } = req.query;
    const { uid: userId } = req.decodedToken;

    if (!folderPath)
      return res.status(400).json({ error: "Missing folderPath or userId" });

    try {
      console.log("Fetching files in folder:", folderPath);

      const files = await getFileByFolderPathFromDB(folderPath, userId);

      console.log("Files fetched successfully");

      res.json({ files });
    } catch (error) {
      console.error("Fetch files error:", error.message);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  },

  // Function to fetch files by folderId
  fetchFilesByFolderId: async (req, res) => {
    const { folderId } = req.params;
    const { uid: userId } = req.decodedToken;

    try {
      console.log("Fetching files in folder with ID:", folderId);

      const files = await getFilesByFolderIdFromDB(folderId, userId);

      console.log("Files fetched successfully");

      res.json({ files });
    } catch (error) {
      console.error("Fetch files error:", error.message);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  },

  fetchAllFilesByUser: async (req, res) => {
    const { uid: userId } = req.decodedToken;

    try {
      console.log("Fetching all files for user:", userId);

      const files = await getAllFilesByUserFromDB(userId);

      console.log("All files fetched successfully");

      res.json({ files });
    } catch (error) {
      console.error("Fetch all files error:", error.message);
      res.status(500).json({ error: "Failed to fetch all files" });
    }
  },
  // Function to get a file or folder by ID

  fetchFileOrFolderById: async (req, res) => {
    const { id } = req.params;
    const { collection = "files" } = req.query; // Default to "files" if not provided

    try {
      console.log("Fetching file or folder with ID:", id);

      const item = await getFileOrFolderById(fileId, collection);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      console.log("Item fetched successfully");

      res.json({ item });
    } catch (error) {
      console.error("Fetch item error:", error.message);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  },
};
