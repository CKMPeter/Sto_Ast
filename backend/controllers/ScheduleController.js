const { db } = require("../firebase-admin-setup"); // your firebase admin setup
const { v4: uuidv4 } = require("uuid");

// Add Schedule
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

    await db.collection("schedules").doc(scheduleId).set(schedule);

    res.status(200).json({
      success: true,
      schedule
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add schedule" });
  }
};


// Fetch schedules by date
exports.fetchSchedulesByDate = async(req, res) => {
  try {

    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const snapshot = await db
      .collection("schedules")
      .where("date", "==", date)
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

}

// Update Schedule
exports.updateSchedule = async (req, res) => {

  try {

    const { scheduleId } = req.params;
    const updateData = req.body;

    await db.collection("schedules").doc(scheduleId).update(updateData);

    res.status(200).json({
      success: true
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update schedule" });
  }

};


// Delete Schedule
exports.deleteSchedule = async (req, res) => {

  try {

    const { scheduleId } = req.params;

    await db.collection("schedules").doc(scheduleId).delete();

    res.status(200).json({
      success: true
    });

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Failed to delete schedule" });

  }

};

