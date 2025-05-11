import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function signup(email, password) {
    try {
      setError(null);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
    }
  }

  async function login(email, password) {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
    }
  }

  async function logout() {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      setError(error.message);
    }
  }

  async function resetPassword(email) {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      setError(error.message);
    }
  }

  async function updateEmail(email) {
    try {
      setError(null);
      if (currentUser) {
        await currentUser.updateEmail(email);
      } else {
        throw new Error('User is not authenticated');
      }
    } catch (error) {
      setError(error.message);
    }
  }

  async function updatePassword(password) {
    try {
      setError(null);
      if (currentUser) {
        await currentUser.updatePassword(password);
      } else {
        throw new Error('User is not authenticated');
      }
    } catch (error) {
      setError(error.message);
    }
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      setError(null);
      await signInWithPopup(auth, provider);
    } catch (error) {
      setError(error.message);
    }
  }

  async function getIdToken() {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    resetPassword,
    updateEmail,
    updatePassword,
    loginWithGoogle,
    getIdToken, // Expose token function
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
