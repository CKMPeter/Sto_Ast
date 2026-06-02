import React, { useEffect, useState } from "react";

export default function Notification({ eventList = [] }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 480);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={styleSheet.container}>
      <p style={styleSheet.title}>Notification</p>

      {eventList.length === 0 ? (
        <p style={styleSheet.emptyText}>No event yet!</p>
      ) : (
        eventList.map((event) => (
          <div key={event.id} style={styleSheet.item}>
            <strong style={styleSheet.eventTitle}>{event.title}</strong>

            <div
              style={{
                ...styleSheet.eventInfo,
                ...(isMobile ? styleSheet.eventInfoMobile : {}),
              }}
            >
              <p style={styleSheet.eventText}>{formatTime(event.start)}</p>

              <p style={styleSheet.eventText}>
                {event.date
                  ? new Date(event.date).toLocaleDateString("en-CA")
                  : "No date specified"}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function formatTime(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? "AM" : "PM";

  return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`;
}

const styleSheet = {
  container: {
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
  },

  title: {
    fontWeight: "700",
    marginBottom: "0.75rem",
    color: "#0077b6",
  },

  emptyText: {
    margin: 0,
    color: "#6c757d",
    fontSize: "0.95rem",
  },

  item: {
    padding: "0.65rem",
    borderBottom: "1px solid #eee",
    wordBreak: "break-word",
  },

  eventTitle: {
    display: "block",
    fontSize: "0.95rem",
    marginBottom: "0.35rem",
  },

  eventInfo: {
    display: "flex",
    flexDirection: "row",
    gap: "1rem",
    flexWrap: "wrap",
  },

  eventInfoMobile: {
    flexDirection: "column",
    gap: "0.15rem",
  },

  eventText: {
    margin: 0,
    fontSize: "0.85rem",
    color: "#6c757d",
  },
};