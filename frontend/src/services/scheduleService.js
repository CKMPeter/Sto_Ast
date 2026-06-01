// src/services/scheduleService.js

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function getDaysInMonth(month, year) {
  return new Date(year, month + 1, 0).getDate();
}

export function getStartOfMonth(month, year) {
  return new Date(year, month, 1).getDay();
}

export function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function hasEventOnDay(eventList, day, month, year) {
  if (!eventList || !day) return false;

  const cellDate = formatLocalDate(new Date(year, month, day));

  return eventList.some((event) => {
    if (!event.date) return false;

    let eventDate;

    if (typeof event.date === "string" && event.date.length === 10) {
      eventDate = event.date;
    } else {
      eventDate = formatLocalDate(new Date(event.date));
    }

    return eventDate === cellDate;
  });
}

export function getEventCount(eventList, day, month, year) {
  if (!eventList || !day) return 0;

  const cellDate = formatLocalDate(new Date(year, month, day));

  return eventList.filter((event) => {
    if (!event.date) return false;

    let eventDate;

    if (typeof event.date === "string" && event.date.length === 10) {
      eventDate = event.date;
    } else {
      eventDate = formatLocalDate(new Date(event.date));
    }

    return eventDate === cellDate;
  }).length;
}

export function getNextMonth(month, year) {
  if (month === 11) {
    return { month: 0, year: year + 1 };
  }

  return { month: month + 1, year };
}

export function getPreviousMonth(month, year) {
  if (month === 0) {
    return { month: 11, year: year - 1 };
  }

  return { month: month - 1, year };
}