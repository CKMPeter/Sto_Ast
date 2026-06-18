const scheduleDAO = require("../DAOs/ScheduleDAO");

// ==========================
// ADD SCHEDULE
// ==========================
exports.addSchedule = async (req, res) => {
  try {
    const { userId, date, startMinutes, duration, title } = req.body;

    if (!userId || !date || startMinutes === undefined || !duration || !title) {
      return res.status(400).json({
        error: "userId, date, startMinutes, duration, and title are required",
      });
    }

    const schedule = await scheduleDAO.createSchedule({
      userId,
      date,
      startMinutes,
      duration,
      title,
    });

    res.status(200).json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error("Add schedule error:", error);
    res.status(500).json({ error: "Failed to add schedule" });
  }
};

// ==========================
// FETCH BY DATE
// ==========================
exports.fetchSchedulesByDate = async (req, res) => {
  try {
    const { date, userId } = req.query;

    if (!date || !userId) {
      return res.status(400).json({
        error: "Date and userId are required",
      });
    }

    const events = await scheduleDAO.getSchedulesByDate({
      userId,
      date,
    });

    res.status(200).json({ events });
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

    const updated = await scheduleDAO.updateSchedule(scheduleId, updateData);

    if (!updated) {
      return res.status(404).json({
        error: "Schedule not found",
      });
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({
      error: "Failed to update schedule",
    });
  }
};

// ==========================
// DELETE SCHEDULE
// ==========================
exports.deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const deleted = await scheduleDAO.deleteSchedule(scheduleId);

    if (!deleted) {
      return res.status(404).json({
        error: "Schedule not found",
      });
    }

    res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({
      error: "Failed to delete schedule",
    });
  }
};