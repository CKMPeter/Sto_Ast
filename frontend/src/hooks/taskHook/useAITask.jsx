import { useState } from "react";
import { createTaskUsingAIService } from "../../services/taskService/taskService";

export const useAITask = ({
  getIdToken,
  currentUser,
  createMainTask,
  createSubTask,
  updateSchedule,
}) => {
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);

  const [aiSteps, setAiSteps] = useState([
    { id: 1, name: "Generate task plan", done: false },
    { id: 2, name: "Create schedule", done: false },
    { id: 3, name: "Create main task", done: false },
    { id: 4, name: "Create subtasks", done: false },
  ]);

  const resetSteps = () => {
    setAiSteps([
      { id: 1, name: "Generate task plan", done: false },
      { id: 2, name: "Create schedule", done: false },
      { id: 3, name: "Create main task", done: false },
      { id: 4, name: "Create subtasks", done: false },
    ]);
  };

  const markStepDone = (stepId) => {
    setAiSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, done: true } : step,
      ),
    );
  };

  const createTaskUsingAI = async (
    description,
    onSuccess,
    onError,
  ) => {
    try {
      setIsGeneratingTask(true);
      resetSteps();

      const data = await createTaskUsingAIService(getIdToken, {
        description,
        userId: currentUser.uid,
      });

      markStepDone(1);

      if (!data.result) {
        throw new Error("No AI response returned");
      }

      const cleanedJson = data.result
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();

      const task = JSON.parse(cleanedJson);

      const subTasks = task.subTasks || [];

      const { subTasks: _, ...mainTask } = task;

      const title = `Task: ${mainTask.name}`;

      const formattedDate =
        mainTask.expireAt ||
        new Date().toISOString().split("T")[0];

      const startMinutes = 9 * 60;

      const scheduleId = await updateSchedule(
        title,
        formattedDate,
        startMinutes,
        currentUser.uid,
      );

      markStepDone(2);

      const mainTaskData = await createMainTask({
        name: mainTask.name,
        userId: currentUser.uid,
        expireAt: mainTask.expireAt
          ? new Date(mainTask.expireAt).toISOString()
          : null,
        description: mainTask.description,
        scheduleId,
      });

      markStepDone(3);

      for (const subTask of subTasks) {
        await createSubTask(mainTaskData.data.id, {
          name: subTask.name,
          status: subTask.status || "To do",
          timeLogged: 0,
          assignedTo: null,
          description: subTask.description || "",
        });
      }

      markStepDone(4);

      setTimeout(() => {
        setIsGeneratingTask(false);

        if (onSuccess) {
          onSuccess(mainTaskData);
        }
      }, 1000);

      return {
        success: true,
        task: mainTaskData,
      };
    } catch (error) {
      console.error("Create task using AI error:", error);

      setIsGeneratingTask(false);

      if (onError) {
        onError(error);
      }

      return {
        success: false,
        error,
      };
    }
  };

  return {
    aiSteps,
    isGeneratingTask,
    createTaskUsingAI,
    resetSteps,
  };
};