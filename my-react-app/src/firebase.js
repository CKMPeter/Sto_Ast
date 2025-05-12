  import { initializeApp } from 'firebase/app';
  import { getAuth } from 'firebase/auth';
  import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
  import { getStorage } from 'firebase/storage';
  import { getDatabase, ref, remove, update } from 'firebase/database';

  // Firebase configuration
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  export const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export const firestore = getFirestore(app);
  export const storage = getStorage(app);
  export const realtimeDatabase = getDatabase(app);

  // Firestore collection references
  export const database = {
    folders: collection(firestore, 'folders'),
    files: collection(firestore, 'files'),

    // Sanitize document output, converting Firebase Timestamp to ISO string
    formatDoc: (doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || null,  // Mitigate timestamp disclosure
      };
    },
  };

  // Add a folder with secure timestamp
  export const addFolder = (folderName, uId, pId, pth) => {
    return addDoc(database.folders, {
      name: folderName,
      userId: uId,
      parentId: pId,
      path: pth,
      createdAt: serverTimestamp(),  // Stored as serverTimestamp, but formatted before exposure
    });
  };

  export { ref, remove, update };
  export default app;