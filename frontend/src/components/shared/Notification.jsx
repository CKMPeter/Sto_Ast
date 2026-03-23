import React from 'react'

export default function Notification({ eventList = [] }) {
  return (
    <div>
      <p>Notification</p>

      {eventList.length === 0 ? (
        <p>no event yet!</p>
      ) : (
        eventList.map((event) => (
          <div key={event.id} style={styleSheet.item}>
            <strong>{event.title}</strong>
            <p>{formatTime(event.start)}</p>
          </div>
        ))
      )}
    </div>
  )
}

// helper function
function formatTime(minutes) {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60

  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  const ampm = hour < 12 ? "AM" : "PM"

  return `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`
}

const styleSheet = {
  item: {
    padding: "0.5rem",
    borderBottom: "1px solid #eee"
  }
}