const { realtimeDatabase } = require("../firebase-admin-setup");

exports.getScheduleQueue = async (userId) => {
  const queueRef = realtimeDatabase.ref(
    `users/${userId}/scheduleQueue`
  );

  const snapshot = await queueRef.once("value");
  const data = snapshot.val();

  if (!data) return [];

  const allEvents = [];

  Object.entries(data).forEach(([date, schedules]) => {
    Object.entries(schedules).forEach(([id, value]) => {
      allEvents.push({
        id,
        date,
        title: value.title,
        start: value.start,
        duration: value.duration,
      });
    });
  });

  return allEvents;
};