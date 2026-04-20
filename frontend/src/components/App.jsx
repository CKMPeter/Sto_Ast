import { useEffect } from "react";
import Profile from "./authentication/Profile";
import Login from "./authentication/Login";
import Dashboard from "./storage/Dashboard";
import { Message } from "./message/Message";
import Schedule from "./schedule/Schedule";
import { AuthProvider } from "../contexts/AuthContext";
import { CallProvider } from "../contexts/CallContext";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PrivateRoute from "./authentication/PrivateRoutes";
import ForgotPassword from "./authentication/ForgotPassword";
import UpdateProfile from "./authentication/UpdateProfile";
import { useDarkMode } from "../hooks/useDarkMode"; // import your hook
import LoadingPage from "./shared/LoadingPage";
import CallModal from "./CallModal";
import useCall from "../webrtc/useCall";
import { useAuth } from "../contexts/AuthContext";

function AppWrapper() {
  const { darkMode, loading } = useDarkMode();
  const { currentUser } = useAuth(); 

  const { acceptCall, endCall } = useCall(currentUser?.uid);

  useEffect(() => {
    document.body.className = darkMode ? "dark-mode" : "light-mode";
  }, [darkMode]);

  if (loading) return <LoadingPage />;

  return (
    <div className={darkMode ? "dark-mode" : "light-mode"}>
      <Routes>
        {/* Drive */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
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

        {/* Message */}
        <Route
          path="/message"
          element={
            <PrivateRoute>
              <Message />
            </PrivateRoute>
          }
        />

        {/* Schedule */}
        <Route
          path="/Schedule"
          element={
            <PrivateRoute>
              <Schedule />
            </PrivateRoute>
          }
        />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/loading" element={<LoadingPage />} />
      </Routes>

      {/* Call UI */}
      <CallModal onAccept={acceptCall} onEnd={endCall} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CallProvider>
          <AppWrapper />
        </CallProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
