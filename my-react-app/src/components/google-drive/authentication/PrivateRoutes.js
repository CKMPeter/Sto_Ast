import React from "react";
import { Navigate } from "react-router-dom";  // Make sure this is imported from react-router-dom
import { useAuth } from "../../contexts/AuthContext"; // Ensure useAuth is being used correctly

function PrivateRoute({ children }) {
  const { currentUser } = useAuth();  // Get the current user from the AuthContext

  if (!currentUser) {
    // If there's no current user, redirect to the login page
    return <Navigate to="/login" />;
  }

  return children;  // If authenticated, render the children (Dashboard)
}

export default PrivateRoute;
