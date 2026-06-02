import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import SchedulePopUp from "./SchedulePopUp";
import { useScheduleRealtime } from "../../hooks/scheduleHook/useScheduleRealtime";

import {
  MONTHS,
  getDaysInMonth,
  getStartOfMonth,
  getNextMonth,
  getPreviousMonth,
  hasEventOnDay,
  getEventCount,
} from "../../services/scheduleService/scheduleService";

export default function Schedule() {
  const todayDate = new Date();

  const [month, setMonth] = useState(todayDate.getMonth());
  const [year, setYear] = useState(todayDate.getFullYear());

  const [showPicker, setShowPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(month);
  const [tempYear, setTempYear] = useState(year);

  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const eventList = useScheduleRealtime();

  const today = todayDate.getDate();
  const selectedMonthName = MONTHS[month];
  const startOfMonth = getStartOfMonth(month, year);
  const daysInMonth = getDaysInMonth(month, year);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 768);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function nextMonth() {
    const result = getNextMonth(month, year);
    setMonth(result.month);
    setYear(result.year);
  }

  function prevMonth() {
    const result = getPreviousMonth(month, year);
    setMonth(result.month);
    setYear(result.year);
  }

  function dropDownMonthSelection() {
    setTempMonth(month);
    setTempYear(year);
    setShowPicker(true);
  }

  function openSchedule(day) {
    const date = new Date(year, month, day);
    setSelectedDate(date);
    setShowSchedule(true);
  }

  useEffect(() => {
    console.log("Days in month:", daysInMonth);
  }, [month, year, daysInMonth]);

  return (
    <div style={styleSheet.page}>
      <Navbar />

      <img
        src="./Sto_Ast_Logo_Title.png"
        alt=""
        style={{
          ...styleSheet.bgLogo,
          ...(isMobile ? styleSheet.bgLogoMobile : {}),
        }}
      />

      <div
        style={{
          ...styleSheet.titleContainer,
          ...(isMobile ? styleSheet.titleContainerMobile : {}),
        }}
      >
        <button style={styleSheet.monthNavigate} onClick={prevMonth}>
          &lt; Back
        </button>

        <h2
          style={{
            ...styleSheet.title,
            ...(isMobile ? styleSheet.titleMobile : {}),
          }}
          onClick={dropDownMonthSelection}
        >
          {selectedMonthName} {year}
        </h2>

        <button style={styleSheet.monthNavigate} onClick={nextMonth}>
          Next &gt;
        </button>
      </div>

      <div style={styleSheet.tableWrapper}>
        <table style={styleSheet.table}>
          <thead>
            <tr>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <td
                  key={day}
                  style={{
                    ...styleSheet.th,
                    ...(isMobile ? styleSheet.thMobile : {}),
                  }}
                >
                  {isMobile ? day : getFullDayName(day)}
                </td>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 6 }, (_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }, (_, j) => {
                  const day = i * 7 + j - startOfMonth + 1;
                  const isCurrentMonth = day > 0 && day <= daysInMonth;

                  const hasEvent =
                    isCurrentMonth &&
                    hasEventOnDay(eventList, day, month, year);

                  const eventCount = isCurrentMonth
                    ? getEventCount(eventList, day, month, year)
                    : 0;

                  const isToday =
                    day === today &&
                    month === todayDate.getMonth() &&
                    year === todayDate.getFullYear();

                  return (
                    <td
                      key={j}
                      style={{
                        ...styleSheet.dateContainer,
                        ...(isMobile ? styleSheet.dateContainerMobile : {}),
                        backgroundColor: isToday
                          ? "#0077b6"
                          : hasEvent
                            ? "#e3f2fd"
                            : "transparent",
                        color: isToday ? "#ffffff" : "#023047",
                        cursor: isCurrentMonth ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (isCurrentMonth) openSchedule(day);
                      }}
                    >
                      {isCurrentMonth ? day : ""}

                      {hasEvent && <div style={styleSheet.eventDot}></div>}

                      {eventCount > 1 && (
                        <div
                          style={{
                            ...styleSheet.eventCount,
                            ...(isMobile ? styleSheet.eventCountMobile : {}),
                          }}
                        >
                          {eventCount}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPicker && (
        <div style={styleSheet.overlay} onClick={() => setShowPicker(false)}>
          <div
            style={{
              ...styleSheet.modal,
              ...(isMobile ? styleSheet.modalMobile : {}),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Select Month & Year</h3>

            <div
              style={{
                ...styleSheet.selectRow,
                ...(isMobile ? styleSheet.selectRowMobile : {}),
              }}
            >
              <select
                value={tempMonth}
                onChange={(e) => setTempMonth(Number(e.target.value))}
                style={styleSheet.select}
              >
                {MONTHS.map((m, i) => (
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
                onChange={(e) => setTempYear(Number(e.target.value))}
                style={styleSheet.yearInput}
              />
            </div>

            <div style={styleSheet.buttonRow}>
              <button
                style={styleSheet.primaryButton}
                onClick={() => {
                  setMonth(tempMonth);
                  setYear(tempYear);
                  setShowPicker(false);
                }}
              >
                Apply
              </button>

              <button
                style={styleSheet.secondaryButton}
                onClick={() => setShowPicker(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSchedule && (
        <SchedulePopUp
          date={selectedDate}
          close={() => setShowSchedule(false)}
        />
      )}
    </div>
  );
}

function getFullDayName(shortName) {
  const names = {
    Sun: "Sunday",
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
  };

  return names[shortName];
}

const styleSheet = {
  page: {
    height: "100vh",
    background: "#f8fdff",
    position: "relative",
    overflow: "hidden",
  },

  bgLogo: {
    height: "50%",
    opacity: "30%",
    position: "absolute",
    top: "30%",
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  bgLogoMobile: {
    height: "22%",
    top: "45%",
    opacity: "18%",
  },

  titleContainer: {
    height: "80px",
    padding: "0 1rem",
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    zIndex: 1,
  },

  titleContainerMobile: {
    height: "70px",
    padding: "0 0.75rem",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  title: {
    fontSize: "1.8rem",
    fontWeight: "700",
    color: "#023047",
    cursor: "pointer",
    userSelect: "none",
    margin: 0,
  },

  titleMobile: {
    fontSize: "1.15rem",
  },

  monthNavigate: {
    fontSize: "1rem",
    fontWeight: "bold",
    color: "#0077b6",
    cursor: "pointer",
    userSelect: "none",
    border: "1px solid #caf0f8",
    background: "#ffffff",
    borderRadius: "10px",
    padding: "8px 12px",
  },

  tableWrapper: {
    width: "100%",
    height: "calc(100vh - 152px)",
    padding: "0 0.75rem 0.75rem",
    position: "relative",
    zIndex: 1,
    overflow: "hidden",
  },

  table: {
    width: "100%",
    height: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
    background: "rgba(255,255,255,0.85)",
  },

  th: {
    height: "32px",
    textAlign: "center",
    color: "#6c757d",
    fontWeight: "600",
    fontSize: "0.8rem",
    border: "none",
  },

  thMobile: {
    height: "24px",
    fontSize: "0.7rem",
    padding: 0,
  },

  dateContainer: {
    border: "1px solid #e6f7fc",
    padding: "0.25rem",
    textAlign: "center",
    position: "relative",
    fontWeight: "600",
    transition: "0.2s",
    verticalAlign: "top",
    height: "calc((100vh - 190px) / 6)",
  },

  dateContainerMobile: {
    height: "calc((100vh - 160px) / 6)",
    padding: "0.25rem",
    fontSize: "0.8rem",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5000,
    padding: "1rem",
  },

  modal: {
    background: "#ffffff",
    padding: "2rem",
    borderRadius: "14px",
    minWidth: "260px",
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(0,0,0,0.2)",
  },

  modalMobile: {
    width: "100%",
    maxWidth: "360px",
    padding: "1.25rem",
  },

  selectRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    margin: "1rem 0",
  },

  selectRowMobile: {
    flexDirection: "column",
  },

  select: {
    fontSize: "1rem",
    padding: "0.5rem",
    borderRadius: "10px",
    border: "1px solid #caf0f8",
  },

  yearInput: {
    width: "90px",
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "10px",
    border: "1px solid #caf0f8",
  },

  buttonRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginTop: "1rem",
  },

  primaryButton: {
    background: "#0077b6",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: "600",
    cursor: "pointer",
  },

  secondaryButton: {
    background: "#e6f7fc",
    color: "#0077b6",
    border: "1px solid #caf0f8",
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: "600",
    cursor: "pointer",
  },

  eventDot: {
    position: "absolute",
    bottom: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    backgroundColor: "#0077b6",
  },

  eventCount: {
    position: "absolute",
    bottom: "5px",
    right: "6px",
    fontSize: "0.6rem",
    backgroundColor: "#0077b6",
    color: "white",
    borderRadius: "999px",
    padding: "1px 5px",
  },

  eventCountMobile: {
    fontSize: "0.6rem",
    padding: "1px 5px",
  },

  bgLogo: {
    display: "none",
  },
};
