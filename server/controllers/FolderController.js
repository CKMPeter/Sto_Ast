const {
  createFolderInDB,
  updateFolderInDB,
  deleteFolderAndFilesFromDB,
  getFolderByIdFromDB: readFolderById,
  getFoldersByParentIdFromDB,
} = require("../DAOs/FolderDAO");
const { db } = require("../firebase-admin-setup");

module.exports = {
  // Function to create a folder
  createFolder: async (req, res) => {
    try {
      const { folderName, parentId, pathArr } = req.body;
      const { uid: userId } = req.decodedToken;
      if (!folderName) {
        return res.status(400).json({ error: "Missing folderName" });
      }
      console.log("Creating folder with name:", folderName);

      const newFolder = await createFolderInDB(
        folderName,
        userId,
        parentId,
        pathArr
      );

      console.log("Folder added:", newFolder.id);

      res.status(200).json({ success: true, folderId: newFolder.id });
    } catch (error) {
      console.error("Error adding folder:", error);
      res.status(500).json({ error: "Failed to add folder" });
    }
  },

  // Function to update a folder
  updateFolder: async (req, res) => {
    const { folderId } = req.params;
    const { folderName } = req.body;

    if (!folderName) {
      return res.status(400).json({ error: "Missing folderName" });
    }
    try {
      console.log("Updating folder with ID:", folderId);

      await updateFolderInDB(folderId, folderName);

      console.log("Folder updated successfully");

      res.status(200).json({ success: true, message: "Folder updated" });
    } catch (error) {
      console.error("Error updating folder:", error);
      res.status(500).json({ error: "Failed to update folder" });
    }
  },

  // Function to delete a folder
  deleteFolder: async (req, res) => {
    const { folderId } = req.params;
    try {
      console.log("Deleting folder with ID:", folderId);

      await deleteFolderAndFilesFromDB(folderId);

      console.log("Folder deleted successfully");

      res.status(200).json({ success: true, message: "Folder deleted" });
    } catch (error) {
      console.error("Error deleting folder:", error);
      res.status(500).json({ error: "Failed to delete folder" });
    }
  },

  // Function to fetch a folder by ID
  fetchFolderById: async (req, res) => {
    const { folderId } = req.params;
    try {
      console.log("Fetching folder with ID:", folderId);

      const folder = await readFolderById(folderId);

      res.json({ folder: { id: doc.id, ...doc.data() } });
    } catch (error) {
      console.error("Fetch folder error:", error.message);
      res.status(500).json({ error: "Failed to fetch folder" });
    }
  },

  // Function to fetch all folders by parentId and userId
  fetchFoldersByParentId: async (req, res) => {
    const { parentId } = req.query;
    if (!parentId) return res.status(400).json({ error: "Missing parentId" });

    const { uid: userId } = req.decodedToken;

    try {
      console.log("Fetching folders with parentId:", parentId);

      const folders = await getFoldersByParentIdFromDB(parentId, userId);

      console.log("Fetched folders:", folders);

      res.json({ folders });
    } catch (error) {
      console.error("Error fetching folders:", error.message);
      res.status(500).json({ error: "Failed to fetch folders" });
    }
  },
};
