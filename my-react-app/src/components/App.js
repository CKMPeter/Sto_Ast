import React from "react";
import Profile from "./authentication/Profile";
import Login from "./authentication/Login";
import Dashboard from "./storage/Dashboard";
import { AuthProvider } from "../contexts/AuthContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./authentication/PrivateRoutes";
import ForgotPassword from "./authentication/ForgotPassword";
import UpdateProfile from "./authentication/UpdateProfile";
import { useDarkMode } from "../hooks/useDarkMode"; // import your hook

function AppWrapper() {
  const { darkMode, loading } = useDarkMode();

  if (loading) return <div>Loading user preferences...</div>;

  return (
    <div className={darkMode ? "dark-mode" : "light-mode"}>
      <Routes>
        {/* Drive */}
        <Route
          exact
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          exact
          path="/folder/:folderId"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        {/* Profile */}
        <Route
          path="/user"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/update-profile"
          element={
            <PrivateRoute>
              <UpdateProfile />
            </PrivateRoute>
          }
        />
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppWrapper />
      </AuthProvider>
    </Router>
  );
}

export default App;
