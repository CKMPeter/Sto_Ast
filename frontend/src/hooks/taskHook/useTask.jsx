import { useState, useEffect } from "react";

import {
  fetchMainTasksService,
  fetchSubTasksService,
  createMainTaskService,
  createSubTaskService,
  updateMainTaskService,
  updateSubTaskService,
  deleteMainTaskService,
  deleteSubTaskService,
  updateScheduleService,
  deleteScheduleService,
} from "../../components/task/services/taskService";

export function useTasks(getIdToken, currentUser) {
  const [mainTasks, setMainTasks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // =========================
  // FETCH MAIN TASKS
  // =========================

  const fetchMainTasks = async () => {
    try {
      const data = await fetchMainTasksService(
        getIdToken,
        currentUser.uid,
      );

      if (data.success) {
        setMainTasks(data.data);

        if (data.data.length > 0 && !selectedTaskId) {
          setSelectedTaskId(data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Fetch main tasks error:", error);
    }
  };

  // =========================
  // FETCH SUB TASKS
  // =========================

  const fetchSubTasks = async (taskId) => {
    try {
      const data = await fetchSubTasksService(
        getIdToken,
        taskId,
      );

      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error("Fetch subtasks error:", error);
    }
  };

  // =========================
  // CREATE MAIN TASK
  // =========================

  const createMainTask = async (payload) => {
    try {
      const data = await createMainTaskService(
        getIdToken,
        payload,
      );

      if (data.success) {
        await fetchMainTasks();
      }

      return data;
    } catch (error) {
      console.error("Create main task error:", error);
      throw error;
    }
  };

  // =========================
  // CREATE SUB TASK
  // =========================

  const createSubTask = async (taskId, payload) => {
    try {
      const data = await createSubTaskService(
        getIdToken,
        taskId,
        payload,
      );

      if (data.success) {
        await fetchSubTasks(taskId);
      }

      return data;
    } catch (error) {
      console.error("Create sub task error:", error);
      throw error;
    }
  };

  // =========================
  // UPDATE MAIN TASK
  // =========================

  const updateMainTask = async (
    taskId,
    payload,
  ) => {
    try {
      const data = await updateMainTaskService(
        getIdToken,
        taskId,
        payload,
      );

      if (data.success) {
        setMainTasks((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? { ...task, ...payload }
              : task,
          ),
        );
      }

      return data;
    } catch (error) {
      console.error("Update main task error:", error);
      throw error;
    }
  };

  // =========================
  // UPDATE SUB TASK
  // =========================

  const updateSubTask = async (
    taskId,
    subTaskId,
    payload,
  ) => {
    try {
      const data = await updateSubTaskService(
        getIdToken,
        taskId,
        subTaskId,
        payload,
      );

      if (data.success) {
        setTasks((prev) =>
          prev.map((task) =>
            task.id === subTaskId
              ? { ...task, ...payload }
              : task,
          ),
        );
      }

      return data;
    } catch (error) {
      console.error("Update sub task error:", error);
      throw error;
    }
  };

  // =========================
  // DELETE MAIN TASK
  // =========================

  const deleteMainTask = async (taskId, scheduleId) => {
    try {
      const data = await deleteMainTaskService(
        getIdToken,
        taskId,
      );

      if (data.success) {
        setMainTasks((prev) =>
          prev.filter((task) => task.id !== taskId),
        );

        if (selectedTaskId === taskId) {
          setSelectedTaskId(null);
          setTasks([]);
        }
      }

      if (data.success) {
            await deleteScheduleService(
            getIdToken,
            scheduleId,
        );
      }

      return data;
    } catch (error) {
      console.error("Delete main task error:", error);
      throw error;
    }
  };

  // =========================
  // DELETE SUB TASK
  // =========================

  const deleteSubTask = async (
    taskId,
    subTaskId,
  ) => {
    try {
      const data = await deleteSubTaskService(
        getIdToken,
        taskId,
        subTaskId,
      );

      if (data.success) {
        setTasks((prev) =>
          prev.filter(
            (task) => task.id !== subTaskId,
          ),
        );
      }

      return data;
    } catch (error) {
      console.error("Delete sub task error:", error);
      throw error;
    }
  };

  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {
    if (currentUser) {
      fetchMainTasks();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedTaskId) {
      fetchSubTasks(selectedTaskId);
    }
  }, [selectedTaskId]);

  return {
    // state
    mainTasks,
    tasks,
    selectedTaskId,

    // setters
    setMainTasks,
    setTasks,
    setSelectedTaskId,

    // functions
    fetchMainTasks,
    fetchSubTasks,
    createMainTask,
    createSubTask,
    updateMainTask,
    updateSubTask,
    deleteMainTask,
    deleteSubTask,
  };
}