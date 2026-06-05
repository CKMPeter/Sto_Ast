import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL || "https://localhost:5000";

export function useScheduleRealtime() {
  const { currentUser, getIdToken } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchEvents = async () => {
      try {
        const token = await getIdToken();

        const response = await fetch(
          `${BACKEND_URL}/api/notifications/${currentUser.uid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Request failed: ${response.status} ${errorText}`
          );
        }

        const data = await response.json();

        setEvents(data.events || []);
      } catch (error) {
        console.error(
          "Failed to fetch schedule notifications:",
          error
        );
        setEvents([]);
      }
    };

    fetchEvents();

    const interval = setInterval(fetchEvents, 5000);

    return () => clearInterval(interval);
  }, [currentUser, getIdToken]);

  return events;
}