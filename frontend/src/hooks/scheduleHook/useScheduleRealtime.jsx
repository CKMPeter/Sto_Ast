import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { realtimeDatabase } from "../../config/firebase";
import { ref, onValue, off } from "firebase/database";

export function useScheduleRealtime() {
  const { currentUser } = useAuth(); // ✅ MUST BE TOP LEVEL
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const queueRef = ref(
      realtimeDatabase,
      `users/${currentUser.uid}/scheduleQueue`
    );

    const unsubscribe = onValue(queueRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setEvents([]);
        return;
      }

      const allEvents = [];

      Object.entries(data).forEach(([date, schedules]) => {
        Object.entries(schedules).forEach(([id, value]) => {
          allEvents.push({
            id,
            date,
            title: value.title,
            start: value.start,
            duration: value.duration
          });
        });
      });

      console.log(" REALTIME EVENTS:", allEvents);
      setEvents(allEvents);
    });

    return () => off(queueRef);
  }, [currentUser]);

  return events;
}