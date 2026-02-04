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

  async function updateUser(email, password) {
    try {
      setError(null);
      const token = await getIdToken();
      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newEmail: email, newPassword: password }),
      });
      if (response.status !== 200) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }
    } catch (error) {
      setError(error.message);
      throw error; // Re-throw the error to be handled by the caller
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
    updateUser,
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
