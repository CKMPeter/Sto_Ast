const {
  db,
  realtimeDatabase,
  ServerValue,
} = require("../firebase-admin-setup");

module.exports = {
  // Function to upload a file
  uploadFileToDB: async (name, content, path, folderId, userId) => {
    try {
      const filePath = `files/${user.uid}/${path}`;
      await realtimeDatabase.ref(filePath).set({
        name,
        content,
        path,
        folderId,
        userId,
        createdAt: ServerValue.TIMESTAMP,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  },

  // Function to update a file
  updateFileInDB: async (userId, filePath, name, content) => {
    try {
      const fileRef = realtimeDatabase.ref(`files/${userId}/${filePath}`);

      console.log("File reference:", fileRef);
      await fileRef.update({
        name: name.trim(),
        content,
        updatedAt: ServerValue.TIMESTAMP,
      });
    } catch (error) {
      console.error("Error updating file:", error);
      throw error;
    }
  },

  // Function to delete a file
  deleteFileFromDB: async (userId, filePath) => {
    try {
      return await realtimeDatabase
        .ref(`files/${userId}/${filePath}`)
        .set(null);
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  },

  // Function to fetch a file by Folder path
  getFileByFolderPathFromDB: async (folderPath, userId) => {
    try {
      const query = db
        .collection("files")
        .where("folderPath", "==", folderPath)
        .where("userId", "==", userId);
      const snapshot = await query.get();
      const files = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return files;
    } catch (error) {
      console.error("Error fetching file by folder path:", error);
      throw error;
    }
  },

  // Function to fetch files by folder id
  getFilesByFolderIdFromDB: async (folderId, userId) => {
    try {
      let folderPath =
        folderId === "null" || folderId === null
          ? `files/${userId}`
          : `files/${userId}/${folderId}`;

      console.log("Fetching files in folder:", folderPath);
      const snapshot = await realtimeDatabase.ref(folderPath).get();

      const data = snapshot.val() || {};
      const formattedFiles = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
        path: data[key].path || key,
      }));
      return formattedFiles;
    } catch (error) {
      console.error("Error fetching files by folder ID:", error);
      throw error;
    }
  },
};
