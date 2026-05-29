import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

// ⚠️ DÙNG config y chang firebase.js của bạn
 const firebaseConfig = {
    apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_APP_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_FIREBASE_APP_ID,
  };

// init app
const app = initializeApp(firebaseConfig);

// ✅ EXPORT storage
export const storage = getStorage(app);