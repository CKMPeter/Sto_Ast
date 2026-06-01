// hooks/taskHook/useSchedule.js

import { updateScheduleService } from "../../services/taskService";

export const useSchedule = (getIdToken) => {
  const updateSchedule = async (
    title,
    formattedDate,
    startMinutes,
    userId,
  ) => {
    try {
      const data = await updateScheduleService(
        getIdToken,
        title,
        formattedDate,
        startMinutes,
        userId,
      );

      if (data.success) {
        return data.schedule?.scheduleId;
      }
    } catch (error) {
      console.error(error);
    }
  };

  return { updateSchedule };
};