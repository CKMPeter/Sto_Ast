import React, { useRef, useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDarkMode } from "../../hooks/useDarkMode";

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
  const { darkMode } = useDarkMode();

  const timelineRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [clickedMinutes, setClickedMinutes] = useState(null);
  const [eventTitle, setEventTitle] = useState("");
  const [isTimeSelected, setIsTimeSelected] = useState(false);
  const [linkedFiles, setLinkedFiles] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadEvents();
      loadLinkedFiles();
    }
  }, [date, currentUser]);

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

      setEvents((prev) =>
        prev.filter((event) => event.id !== selectedEvent.id)
      );

      setSelectedEvent(null);
      setEventTitle("");
      setClickedMinutes(null);
      setIsTimeSelected(false);
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
      setClickedMinutes(null);
      setIsTimeSelected(false);
    } catch (err) {
      console.error("Update error:", err);
    }
  }

  function clearDetails() {
    setIsTimeSelected(false);
    setSelectedEvent(null);
    setEventTitle("");
    setClickedMinutes(null);
  }

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
            ...(isMobile ? styleSheet.eventBlockMobile : {}),
            top: `${top}px`,
            height: `${height}px`,
            backgroundColor:
              selectedEvent?.id === event.id ? "#ff9800" : "#0077b6",
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
        <div
          style={{
            ...styleSheet.root,
            ...(darkMode ? styleSheet.rootDark : styleSheet.rootLight),
            ...(isMobile ? styleSheet.rootMobile : {}),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3
            style={{
              ...styleSheet.title,
              color: darkMode ? "#ffffff" : "#023047",
            }}
          >
            Schedule for {date?.toDateString()}
          </h3>

          <div
            style={{
              ...styleSheet.mainContent,
              ...(isMobile ? styleSheet.mainContentMobile : {}),
            }}
          >
            <div style={styleSheet.leftPanel}>
              <div
                ref={timelineRef}
                style={{
                  ...styleSheet.timeLineContainter,
                  ...(darkMode
                    ? styleSheet.timeLineContainterDark
                    : styleSheet.timeLineContainterLight),
                  ...(isMobile ? styleSheet.timeLineContainterMobile : {}),
                }}
                onClick={handleTimelineClick}
              >
                {hours.map((hour) => {
                  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
                  const ampm = hour < 12 ? "AM" : "PM";

                  return (
                    <div
                      key={hour}
                      style={{
                        ...styleSheet.timeRow,
                        borderBottom: darkMode
                          ? "1px solid #16425b"
                          : "1px solid #eeeeee",
                      }}
                    >
                      <div
                        style={{
                          ...styleSheet.timeLabel,
                          color: darkMode ? "#b8dce8" : "#666666",
                        }}
                      >
                        {displayHour}:00 {ampm}
                      </div>

                      <div
                        style={{
                          ...styleSheet.timeSlot,
                          borderLeft: darkMode
                            ? "2px solid #16425b"
                            : "2px solid #eeeeee",
                        }}
                      />
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

              <button
                style={{
                  ...styleSheet.closeButton,
                  ...(darkMode
                    ? styleSheet.closeButtonDark
                    : styleSheet.closeButtonLight),
                }}
                onClick={close}
              >
                Close
              </button>
            </div>

            <div style={styleSheet.rightPanel}>
              <div style={styleSheet.linkedFilesSection}>
                <h4
                  style={{
                    margin: 0,
                    color: darkMode ? "#ffffff" : "#023047",
                  }}
                >
                  Linked Files
                </h4>

                <div
                  style={{
                    ...styleSheet.linkedFilesBox,
                    ...(darkMode
                      ? styleSheet.linkedFilesBoxDark
                      : styleSheet.linkedFilesBoxLight),
                  }}
                >
                  {linkedFiles.length === 0 ? (
                    <div
                      style={{
                        ...styleSheet.emptyFiles,
                        color: darkMode ? "#b8dce8" : "#888888",
                      }}
                    >
                      No linked files
                    </div>
                  ) : (
                    linkedFiles.map((file) => (
                      <div
                        key={file.id}
                        style={{
                          ...styleSheet.fileChip,
                          ...(darkMode
                            ? styleSheet.fileChipDark
                            : styleSheet.fileChipLight),
                        }}
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
                    style={{
                      ...styleSheet.input,
                      ...(darkMode
                        ? styleSheet.inputDark
                        : styleSheet.inputLight),
                    }}
                    placeholder="Event title..."
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                  />

                  <input
                    style={{
                      ...styleSheet.input,
                      ...(darkMode
                        ? styleSheet.inputDark
                        : styleSheet.inputLight),
                    }}
                    type="time"
                    value={formatTime(clickedMinutes)}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      setClickedMinutes(h * 60 + m);
                    }}
                  />

                  <div style={styleSheet.detailButtons}>
                    <button
                      style={styleSheet.updateButton}
                      onClick={updateEvent}
                    >
                      Save Details
                    </button>

                    <button
                      style={{
                        ...styleSheet.closeButton,
                        ...(darkMode
                          ? styleSheet.closeButtonDark
                          : styleSheet.closeButtonLight),
                      }}
                      onClick={clearDetails}
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
    inset: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5000,
    padding: "12px",
  },

  root: {
    padding: "clamp(0.75rem, 2vw, 1.5rem)",
    borderRadius: "14px",
    width: "min(900px, 96vw)",
    height: "min(82vh, 720px)",
    maxHeight: "82vh",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    overflow: "hidden",
  },

  rootLight: {
    background: "#ffffff",
    color: "#023047",
  },

  rootDark: {
    background: "#0b2635",
    color: "#ffffff",
    border: "1px solid #16425b",
  },

  rootMobile: {
    width: "96vw",
    height: "92vh",
    maxHeight: "92vh",
    padding: "0.75rem",
  },

  title: {
    textAlign: "center",
    margin: 0,
    fontSize: "clamp(1rem, 2vw, 1.4rem)",
  },

  mainContent: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    width: "100%",
    flex: 1,
    overflow: "hidden",
  },

  mainContentMobile: {
    flexDirection: "column",
    overflowY: "auto",
  },

  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    flex: 1.2,
    minWidth: 0,
  },

  rightPanel: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },

  input: {
    padding: "0.5rem",
    borderRadius: "8px",
    width: "100%",
    outline: "none",
  },

  inputLight: {
    background: "#ffffff",
    color: "#023047",
    border: "1px solid #cccccc",
  },

  inputDark: {
    background: "#071923",
    color: "#ffffff",
    border: "1px solid #16425b",
  },

  timeLineContainter: {
    borderRadius: "8px",
    height: "420px",
    minHeight: "420px",
    padding: "0.5rem",
    overflowY: "auto",
    position: "relative",
  },

  timeLineContainterLight: {
    background: "#ffffff",
    border: "1px solid #dddddd",
  },

  timeLineContainterDark: {
    background: "#071923",
    border: "1px solid #16425b",
  },

  timeLineContainterMobile: {
    height: "360px",
    minHeight: "360px",
  },

  timeRow: {
    display: "flex",
    alignItems: "center",
    height: "40px",
  },

  timeLabel: {
    width: "80px",
    fontSize: "0.8rem",
    flexShrink: 0,
  },

  timeSlot: {
    flex: 1,
    height: "40px",
  },

  eventBlock: {
    position: "absolute",
    left: "90px",
    right: "10px",
    borderRadius: "8px",
    color: "white",
    padding: "4px 6px",
    fontSize: "0.8rem",
    cursor: "pointer",
    overflow: "hidden",
  },

  eventBlockMobile: {
    left: "74px",
  },

  buttonContainer: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },

  addButton: {
    flex: 1,
    minWidth: "80px",
    padding: "0.5rem",
    backgroundColor: "#0077b6",
    color: "white",
    border: "1px solid #0077b6",
    borderRadius: "8px",
    cursor: "pointer",
  },

  updateButton: {
    flex: 1,
    minWidth: "80px",
    padding: "0.5rem",
    backgroundColor: "#005f92",
    color: "white",
    border: "1px solid #005f92",
    borderRadius: "8px",
    cursor: "pointer",
  },

  deleteButton: {
    flex: 1,
    minWidth: "80px",
    padding: "0.5rem",
    backgroundColor: "#d62828",
    color: "white",
    border: "1px solid #d62828",
    borderRadius: "8px",
    cursor: "pointer",
  },

  closeButton: {
    flex: 1,
    minWidth: "80px",
    padding: "0.5rem",
    borderRadius: "8px",
    cursor: "pointer",
  },

  closeButtonLight: {
    backgroundColor: "#e6f7fc",
    color: "#0077b6",
    border: "1px solid #caf0f8",
  },

  closeButtonDark: {
    backgroundColor: "#12384c",
    color: "#ffffff",
    border: "1px solid #16425b",
  },

  linkedFilesSection: {
    marginTop: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    minHeight: 0,
  },

  linkedFilesBox: {
    borderRadius: "8px",
    padding: "0.5rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    overflowY: "auto",
    maxHeight: "180px",
  },

  linkedFilesBoxLight: {
    background: "#ffffff",
    border: "1px solid #dddddd",
  },

  linkedFilesBoxDark: {
    background: "#071923",
    border: "1px solid #16425b",
  },

  emptyFiles: {
    fontSize: "0.8rem",
    width: "100%",
    textAlign: "center",
    padding: "6px 0",
  },

  fileChip: {
    maxWidth: "100%",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.8rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontWeight: "500",
    cursor: "pointer",
  },

  fileChipLight: {
    background: "#f1f1f1",
    color: "#023047",
  },

  fileChipDark: {
    background: "#12384c",
    color: "#eaf8fc",
    border: "1px solid #16425b",
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
    flexWrap: "wrap",
  },
};