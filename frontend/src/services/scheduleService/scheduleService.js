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

export function formatTime(minutes) {
  if (minutes === null) return "";

  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}`;
}

export async function createScheduleService({
  getIdToken,
  title,
  date,
  startMinutes,
  duration = 60,
  userId,
}) {
  const token = await getIdToken();

  const response = await fetch(`${BACKEND_URL}/api/schedules`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      date,
      startMinutes,
      duration,
      userId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to create schedule");
  }

  return data;
}

export async function getSchedulesByDateService({
  getIdToken,
  date,
  userId,
}) {
  const token = await getIdToken();

  const response = await fetch(
    `${BACKEND_URL}/api/schedules?date=${date}&userId=${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to load schedules");
  }

  return data.events || [];
}

export async function updateScheduleService({
  getIdToken,
  scheduleId,
  title,
}) {
  const token = await getIdToken();

  const response = await fetch(`${BACKEND_URL}/api/schedules/${scheduleId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Update failed");
  }

  return data;
}

export async function deleteScheduleService({ getIdToken, scheduleId }) {
  const token = await getIdToken();

  const response = await fetch(`${BACKEND_URL}/api/schedules/${scheduleId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Delete failed");
  }

  return data;
}

export async function getLinkedFilesByDateService({ getIdToken, date }) {
  const token = await getIdToken();

  const response = await fetch(`${BACKEND_URL}/api/files/by-date?date=${date}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch linked files");
  }

  return data.files || [];
}