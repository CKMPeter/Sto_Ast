import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const getBackendUrl = () => {
  return (
    import.meta.env.VITE_APP_BACKEND_URL ||
    "http://localhost:5000"
  );
};

export function useDarkMode() {
  const { currentUser } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setDarkMode(false);
      setLoading(false);
      return;
    }

    const fetchDarkMode = async () => {
      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${getBackendUrl()}/api/user/theme`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed request");

        const data = await res.json();
        setDarkMode(data.darkMode ?? false);

      } catch (error) {
        console.error("Failed to fetch dark mode:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDarkMode();
  }, [currentUser]);

  // ✅ GLOBAL APPLY (CRITICAL FIX)
  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.body.classList.toggle("light-mode", !darkMode);
  }, [darkMode]);

  const toggleDarkMode = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);

    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();

      const res = await fetch(`${getBackendUrl()}/api/user/theme`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ darkMode: newValue }),
      });

      if (!res.ok) throw new Error("Update failed");

    } catch (error) {
      console.error("Error updating dark mode:", error);
      setDarkMode(!newValue);
    }
  };

  return { darkMode, toggleDarkMode, loading };
}