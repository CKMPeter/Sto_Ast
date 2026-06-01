import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

import {
  formatLocalDate,
  formatTime,
  createScheduleService,
  getSchedulesByDateService,
  updateScheduleService,
  deleteScheduleService,
  getLinkedFilesByDateService,
} from "../../services/scheduleService/scheduleService";

export default function SchedulePopUp({ date, close }) {
  const { getIdToken, currentUser } = useAuth();
  const timelineRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [clickedMinutes, setClickedMinutes] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [isTimeSelected, setIsTimeSelected] = useState(false);
  const [linkedFiles, setLinkedFiles] = useState([]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  function handleTimelineClick(e) {
    const container = timelineRef.current;
    const rect = container.getBoundingClientRect();

    const clickY = e.clientY - rect.top;
    const scrollOffset = container.scrollTop;
    const realY = clickY + scrollOffset;
    const fullHeight = container.scrollHeight;

    const totalMinutes = Math.floor((realY / fullHeight) * 1440);

    setClickedMinutes(totalMinutes);
    setIsTimeSelected(true);
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
      const formattedDate = formatLocalDate(date);

      const data = await createScheduleService({
        getIdToken,
        title: eventTitle.trim(),
        date: formattedDate,
        startMinutes: clickedMinutes,
        duration: 60,
        userId: currentUser.uid,
      });

      setEvents((prev) => [
        ...prev,
        {
          id: data.id,
          start: clickedMinutes,
          duration: 60,
          title: eventTitle.trim(),
        },
      ]);

      setEventTitle("");
      setClickedMinutes(null);
      setIsTimeSelected(false);
    } catch (err) {
      console.error("Schedule API error:", err);
    }
  }

  async function loadLinkedFiles() {
    try {
      const formattedDate = formatLocalDate(date);

      const files = await getLinkedFilesByDateService({
        getIdToken,
        date: formattedDate,
      });

      setLinkedFiles(files);
    } catch (err) {
      console.error("Error loading linked files:", err);
    }
  }

  async function loadEvents() {
    try {
      const formattedDate = formatLocalDate(date);

      const backendEvents = await getSchedulesByDateService({
        getIdToken,
        date: formattedDate,
        userId: currentUser.uid,
      });

      const mappedEvents = backendEvents.map((event) => ({
        id: event.id,
        start: Number(event.startMinutes ?? event.start ?? 0),
        duration: Number(event.duration ?? 60),
        title: event.title || "Untitled",
      }));

      setEvents(mappedEvents);
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
      await deleteScheduleService({
        getIdToken,
        scheduleId: selectedEvent.id,
      });

      setEvents((prev) => prev.filter((event) => event.id !== selectedEvent.id));
      setSelectedEvent(null);
      setEventTitle("");
    } catch (err) {
      console.error("Delete error:", err);
    }
  }

  async function updateEvent() {
    if (!selectedEvent) {
      alert("Select event first");
      return;
    }

    try {
      await updateScheduleService({
        getIdToken,
        scheduleId: selectedEvent.id,
        title: eventTitle,
      });

      await loadEvents();

      setSelectedEvent(null);
      setEventTitle("");
    } catch (err) {
      console.error("Update error:", err);
    }
  }

  useEffect(() => {
    if (currentUser) {
      loadEvents();
      loadLinkedFiles();
    }
  }, [date, currentUser]);

  function renderEvents() {
    const containerHeight = timelineRef.current?.scrollHeight || 960;

    return events.map((event) => {
      if (!Number.isFinite(event.start) || !Number.isFinite(event.duration)) {
        return null;
      }

      const top = (event.start / 1440) * containerHeight;
      const height = (event.duration / 1440) * containerHeight;

      return (
        <div
          key={event.id ?? `${event.start}-${event.title}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(event);
            setEventTitle(event.title);
            setClickedMinutes(event.start);
            setIsTimeSelected(true);
          }}
          style={{
            ...styleSheet.eventBlock,
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor:
              selectedEvent?.id === event.id ? "#ff9800" : "#2196F3",
          }}
        >
          {event.title}
        </div>
      );
    });
  }

  return (
    <div style={styleSheet.wrapper}>
      <div style={styleSheet.overlay} onClick={close}>
        <div style={styleSheet.root} onClick={(e) => e.stopPropagation()}>
          <h3 style={styleSheet.title}>Schedule for {date?.toDateString()}</h3>

          <div style={styleSheet.mainContent}>
            <div style={styleSheet.leftPanel}>
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

            <div style={styleSheet.rightPanel}>
              <div style={styleSheet.linkedFilesSection}>
                <h4>Linked Files</h4>

                <div style={styleSheet.linkedFilesBox}>
                  {linkedFiles.length === 0 ? (
                    <div style={styleSheet.emptyFiles}>No linked files</div>
                  ) : (
                    linkedFiles.map((file) => (
                      <div
                        key={file.id}
                        style={styleSheet.fileChip}
                        title={file.name}
                      >
                        📄 {file.name}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {isTimeSelected && (
                <div style={styleSheet.detailsPanel}>
                  <input
                    style={styleSheet.input}
                    placeholder="Event title..."
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                  />

                  <input
                    style={styleSheet.input}
                    type="time"
                    value={formatTime(clickedMinutes)}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      setClickedMinutes(h * 60 + m);
                    }}
                  />

                  <div style={styleSheet.detailButtons}>
                    <button style={styleSheet.updateButton} onClick={updateEvent}>
                      Save Details
                    </button>

                    <button
                      style={styleSheet.closeButton}
                      onClick={() => {
                        setIsTimeSelected(false);
                        setSelectedEvent(null);
                        setEventTitle("");
                        setClickedMinutes(null);
                      }}
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styleSheet = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

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
    height: "80vh",
    maxHeight: "80vh",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },

  title: {
    textAlign: "center",
  },

  mainContent: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    width: "100%",
    overflow: "hidden",
  },

  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    flex: 1,
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },

  input: {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },

  timeLineContainter: {
    border: "1px solid #ddd",
    borderRadius: "6px",
    height: "360px",
    padding: "0.5rem",
    overflowY: "scroll",
    position: "relative",
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
    cursor: "pointer",
    overflow: "hidden",
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
    flex: 1,
    padding: "0.5rem",
    backgroundColor: "#ddd",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  linkedFilesSection: {
    marginTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },

  linkedFilesBox: {
    border: "1px solid #ddd",
    borderRadius: "6px",
    padding: "0.5rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },

  emptyFiles: {
    fontSize: "0.8rem",
    color: "#888",
    width: "100%",
    textAlign: "center",
    padding: "6px 0",
  },

  fileChip: {
    padding: "4px 8px",
    borderRadius: "12px",
    background: "#f1f1f1",
    fontSize: "0.8rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: "500",
    cursor: "pointer",
  },

  detailsPanel: {
    display: "flex",
    marginTop: "1rem",
    flexDirection: "column",
    gap: "0.5rem",
    width: "100%",
  },

  detailButtons: {
    display: "flex",
    gap: "0.5rem",
  },
};