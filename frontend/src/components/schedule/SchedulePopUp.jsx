import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function SchedulePopUp({ date, close, userId }) {

  const { getIdToken, currentUser } = useAuth();
  const timelineRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [clickedMinutes, setClickedMinutes] = useState(null);
  const [eventTitle, setEventTitle] = useState("");

  const hours = Array.from({ length: 24 }, (_, i) => i);

  function handleTimelineClick(e) {

    const container = timelineRef.current;
    const rect = container.getBoundingClientRect();

    const clickY = e.clientY - rect.top;
    const scrollOffset = container.scrollTop;

    const realY = clickY + scrollOffset;
    const fullHeight = container.scrollHeight;

    const percent = realY / fullHeight;
    const totalMinutes = Math.floor(percent * 1440);

    setClickedMinutes(totalMinutes);

    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;

    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 ? "AM" : "PM";

    alert(`Selected Time: ${displayHour}:${minute
      .toString()
      .padStart(2, "0")} ${ampm}`);
  }

  async function addEvent() {

        if (clickedMinutes === null) {
            alert("Click timeline first");
            return;
        }

        try {

            const token = await getIdToken();

            const res = await fetch(
            `${import.meta.env.VITE_APP_BACKEND_URL}/api/schedules`,
            {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                title: eventTitle,
                date: date.toISOString().split("T")[0],
                startMinutes: clickedMinutes,
                duration: 60,
                userId: currentUser.uid
                })
            }
            );

            if (!res.ok) {
            throw new Error("Failed to create schedule");
            }

            const data = await res.json();

            const newEvent = {
            id: data.id || Date.now(),
            start: clickedMinutes,
            duration: 60,
            title: eventTitle
            };

            setEvents([...events, newEvent]);

        } catch (err) {
            console.error("Schedule API error", err);
        }
    }

    async function loadEvents() {

    try {

        const token = await getIdToken();

        const res = await fetch(
        `${import.meta.env.VITE_APP_BACKEND_URL}/api/schedules?date=${date
            .toISOString()
            .split("T")[0]}`,
        {
            headers: {
            Authorization: `Bearer ${token}`
            }
        }
        );

        if (!res.ok) {
        throw new Error("Failed to load schedules");
        }

        const data = await res.json();

        const formattedEvents = (data.events || []).map(e => ({
        id: e.id,
        start: e.startMinutes ?? e.start,
        duration: e.duration ?? 60,
        title: e.title
        }));

        setEvents(formattedEvents);

    } catch (err) {
        console.error("Load schedules error:", err);
    }

    }

  function deleteEvent() {

    if (!selectedEvent) {
      alert("Select event first");
      return;
    }

    setEvents(events.filter(e => e.id !== selectedEvent.id));
    setSelectedEvent(null);
  }

  function updateEvent() {

    if (!selectedEvent) {
      alert("Select event first");
      return;
    }

    if (!eventTitle) {
      alert("Enter new title");
      return;
    }

    const updated = events.map(e => {

      if (e.id === selectedEvent.id) {

        return {
          ...e,
          title: eventTitle
        };

      }

      return e;

    });

    setEvents(updated);
    setEventTitle("");
  }

    useEffect(() => {
        if (currentUser) {
            loadEvents();
        }
    }, [date, currentUser]);

  function renderEvents() {

    const containerHeight = timelineRef.current?.scrollHeight || 960;

    return events.map(event => {

      const top = (event.start / 1440) * containerHeight;
      const height = (event.duration / 1440) * containerHeight;

      return (
        <div
          key={event.id}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(event);
            setEventTitle(event.title);
          }}
          style={{
            ...styleSheet.eventBlock,
            top: top,
            height: height,
            backgroundColor:
              selectedEvent?.id === event.id
                ? "#ff9800"
                : "#2196F3"
          }}
        >
          {event.title}
        </div>
      );
    });
  }

  return (
    <div style={styleSheet.overlay} onClick={close}>
      <div
        style={styleSheet.root}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={styleSheet.title}>
          Schedule for {date?.toDateString()}
        </h3>

        <input
          style={styleSheet.input}
          placeholder="Event title..."
          value={eventTitle}
          onChange={(e) => setEventTitle(e.target.value)}
        />

        <div
          ref={timelineRef}
          style={styleSheet.timeLineContainter}
          onClick={handleTimelineClick}
        >
          {hours.map((hour) => {

            const displayHour = hour % 12 === 0 ? 12 : hour % 12;
            const ampm = hour < 12 ? "AM" : "PM";

            return (
              <div key={hour} style={styleSheet.timeRow}>
                <div style={styleSheet.timeLabel}>
                  {displayHour}:00 {ampm}
                </div>

                <div style={styleSheet.timeSlot}></div>
              </div>
            );
          })}

          {renderEvents()}
        </div>

        <div style={styleSheet.buttonContainer}>

          <button style={styleSheet.addButton} onClick={addEvent}>
            Add
          </button>

          <button style={styleSheet.updateButton} onClick={updateEvent}>
            Update
          </button>

          <button style={styleSheet.deleteButton} onClick={deleteEvent}>
            Delete
          </button>

        </div>

        <button style={styleSheet.closeButton} onClick={close}>
          Close
        </button>

      </div>
    </div>
  );
}

const styleSheet = {

  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  root: {
    background: "white",
    padding: "2rem",
    borderRadius: "10px",
    minWidth: "420px",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },

  title: {
    textAlign: "center",
  },

  input: {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "6px"
  },

  timeLineContainter: {
    border: "1px solid #ddd",
    borderRadius: "6px",
    height: "360px",
    padding: "0.5rem",
    overflowY: "scroll",
    position: "relative"
  },

  timeRow: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #eee",
    height: "40px",
  },

  timeLabel: {
    width: "80px",
    fontSize: "0.8rem",
    color: "#666",
  },

  timeSlot: {
    flex: 1,
    borderLeft: "2px solid #eee",
    height: "40px",
  },

  eventBlock: {
    position: "absolute",
    left: "90px",
    right: "10px",
    borderRadius: "6px",
    color: "white",
    padding: "4px",
    fontSize: "0.8rem",
    cursor: "pointer"
  },

  buttonContainer: {
    display: "flex",
    gap: "0.5rem",
  },

  addButton: {
    flex: 1,
    padding: "0.5rem",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  updateButton: {
    flex: 1,
    padding: "0.5rem",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  deleteButton: {
    flex: 1,
    padding: "0.5rem",
    backgroundColor: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  closeButton: {
    padding: "0.5rem",
    backgroundColor: "#ddd",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

