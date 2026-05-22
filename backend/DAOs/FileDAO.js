  const { db } = require("../firebase-admin-setup");
  const { Timestamp } = require("firebase-admin/firestore");

  module.exports = {
    uploadFileToDB: async (
      name,
      content,
      preview,
      path,
      folderId,
      userId,
      linkedDates = []
    ) => {
      try {
        const fileData = {
          name,
          content,
          preview,
          path,
          folderId,
          userId,
          createdAt: new Date(),
        };

        const docRef = await db.collection("files").add(fileData);

        if (linkedDates && linkedDates.length > 0) {
          const batch = db.batch();

          // Add linked dates
          linkedDates.forEach((date) => {
            const ref = docRef.collection("linkedDates").doc();

            const d = new Date(date);
            d.setHours(0, 0, 0, 0);

            batch.set(ref, {
              date: Timestamp.fromDate(d),
              dateStr: date, // store original string for easier querying
              userId,
              fileId: docRef.id,
            });
          });

          await batch.commit();
        }

        return { id: docRef.id, ...fileData };
      } catch (error) {
        console.error("Error uploading file:", error);
        throw error;
      }
    },

    updateFileInDB: async (
      fileId,
      name,
      content,
      preview,
      linkedDates
    ) => {
      try {
        const fileRef = db.collection("files").doc(fileId);

        await fileRef.update({
          name: name.trim(),
          content,
          preview,
          updatedAt: new Date(),
        });

        // ONLY update dates if provided
        if (linkedDates !== undefined) {
          const snapshot = await fileRef.collection("linkedDates").get();
          const batch = db.batch();

          // delete old
          snapshot.forEach((doc) => batch.delete(doc.ref));

          // get userId ONCE
          const fileDoc = await fileRef.get();
          const userId = fileDoc.data().userId;

          // add new
         linkedDates.forEach((date) => {
          const ref = fileRef.collection("linkedDates").doc();

          const d = new Date(date);
          d.setHours(0, 0, 0, 0);

          batch.set(ref, {
            date: Timestamp.fromDate(d),
            dateStr: date, //  store original string for easier querying
            fileId,
            userId,
          });
        });

          await batch.commit();
        }

        return { success: true };
      } catch (error) {
        console.error("Error updating file:", error);
        throw error;
      }
    },
    deleteFileFromDB: async (fileId) => {
      try {
        await db.collection("files").doc(fileId).delete();
        return { success: true };
      } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
      }
    },

    getFileByFolderPathFromDB: async (folderPath, userId) => {
      try {
        const snapshot = await db
          .collection("files")
          .where("path", "==", folderPath)
          .where("userId", "==", userId)
          .get();

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } catch (error) {
        console.error("Error fetching files by folder path:", error);
        throw error;
      }
    },

    getFilesByFolderIdFromDB: async (folderId, userId) => {
      try {
        let query = db.collection("files").where("userId", "==", userId);

        if (folderId === "null") {
          const snapshot = await query.get();

          return snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((file) => file.folderId === null);
        } else {
          query = query.where("folderId", "==", folderId);
          const snapshot = await query.get();

          return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        }
      } catch (error) {
        console.error("Error fetching files by folder ID:", error);
        throw error;
      }
    },

    getAllFilesByUserFromDB: async (userId) => {
      try {
        const snapshot = await db
          .collection("files")
          .where("userId", "==", userId)
          .get();

        return snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
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

  getFilesByExactDate: async (userId, date) => {
    try {
      const [year, month, day] = date.split("-").map(Number);

      // Create LOCAL date (not UTC)
      const target = new Date(year, month - 1, day, 0, 0, 0);
      const nextDay = new Date(year, month - 1, day + 1, 0, 0, 0);

      console.log("QUERY RANGE:", target, "→", nextDay);
      nextDay.setDate(nextDay.getDate() + 1);

      const snapshot = await db
        .collectionGroup("linkedDates")
        .where("userId", "==", userId)
        .where("date", ">=", Timestamp.fromDate(target))
        .where("date", "<", Timestamp.fromDate(nextDay))
        .get();

      const fileIds = new Set();

      snapshot.forEach(doc => {
        const data = doc.data();
        console.log("MATCHED DATE DOC:", data); // 🔥 debug
        if (data.fileId) fileIds.add(data.fileId);
      });

      const files = [];

      for (const id of fileIds) {
        if (!id) continue;

        const fileDoc = await db.collection("files").doc(id).get();

        if (fileDoc.exists) {
          files.push({ id, ...fileDoc.data() });
        }
      }

      return files;

    } catch (error) {
      console.error("Error fetching files by exact date:", error);
      throw error;
    }
  },
}