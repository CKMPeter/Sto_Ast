import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
// import { useScheduleQueue } from "../../hooks/scheduleHook/useScheduleQueue";

export default function SchedulePopUp({ date, close, userId }) {

  //const { addEvent: addToQueue, getEventsByDate, deleteEvent: deleteFromQueue } = useScheduleQueue();
  const { getIdToken, currentUser } = useAuth();
  const timelineRef = useRef(null);

  // Local state for events and form
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [clickedMinutes, setClickedMinutes] = useState(null);
  const [eventTitle, setEventTitle] = useState("");

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // New state to track if a time slot has been selected
  const [isTimeSelected, setIsTimeSelected] = useState(false);

  const linkedFileList = [
    { id: 1, name: "Project Plan.docx" },
    { id: 2, name: "Budget.xlsx" },
    { id: 3, name: "Presentation.pptx" }
  ];

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
    setIsTimeSelected(true);
    console.log(isTimeSelected);
  }

async function addEvent() {
  if (!eventTitle.trim()) {
    alert("Enter event title");
    return;
  }

  if (clickedMinutes === null) {
    alert("Select time first");
    return;
  }

  try {
    const token = await getIdToken();
    const formattedDate = date.toISOString().split("T")[0];

    const payload = {
      title: eventTitle.trim(),        // ✅ from input
      date: formattedDate,
      startMinutes: clickedMinutes,    // ✅ from time input
      duration: 60,
      userId: currentUser.uid
    };

    const res = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}/api/schedules`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      }
    );

    if (!res.ok) throw new Error("Failed to create schedule");

    const data = await res.json();

    setEvents(prev => [
      ...prev,
      {
        id: data.id,
        start: payload.startMinutes,
        duration: payload.duration,
        title: payload.title
      }
    ]);

    // ✅ reset form
    setEventTitle("");
    setClickedMinutes(null);
    setIsTimeSelected(false);

  } catch (err) {
    console.error("Schedule API error", err);
  }
}
async function loadEvents() {
  try {
    const token = await getIdToken();
    const formattedDate = date.toISOString().split("T")[0];

    const res = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}/api/schedules?date=${formattedDate}&userId=${currentUser.uid}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) throw new Error("Failed to load schedules");

    const data = await res.json();

    const backendEvents = (data.events || []).map(e => ({
      id: e.id,
      start: Number(e.startMinutes ?? e.start ?? 0), // ✅ SAFE
      duration: Number(e.duration ?? 60),
      title: e.title || "Untitled"
    }));

    setEvents(backendEvents);

  } catch (err) {
    console.error("Load schedules error:", err);
  }
}

async function deleteEvent() {
  if (!selectedEvent) {
    alert("Select event first");
    return;
  }

  try {
    const token = await getIdToken();

    const res = await fetch(
      `${import.meta.env.VITE_APP_BACKEND_URL}/api/schedules/${selectedEvent.id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) throw new Error("Delete failed");

    setEvents(prev => prev.filter(e => e.id !== selectedEvent.id));
    setSelectedEvent(null);

  } catch (err) {
    console.error("Delete error:", err);
  }
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

    if (!Number.isFinite(event.start) || !Number.isFinite(event.duration)) {
      return null;
    }

    const top = (event.start / 1440) * containerHeight;
    const height = (event.duration / 1440) * containerHeight;

    return (
      <>
        <div
          key={event.id ?? `${event.start}-${event.title}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(event);
            setEventTitle(event.title);
          }}
          style={{
            ...styleSheet.eventBlock,
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor:
              selectedEvent?.id === event.id
                ? "#ff9800"
                : "#2196F3"
          }}
        >
          {event.title}
        </div>
      </>
    );
  });
}

  //HELPER FOR FORMATING TIME
function formatTime(minutes) {
    if (minutes === null) return "";

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={styleSheet.overlay} onClick={close}>
        <div
          style={styleSheet.root}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={styleSheet.title}>
            Schedule for {date?.toDateString()}
          </h3>

          <div style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            width: "100%",
          }}>
            {/*Main Form for time selection */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexGrow: 1 }}>
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

            {/*Secondary Form for Event Details */}
            <div style={{ display: isTimeSelected ? "flex" : "none", marginTop: "1rem", flexDirection: "column", gap: "0.5rem", width: "200px" }}>
              <input
                style={styleSheet.input}
                placeholder="Event title..."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
              />
              <input
                type="time"
                value={formatTime(clickedMinutes)}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(":").map(Number);
                  setClickedMinutes(h * 60 + m);
                }}
              />

              {/*FILE LINKED*/}
              {linkedFileList.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <h4>Linked Files</h4>
                  <div style={{
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    padding: "0.5rem"
                  }}>
                    <ul>
                      {linkedFileList.map(file => (
                        <li key={file.id}>{file.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              <div>
                <button >
                  Save Details
                </button>
                < button >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
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
    background: "#fff",
    padding: "1.5rem",
    borderRadius: "10px",

    width: "60vw",

    height: "80vh",          // 🔥 limit height
    maxHeight: "80vh",

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
    width: "100%",
  },
};

