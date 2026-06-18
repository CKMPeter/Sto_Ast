const { db, realtimeDatabase } = require("../firebase-admin-setup");
const { v4: uuidv4 } = require("uuid");

const scheduleCollection = db.collection("schedules");

exports.createSchedule = async ({ userId, date, startMinutes, duration, title }) => {
  const scheduleId = uuidv4();

  const schedule = {
    scheduleId,
    userId,
    date,
    startMinutes,
    duration,
    title,
    createdAt: Date.now(),
  };

  await scheduleCollection.doc(scheduleId).set(schedule);

  await realtimeDatabase
    .ref(`users/${userId}/scheduleQueue/${date}/${scheduleId}`)
    .set({
      title,
      start: startMinutes,
      duration,
    });

  return schedule;
};

exports.getSchedulesByDate = async ({ userId, date }) => {
  const snapshot = await scheduleCollection
    .where("date", "==", date)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

exports.updateSchedule = async (scheduleId, updateData) => {
  const docRef = scheduleCollection.doc(scheduleId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  const oldData = docSnap.data();

  await docRef.update(updateData);

  await realtimeDatabase
    .ref(`users/${oldData.userId}/scheduleQueue/${oldData.date}/${scheduleId}`)
    .update({
      title: updateData.title ?? oldData.title,
      start: updateData.startMinutes ?? oldData.startMinutes,
      duration: updateData.duration ?? oldData.duration,
    });

  return true;
};

exports.deleteSchedule = async (scheduleId) => {
  const docRef = scheduleCollection.doc(scheduleId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  const data = docSnap.data();

  await docRef.delete();

  await realtimeDatabase
    .ref(`users/${data.userId}/scheduleQueue/${data.date}/${scheduleId}`)
    .remove();

  return true;
};