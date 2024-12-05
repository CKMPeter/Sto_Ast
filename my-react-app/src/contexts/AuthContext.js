import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../firebase'; // Ensure the correct relative path
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Start with loading as true to wait for auth initialization
    const [error, setError] = useState(null); // Track error states for auth actions

    // Function to sign up a new user
    async function signup(email, password) {
        try {
            setError(null); // Clear previous errors
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError(error.message); // Store error message
        }
    }

    // Function to log in an existing user
    async function login(email, password) {
        try {
            setError(null); // Clear previous errors
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            setError(error.message); // Store error message
        }
    }

    // Function to log out the current user
    async function logout() {
        try {
            setError(null); // Clear previous errors
            await signOut(auth);
            console.log('User logged out successfully');
        } catch (error) {
            setError(error.message); // Store error message
            console.error('Error logging out:', error);
        }
    }

    // Function to reset password
    async function resetPassword(email) {
        try {
            setError(null); // Clear previous errors
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            setError(error.message); // Store error message
        }
    }

    // Function to update email
    async function updateEmail(email) {
        try {
            setError(null); // Clear previous errors
            if (currentUser) {
                await currentUser.updateEmail(email);
            } else {
                throw new Error('User is not authenticated');
            }
        } catch (error) {
            setError(error.message); // Store error message
        }
    }

    // Function to update password
    async function updatePassword(password) {
        try {
            setError(null); // Clear previous errors
            if (currentUser) {
                await currentUser.updatePassword(password);
            } else {
                throw new Error('User is not authenticated');
            }
        } catch (error) {
            setError(error.message); // Store error message
        }
    }

    // Listen for authentication state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            console.log('Auth state changed:', user);
            setCurrentUser(user); // Set current user after auth state change
            setLoading(false); // Set loading to false after the initial auth check
        });

        return unsubscribe; // Clean up the subscription when the component unmounts
    }, []);

    const value = {
        currentUser,
        logout,
        login,
        signup,
        resetPassword,
        updateEmail,
        updatePassword,
        error, // Pass error state to components using the context
    };

    // Render the children only after loading is complete
    return (
        <AuthContext.Provider value={value}>
            {!loading && children} {/* Only render children once auth state is loaded */}
        </AuthContext.Provider>
    );
}
