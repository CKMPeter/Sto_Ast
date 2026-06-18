const ScheduleNotificationDAO = require("../DAOs/NotificationDAO");

exports.getScheduleNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Missing userId",
      });
    }

    const events =
      await ScheduleNotificationDAO.getScheduleQueue(userId);

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Get schedule notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get schedule notifications",
    });
  }
};