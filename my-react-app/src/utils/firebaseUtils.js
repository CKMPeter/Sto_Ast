import { ref, set, get, serverTimestamp } from "firebase/database";
import { storage,realtimeDatabase } from "../firebase"; // Firebase Storage import (for later use)
import { uploadBytesResumable, getDownloadURL } from "firebase/storage";
/**
 * FirebaseUtils class handles file upload operations to Firebase Realtime Database and Storage.
 */
class FirebaseUtils {
  static async uploadFileToDatabase(currentUser, file, filePath, currentFolder) {
    try {
      const fileRef = ref(realtimeDatabase, `files/${currentUser.uid}/${filePath}`);

      const base64File = await this.convertFileToBase64(file);

      const fileData = {
        name: file.name,
        content: base64File,
        path: filePath,
        createdAt: serverTimestamp(),
        folderId: currentFolder.id,
      };

      // Save to Realtime Database
      await set(fileRef, fileData);

      return { success: true, message: "File uploaded successfully" };
    } catch (error) {
      console.error("Error uploading file to Realtime Database:", error);
      return { success: false, message: error.message };
    }
  }

  static async uploadFileToStorage(currentUser, file, filePath) {
    try {
      const storageRef = ref(storage, `files/${currentUser.uid}/${filePath}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload progress:", progress);
          },
          (error) => reject(error),
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((downloadURL) => resolve(downloadURL))
              .catch(reject);
          }
        );
      });
    } catch (error) {
      console.error("Error uploading file to Firebase Storage:", error);
      throw new Error(error.message);
    }
  }

  static async convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);

      reader.readAsDataURL(file);
    });
  }

  static async checkIfFileExists(currentUser, filePath) {
    const fileRef = ref(realtimeDatabase, `files/${currentUser.uid}/${filePath}`);

    try {
      const snapshot = await get(fileRef);
      return snapshot.exists(); // Returns true if file exists
    } catch (error) {
      console.error("Error checking file existence:", error);
      return false;
    }
  }
}

export default FirebaseUtils;
