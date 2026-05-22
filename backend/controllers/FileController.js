const {
  updateFileInDB,
  deleteFileFromDB,
  getFileByFolderPathFromDB,
  getFilesByFolderIdFromDB,
  uploadFileToDB,
  getAllFilesByUserFromDB,
  getFileOrFolderById,
  getFilesByExactDate,
} = require("../DAOs/FileDAO");

module.exports = {
  uploadFile: async (req, res) => {
    const {
      name,
      content,
      preview,
      path,
      folderId,
      linkedDates = [],
    } = req.body;

    const { uid: userId } = req.decodedToken;

    if (!name || !content || !path) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const uploadedFile = await uploadFileToDB(
        name.trim(),
        content,
        preview,
        path,
        folderId,
        userId,
        linkedDates
      );

      res.status(200).json({
        message: "File uploaded successfully",
        file: uploadedFile,
      });
    } catch (err) {
      console.error("Error uploading file:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  updateFile: async (req, res) => {
    const { fileId } = req.params;

    const { name, content, preview, linkedDates } = req.body; // ⚠️ no default []

    if (!name || !content) {
      return res.status(400).json({
        success: false,
        error: "Missing name or content",
      });
    }

    try {
      await updateFileInDB(
        fileId,
        name.trim(),
        content,
        preview,
        linkedDates
      );

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  deleteFile: async (req, res) => {
    const { fileId } = req.params;

    try {
      await deleteFileFromDB(fileId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },

  fetchFilesByFolderPath: async (req, res) => {
    const { folderPath } = req.query;
    const { uid: userId } = req.decodedToken;

    if (!folderPath) {
      return res.status(400).json({
        error: "Missing folderPath",
      });
    }

    try {
      const files = await getFileByFolderPathFromDB(folderPath, userId);
      res.json({ files });
    } catch (error) {
      console.error("Fetch files error:", error.message);
      res.status(500).json({
        error: "Failed to fetch files",
      });
    }
  },

  fetchFilesByFolderId: async (req, res) => {
    const { folderId } = req.params;
    const { uid: userId } = req.decodedToken;

    try {
      const files = await getFilesByFolderIdFromDB(folderId, userId);
      res.json({ files });
    } catch (error) {
      console.error("Fetch files error:", error.message);
      res.status(500).json({
        error: "Failed to fetch files",
      });
    }
  },

  fetchAllFilesByUser: async (req, res) => {
    const { uid: userId } = req.decodedToken;

    try {
      const files = await getAllFilesByUserFromDB(userId);
      res.json({ files });
    } catch (error) {
      console.error("Fetch all files error:", error.message);
      res.status(500).json({
        error: "Failed to fetch all files",
      });
    }
  },

  fetchFileOrFolderById: async (req, res) => {
    const { id } = req.params;
    const { collection = "files" } = req.query;
    console.log("HIT fetchFilesByExactDate");

    try {
      const item = await getFileOrFolderById(id, collection);

      if (!item) {
        return res.status(404).json({
          error: "Item not found",
        });
      }

      res.json({ item });
    } catch (error) {
      console.error("Fetch item error:", error.message);
      res.status(500).json({
        error: "Failed to fetch item",
      });
    }
  },

  fetchFilesByExactDate: async (req, res) => {
    const { date } = req.query;
    const { uid: userId } = req.decodedToken;

    if (!date) {
      return res.status(400).json({
        error: "Missing date",
      });
    }

    try {
      const files = await getFilesByExactDate(userId, date);
      res.json({ files });
    } catch (error) {
      console.error("Fetch by date error:", error.message);
      res.status(500).json({
        error: "Failed to fetch files by date",
      });
    }
  },
};