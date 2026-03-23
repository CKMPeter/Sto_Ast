const { db, realtimeDatabase  } = require("../firebase-admin-setup");
const { v4: uuidv4 } = require("uuid");


// ==========================
// ADD SCHEDULE
// ==========================
exports.addSchedule = async (req, res) => {
  try {
    const { userId, date, startMinutes, duration, title } = req.body;

    const scheduleId = uuidv4();

    const schedule = {
      scheduleId,
      userId,
      date,
      startMinutes,
      duration,
      title,
      createdAt: Date.now()
    };

    // ✅ 1. Save to Firestore (main DB)
    await db.collection("schedules").doc(scheduleId).set(schedule);

    // ✅ 2. Mirror to Realtime DB
    const realtimeDatabaseRef = realtimeDatabase.ref(`users/${userId}/scheduleQueue/${date}/${scheduleId}`);

    await realtimeDatabaseRef.set({
      title,
      start: startMinutes,
      duration
    });

    res.status(200).json({
      success: true,
      schedule
    });

  } catch (error) {
    console.error("Add schedule error:", error);
    res.status(500).json({ error: "Failed to add schedule" });
  }
};


// ==========================
// FETCH BY DATE (Firestore only)
// ==========================
exports.fetchSchedulesByDate = async (req, res) => {
  try {

      console.log("FULL QUERY:", req.query);
      console.log("DATE VALUE:", req.query.date);

    const { date, userId } = req.query;

    if (!date || !userId) {
      return res.status(400).json({ error: "Date and userId are required" });
    }

    const snapshot = await db
      .collection("schedules")
      .where("date", "==", date)
      .where("userId", "==", userId)
      .get();

    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ events });

  } catch (error) {
    console.error("Schedule fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


// ==========================
// UPDATE SCHEDULE
// ==========================
exports.updateSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updateData = req.body;

    const docRef = db.collection("schedules").doc(scheduleId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const oldData = docSnap.data();

    // ✅ 1. Update Firestore
    await docRef.update(updateData);

    // ✅ 2. Sync to Realtime DB
    const realtimeDatabaseRef = realtimeDatabase.ref(
      `users/${oldData.userId}/scheduleQueue/${oldData.date}/${scheduleId}`
    );

    await realtimeDatabaseRef.update({
      title: updateData.title ?? oldData.title,
      start: updateData.startMinutes ?? oldData.startMinutes,
      duration: updateData.duration ?? oldData.duration
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({ error: "Failed to update schedule" });
  }
};


// ==========================
// DELETE SCHEDULE
// ==========================
exports.deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const docRef = db.collection("schedules").doc(scheduleId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: "Schedule not found" });
    }

    const data = docSnap.data();

    // ✅ 1. Delete from Firestore
    await docRef.delete();

    // ✅ 2. Delete from Realtime DB
    const realtimeDatabaseRef = realtimeDatabase.ref(
      `users/${data.userId}/scheduleQueue/${data.date}/${scheduleId}`
    );

    await realtimeDatabaseRef.remove();

    res.status(200).json({ success: true });

  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
};