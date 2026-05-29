import { useEffect } from "react";
import Profile from "./authentication/Profile";
import Login from "./authentication/Login";
import Dashboard from "./storage/Dashboard";
import { Message } from "./message/Message";
import Schedule from "./schedule/Schedule";
import Task from "./task/Task";
import { AuthProvider } from "../contexts/AuthContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./authentication/PrivateRoutes";
import ForgotPassword from "./authentication/ForgotPassword";
import UpdateProfile from "./authentication/UpdateProfile";
import { useDarkMode } from "../hooks/useDarkMode";
import LoadingPage from "./shared/LoadingPage";
import { useAuth } from "../contexts/AuthContext";

function AppWrapper() {
  const { darkMode, loading, toggleDarkMode } = useDarkMode();
  const { currentUser } = useAuth();


  // ✅ FIX: apply theme globally (NO overwrite)
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  if (loading) return <LoadingPage />;

  return (
    <div className="app">
      {/* Pass toggle to children if needed */}
      <Routes>
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            </PrivateRoute>
          }
        />
        <Route
          path="/folder/:folderId"
          element={
            <PrivateRoute>
              <Dashboard toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            </PrivateRoute>
          }
        />

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

        <Route
          path="/message"
          element={
            <PrivateRoute>
              <Message />
            </PrivateRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <PrivateRoute>
              <Schedule />
            </PrivateRoute>
          }
        />

          {/* Task */}
        <Route
          path="/task"
          element={
            <PrivateRoute>
              <Task />
            </PrivateRoute>
          }
        />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/loading" element={<LoadingPage />} />
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