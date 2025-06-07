const { db, ServerValue } = require("../firebase-admin-setup");

module.exports = {
  // Upload a file to Firestore
  uploadFileToDB: async (name, content, preview, path, folderId, userId) => {
    try {
      const fileData = {
        name,
        content,
        preview,
        path,
        folderId,
        userId,
        createdAt: new Date(), // Firestore uses JS Date or Timestamp
      };

      const docRef = await db.collection("files").add(fileData);

      return { id: docRef.id, ...fileData };
    } catch (error) {
      console.error("Error uploading file to Firestore:", error);
      throw error;
    }
  },

  // Update a file in Firestore
  updateFileInDB: async (fileId, name, content, preview) => {
    try {
      const fileRef = db.collection("files").doc(fileId);

      await fileRef.update({
        name: name.trim(),
        content: content,
        preview: preview,
        updatedAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error updating file in Firestore:", error);
      throw error;
    }
  },

  // Delete a file from Firestore
  deleteFileFromDB: async (fileId) => {
    try {
      await db.collection("files").doc(fileId).delete();
      return { success: true };
    } catch (error) {
      console.error("Error deleting file from Firestore:", error);
      throw error;
    }
  },

  // Fetch files by folder path (assuming a `path` field)
  getFileByFolderPathFromDB: async (folderPath, userId) => {
    try {
      const snapshot = await db
        .collection("files")
        .where("path", "==", folderPath)
        .where("userId", "==", userId)
        .get();

      const files = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return files;
    } catch (error) {
      console.error("Error fetching files by folder path:", error);
      throw error;
    }
  },

  // Fetch files by folder ID
  getFilesByFolderIdFromDB: async (folderId, userId) => {
    try {
      let query = db.collection("files").where("userId", "==", userId);
      const actualFolderId = folderId;
      if (actualFolderId === "null") {
        // We can't query Firestore directly for null folderId reliably, so fetch all user files first
        const snapshot = await query.get();
        const files = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(file => file.folderId === null); // Manual filtering for null folderId
        return files;
      }
      else {
        // Query by folderId normally
        query = query.where("folderId", "==", folderId);
        const snapshot = await query.get();
        const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return files;
      }
      
    } catch (error) {
      console.error("Error fetching files by folder ID:", error);
      throw error;
    }
  },

  // Fetch all files for a given user (no folder/path filter)
  getAllFilesByUserFromDB: async (userId) => {
    try {
      const snapshot = await db
        .collection("files")
        .where("userId", "==", userId)
        .get();

      const files = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return files;
    } catch (error) {
      console.error("Error fetching files for user:", error);
      throw error;
    }
  },

  getFileOrFolderById: async (id, collection = "files") => {
    try {
      const doc = await db.collection(collection).doc(id).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (err) {
      console.error("Error fetching doc:", err);
      return null;
    }
  },
};
