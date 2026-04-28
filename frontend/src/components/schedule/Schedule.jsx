import React, { useEffect, useState } from 'react'
import Navbar from '../shared/Navbar';
import SchedulePopUp from './SchedulePopUp';
import { useScheduleRealtime } from '../../hooks/scheduleHook/useScheduleRealtime';

const styleSheet = {
  table: {
    width: "100%",
    borderCollapse: "collapse",
    padding: "1rem",
    tableLayout: "fixed",
  },
  titleContainer: {
    padding: "1rem 2rem 0rem",
    display: "flex",
    gap: "1rem",
    alignItems: "center",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#333",
    cursor: "pointer",
    userSelect: "none",
  },
  th: {
    border: "1px solid #ddd",
    padding: "0.5rem",
    textAlign: "center",
    borderBottom: "transparent",
    borderTop: "transparent",
    color: "#555",
    fontWeight: "bold",
  },
  dateContainer: {
    border: "1px solid #ddd",
    padding: "2rem",
    textAlign: "center",
    cursor: "pointer",
  },
  monthNavigate: {
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#00b4d8",
    cursor: "pointer",
    userSelect: "none",
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

  modal: {
    background: "white",
    padding: "2rem",
    borderRadius: "10px",
    minWidth: "260px",
    textAlign: "center",
  },

  selectRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    margin: "1rem 0",
  },

  select: {
    fontSize: "1rem",
    padding: "0.5rem",
  },

  yearInput: {
    width: "90px",
    padding: "0.5rem",
    fontSize: "1rem",
  },

  buttonRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginTop: "1rem"
  },

  eventDot: {
    position: "absolute",
    bottom: "6px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#db8d17",
  },

  eventCount: {
    position: "absolute",
    top: "4px",
    right: "6px",
    fontSize: "0.7rem",
    backgroundColor: "#1976d2",
    color: "white",
    borderRadius: "10px",
    padding: "2px 6px",
  },
}

export default function Schedule() {

  const todayDate = new Date()

  const [month, setMonth] = useState(todayDate.getMonth())
  const [year, setYear] = useState(todayDate.getFullYear())

  const [showPicker, setShowPicker] = useState(false)
  const [tempMonth, setTempMonth] = useState(month)
  const [tempYear, setTempYear] = useState(year)

  //POP UPS Stats
  const [showSchedule, setShowSchedule] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  //For icon notification
  const  eventList  = useScheduleRealtime()

  const today = todayDate.getDate()

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ]

  const selectedMonthName = months[month]

  const startOfMonth = new Date(year, month, 1).getDay()

  function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate()
  }

  const daysInMonth = getDaysInMonth(month, year)

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  function dropDownMonthSelection() {
    setTempMonth(month)
    setTempYear(year)
    setShowPicker(true)
  }

   /* OPEN POPUP WHEN DAY CLICKED */
  function openSchedule(day) {
    const date = new Date(year, month, day)
    setSelectedDate(date)
    setShowSchedule(true)
  }

  useEffect(() => {
    console.log("Days in month:", daysInMonth)
  }, [month, year])

  function hasEventOnDay(day) {
    if (!eventList || !day) return false;

    const cellDate = new Date(year, month, day)
      .toISOString()
      .split("T")[0];

    return eventList.some(e => {
      const eventDate = new Date(e.date)
        .toISOString()
        .split("T")[0];

      return eventDate === cellDate;
    });
  }

  function getEventCount(day) {
    if (!eventList || !day) return 0;

    const cellDate = new Date(year, month, day)
      .toISOString()
      .split("T")[0];

    return eventList.filter(e => {
      const eventDate = new Date(e.date)
        .toISOString()
        .split("T")[0];

      return eventDate === cellDate;
    }).length;
  }

  return (
    <div>
      <Navbar />
      <div style={styleSheet.titleContainer}>

        <label style={styleSheet.monthNavigate} onClick={prevMonth}>
          &lt; Back
        </label>

        <h2
          style={styleSheet.title}
          onClick={dropDownMonthSelection}
        >
          {selectedMonthName} {year}
        </h2>

        <label style={styleSheet.monthNavigate} onClick={nextMonth}>
          Next &gt;
        </label>
      </div>
      <div style={styleSheet.table}>
        <table style={styleSheet.table}>
          <thead>
            <tr>
              <td style={styleSheet.th}>Sunday</td>
              <td style={styleSheet.th}>Monday</td>
              <td style={styleSheet.th}>Tuesday</td>
              <td style={styleSheet.th}>Wednesday</td>
              <td style={styleSheet.th}>Thursday</td>
              <td style={styleSheet.th}>Friday</td>
              <td style={styleSheet.th}>Saturday</td>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }, (_, j) => {
                  const day = i * 7 + j - startOfMonth + 1

                  const isCurrentMonth =
                    day > 0 && day <= daysInMonth

                  const isToday =
                    day === today &&
                    month === todayDate.getMonth() &&
                    year === todayDate.getFullYear()

                  return (
                    <td
                      key={j}
                      style={{
                        ...styleSheet.dateContainer,
                        backgroundColor: isToday
                          ? "#00b4d8"
                          : hasEventOnDay(day)
                          ? "#e3f2fd" //  light highlight if has event
                          : "transparent",
                        color: isToday ? "white" : "black",
                        position: "relative"
                      }}
                      onClick={() => {
                        if (isCurrentMonth) openSchedule(day)
                      }}
                      onMouseEnter={(e) => {
                        if (!isToday)
                          e.target.style.backgroundColor = "#f0f0f0"
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor =
                          isToday
                            ? "#00b4d8"
                            : hasEventOnDay(day)
                            ? "#e3f2fd"
                            : "transparent"
                      }}
                    >
                      {isCurrentMonth ? day : ""}

                      {/* ✅ DOT indicator */}
                      {isCurrentMonth && hasEventOnDay(day) && (
                        <div style={styleSheet.eventDot}></div>
                      )}

                      {/* ✅ COUNT badge (optional) */}
                      {isCurrentMonth && getEventCount(day) > 1 && (
                        <div style={styleSheet.eventCount}>
                          {getEventCount(day)}
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPicker && (
        <div
          style={styleSheet.overlay}
          onClick={() => setShowPicker(false)}
        >
          <div
            style={styleSheet.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Select Month & Year</h3>
            <div style={styleSheet.selectRow}>
              <select
                value={tempMonth}
                onChange={(e) =>
                  setTempMonth(Number(e.target.value))
                }
                style={styleSheet.select}
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1970"
                max="2100"
                value={tempYear}
                onChange={(e) =>
                  setTempYear(Number(e.target.value))
                }
                style={styleSheet.yearInput}
              />
            </div>
            <div style={styleSheet.buttonRow}>
              <button
                onClick={() => {
                  setMonth(tempMonth)
                  setYear(tempYear)
                  setShowPicker(false)
                }}
              >
                Apply
              </button>

              <button
                onClick={() => setShowPicker(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

       {/* SCHEDULE POPUP */}
      {showSchedule && (
        <SchedulePopUp
          date={selectedDate}
          close={() => setShowSchedule(false)}
        />
      )}
    </div>
  )
}