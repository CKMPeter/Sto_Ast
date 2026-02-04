import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export function useDarkMode() {
  const { currentUser, getIdToken } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch dark mode from backend on mount or user change
  useEffect(() => {
    if (!currentUser) {
      setDarkMode(false);
      setLoading(false);
      return;
    }

    async function fetchDarkMode() {
      setLoading(true);
      try {
        const token = await currentUser.getIdToken(true); // <- force refreshs
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/theme`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setDarkMode(data.darkMode);
        }
      } catch (error) {
        console.error("Failed to fetch dark mode:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDarkMode();
  }, [currentUser, getIdToken]);

  // Toggle dark mode locally and update backend
  async function toggleDarkMode() {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode); // Instant UI feedback

    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken(true);
      if (!token) return;

      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/theme`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ darkMode: newDarkMode }),
      });

      if (!res.ok) {
        console.error("Failed to update dark mode");
      } else {
        window.location.reload(); // ✅ Refresh after successful update
      }
    } catch (error) {
      console.error("Error updating dark mode:", error);
    }
  }

  return { darkMode, toggleDarkMode, loading };
}