import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { storage, firestore } from "../firebase";
import { v4 as uuidv4 } from "uuid";

/**
 * Utility class for Firebase Storage and Firestore integration.
 */
class FirebaseUtils {
  /**
   * Sanitizes the file name to avoid unsafe characters.
   */
  static sanitizeFilename(name) {
    return name.replace(/[^\w.-]/g, "_");
  }

  /**
   * Uploads a file to Firebase Storage and saves metadata to Firestore.
   */
  static async uploadFile(currentUser, file, pathSegments, currentFolder, onProgress) {
    try {
      const fileId = uuidv4();
      const safeName = FirebaseUtils.sanitizeFilename(file.name);
      const filePath = [...pathSegments, safeName].join("/");

      const fileStorageRef = storageRef(storage, `files/${currentUser.uid}/${filePath}`);
      const metadataRef = doc(collection(firestore, "files", currentUser.uid, "metadata"), fileId);

      const uploadTask = uploadBytesResumable(fileStorageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => reject(error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Save file metadata to Firestore
            await setDoc(metadataRef, {
              id: fileId,
              name: file.name,
              path: filePath,
              downloadURL,
              folderId: currentFolder.id,
              createdAt: serverTimestamp(),
              size: file.size,
              type: file.type,
            });

            resolve({
              success: true,
              message: "File uploaded and metadata saved",
              fileId,
              downloadURL,
            });
          }
        );
      });
    } catch (error) {
      console.error("Upload failed:", error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Checks if a file with the given name exists in the specified folder.
   */
  static async checkIfFileExists(currentUser, fileName, folderId) {
    const metadataCollection = collection(firestore, "files", currentUser.uid, "metadata");

    try {
      const q = query(
        metadataCollection,
        where("name", "==", fileName),
        where("folderId", "==", folderId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking file existence:", error);
      return false;
    }
  }
}

export default FirebaseUtils;
