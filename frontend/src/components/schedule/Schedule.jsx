import React, { useEffect, useState } from "react";
import Navbar from "../shared/Navbar";
import SchedulePopUp from "./SchedulePopUp";
import { useScheduleRealtime } from "../../hooks/scheduleHook/useScheduleRealtime";
import { useDarkMode } from "../../hooks/useDarkMode";

import {
  MONTHS,
  getDaysInMonth,
  getStartOfMonth,
  getNextMonth,
  getPreviousMonth,
  hasEventOnDay,
  getEventCount,
} from "../../services/scheduleService/scheduleService";

import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

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

  const { darkMode } = useDarkMode();
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
    <div
      style={{
        ...styleSheet.page,
        ...(darkMode ? styleSheet.pageDark : styleSheet.pageLight),
      }}
    >
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
        <button
          style={{
            ...styleSheet.monthNavigate,
            ...(darkMode
              ? styleSheet.monthNavigateDark
              : styleSheet.monthNavigateLight),
          }}
          onClick={prevMonth}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode
              ? COLORS.darkHover
              : "#d8f3ff";
            e.currentTarget.style.borderColor = COLORS.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode
              ? COLORS.darkCard
              : COLORS.lightSurface;
            e.currentTarget.style.borderColor = darkMode
              ? COLORS.darkBorder
              : COLORS.lightBorder;
          }}
        >
          <FaArrowLeft />
        </button>

        <h2
          style={{
            ...styleSheet.title,
            ...(darkMode ? styleSheet.titleDark : styleSheet.titleLight),
            ...(isMobile ? styleSheet.titleMobile : {}),
          }}
          onClick={dropDownMonthSelection}
        >
          {selectedMonthName} {year}
        </h2>

        <button
          style={{
            ...styleSheet.monthNavigate,
            ...(darkMode
              ? styleSheet.monthNavigateDark
              : styleSheet.monthNavigateLight),
          }}
          onClick={nextMonth}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode
              ? COLORS.darkHover
              : "#d8f3ff";
            e.currentTarget.style.borderColor = COLORS.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = darkMode
              ? COLORS.darkCard
              : COLORS.lightSurface;
            e.currentTarget.style.borderColor = darkMode
              ? COLORS.darkBorder
              : COLORS.lightBorder;
          }}
        >
          <FaArrowRight />
        </button>
      </div>

      <div style={styleSheet.tableWrapper}>
        <table
          style={{
            ...styleSheet.table,
            ...(darkMode ? styleSheet.tableDark : styleSheet.tableLight),
          }}
        >
          <thead>
            <tr>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <td
                  key={day}
                  style={{
                    ...styleSheet.th,
                    ...(isMobile ? styleSheet.thMobile : {}),
                    color: darkMode ? "#b8dce8" : "#6c757d",
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
                        ...(darkMode
                          ? styleSheet.dateContainerDark
                          : styleSheet.dateContainerLight),

                        ...(isToday
                          ? darkMode
                            ? styleSheet.dateContainerTodayDark
                            : styleSheet.dateContainerTodayLight
                          : {}),

                        ...(hasEvent && !isToday
                          ? {
                              background: darkMode
                                ? "rgba(0,119,182,0.12)"
                                : "#e3f2fd",
                            }
                          : {}),

                        opacity: isCurrentMonth ? 1 : 0.25,
                        cursor: isCurrentMonth ? "pointer" : "default",
                      }}
                      onClick={() => isCurrentMonth && openSchedule(day)}
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
              ...(darkMode ? styleSheet.modalDark : styleSheet.modalLight),
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
                style={{
                  ...styleSheet.select,
                  ...(darkMode ? styleSheet.inputDark : styleSheet.inputLight),
                }}
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
                style={{
                  ...styleSheet.yearInput,
                  ...(darkMode ? styleSheet.inputDark : styleSheet.inputLight),
                }}
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
                style={{
                  ...styleSheet.secondaryButton,
                  ...(darkMode
                    ? styleSheet.secondaryButtonDark
                    : styleSheet.secondaryButtonLight),
                }}
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

const COLORS = {
  lightBg: "#f8fdff",
  lightSurface: "#ffffff",
  lightAccent: "#e6f7fc",
  lightBorder: "#caf0f8",
  lightText: "#023047",
  lightMuted: "#6c757d",

  darkBg: "#121212",
  darkSurface: "#1a1a1a",
  darkCard: "#202020",
  darkHover: "#2a2a2a",
  darkBorder: "#2d2d2d",
  darkText: "#ffffff",
  darkMuted: "#b8dce8",

  primary: "#0077b6",
  primaryHover: "#0096c7",
  danger: "#d62828",
};

const styleSheet = {
  page: {
    height: "100vh",
    position: "relative",
    overflow: "hidden",
  },

  pageLight: {
    background: COLORS.lightBg,
  },

  pageDark: {
    background: COLORS.darkBg,
  },

  bgLogo: {
    display: "none",
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
    cursor: "pointer",
    userSelect: "none",
    margin: 0,
  },

  titleLight: {
    color: COLORS.lightText,
  },

  titleDark: {
    color: COLORS.darkText,
  },

  titleMobile: {
    fontSize: "1.15rem",
  },

  monthNavigate: {
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
    userSelect: "none",
    borderRadius: "10px",
    padding: "8px 12px",
    transition: "all 0.2s ease",
  },

  monthNavigateLight: {
    color: COLORS.primary,
    border: `1px solid ${COLORS.lightBorder}`,
    background: COLORS.lightSurface,
  },

  monthNavigateDark: {
    color: COLORS.darkText,
    border: `1px solid ${COLORS.darkBorder}`,
    background: COLORS.darkCard,
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
  },

  tableLight: {
    background: "rgba(255,255,255,0.85)",
  },

  tableDark: {
    background: COLORS.darkSurface,
  },

  th: {
    height: "32px",
    textAlign: "center",
    fontWeight: "600",
    fontSize: "0.8rem",
    border: "none",
  },

  thLight: {
    color: COLORS.lightMuted,
  },

  thDark: {
    color: COLORS.darkMuted,
  },

  thMobile: {
    height: "24px",
    fontSize: "0.7rem",
    padding: 0,
  },

  dateContainer: {
    padding: "0.25rem",
    textAlign: "center",
    position: "relative",
    fontWeight: "600",
    transition: "all 0.2s ease",
    verticalAlign: "top",
    height: "calc((100vh - 190px) / 6)",
  },

  dateContainerLight: {
    background: COLORS.lightSurface,
    color: COLORS.lightText,
    border: `1px solid ${COLORS.lightAccent}`,
  },

  dateContainerDark: {
    background: COLORS.darkSurface,
    color: COLORS.darkText,
    border: `1px solid ${COLORS.darkBorder}`,
  },

  dateContainerTodayLight: {
    background: "#e6f7fc",
    color: COLORS.primary,
    border: `2px solid ${COLORS.primary}`,
  },

  dateContainerTodayDark: {
    background: "rgba(0,119,182,0.18)",
    color: COLORS.darkText,
    border: `2px solid ${COLORS.primary}`,
  },

  dateContainerSelectedLight: {
    background: COLORS.primary,
    color: COLORS.darkText,
    border: `2px solid ${COLORS.primary}`,
  },

  dateContainerSelectedDark: {
    background: COLORS.primary,
    color: COLORS.darkText,
    border: `2px solid ${COLORS.primary}`,
  },

  dateContainerMobile: {
    height: "calc((100vh - 160px) / 6)",
    padding: "0.25rem",
    fontSize: "0.8rem",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(3px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5000,
    padding: "1rem",
  },

  modal: {
    padding: "2rem",
    borderRadius: "14px",
    minWidth: "260px",
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  },

  modalLight: {
    background: COLORS.lightSurface,
    color: COLORS.lightText,
    border: `1px solid ${COLORS.lightBorder}`,
  },

  modalDark: {
    background: COLORS.darkSurface,
    color: COLORS.darkText,
    border: `1px solid ${COLORS.darkBorder}`,
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
    outline: "none",
  },

  yearInput: {
    width: "90px",
    padding: "0.5rem",
    fontSize: "1rem",
    borderRadius: "10px",
    outline: "none",
  },

  inputLight: {
    background: COLORS.lightSurface,
    color: COLORS.lightText,
    border: `1px solid ${COLORS.lightBorder}`,
  },

  inputDark: {
    background: COLORS.darkCard,
    color: COLORS.darkText,
    border: `1px solid ${COLORS.darkBorder}`,
  },

  buttonRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginTop: "1rem",
  },

  primaryButton: {
    background: COLORS.primary,
    color: COLORS.darkText,
    border: `1px solid ${COLORS.primary}`,
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  primaryButtonHover: {
    background: COLORS.primaryHover,
    borderColor: COLORS.primaryHover,
  },

  secondaryButton: {
    borderRadius: "10px",
    padding: "10px 16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  secondaryButtonLight: {
    background: COLORS.lightAccent,
    color: COLORS.primary,
    border: `1px solid ${COLORS.lightBorder}`,
  },

  secondaryButtonDark: {
    background: COLORS.darkCard,
    color: COLORS.darkText,
    border: `1px solid ${COLORS.darkBorder}`,
  },

  secondaryButtonHoverLight: {
    background: "#d8f3ff",
    borderColor: COLORS.primary,
  },

  secondaryButtonHoverDark: {
    background: COLORS.darkHover,
    borderColor: COLORS.primary,
  },

  eventDot: {
    position: "absolute",
    bottom: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    backgroundColor: COLORS.primary,
  },

  eventCount: {
    position: "absolute",
    bottom: "5px",
    right: "6px",
    fontSize: "0.6rem",
    backgroundColor: COLORS.primary,
    color: COLORS.darkText,
    borderRadius: "999px",
    padding: "1px 5px",
  },

  eventCountMobile: {
    fontSize: "0.6rem",
    padding: "1px 5px",
  },
};
