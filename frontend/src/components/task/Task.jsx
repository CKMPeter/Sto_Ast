import React, { useEffect, useState } from "react";
import TaskComponent from "./TaskComponent";
import NavbarComponent from "../shared/Navbar";
import TaskListComponent from "./TaskListComponent";
import { useAuth } from "../../contexts/AuthContext";
import { TaskLog } from "./TaskLog";

import {
  fetchMainTasksService,
  fetchSubTasksService,
  createMainTaskService,
  createSubTaskService,
  updateMainTaskService,
  updateSubTaskService,
  deleteMainTaskService,
  deleteSubTaskService,
  fetchTaskLogsService,
  createTaskUsingAIService,
  fetchGroupTasksService
} from "./services/taskService";

import { FaPlus, FaRobot } from "react-icons/fa";

export default function Task() {
  const { currentUser, getIdToken } = useAuth();

  const [mainTaskName, setMainTaskName] = useState("");
  const [subTaskName, setSubTaskName] = useState("");

  const [mainTasks, setMainTasks] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  const [mainTaskSelected, setMainTaskSelected] = useState(false);

  const [editingTask, setEditingTask] = useState(null);

  const [openedMenuId, setOpenedMenuId] = useState(null);

  const [isCreatingMainTask, setIsCreatingMainTask] = useState(false);
  const [isCreatingSubTask, setIsCreatingSubTask] = useState(false);

  const [isCreatingUsingAI, setIsCreatingUsingAI] = useState(false);

  const [taskLog, setTaskLog] = useState([]);

  const [mainTaskExpireAt, setMainTaskExpireAt] = useState("");
  const [mainTaskDescription, setMainTaskDescription] = useState("");

  const [aiGeneratedTask, setAiGeneratedTask] = useState("");
  const [aiDescription, setAiDescription] = useState("");

  const [groups, setGroups] = useState([]);

  // =========================
  // FETCH MAIN TASKS
  // =========================

  const fetchMainTasks = async () => {
    try {
      const data = await fetchMainTasksService(getIdToken, currentUser.uid);

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
  // FETCH SUBTASKS
  // =========================

  const fetchSubTasks = async (taskId) => {
    try {
      const data = await fetchSubTasksService(getIdToken, taskId);

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

  const createMainTask = async () => {
    if (!mainTaskName.trim()) return;

    try {
      const data = await createMainTaskService(getIdToken, {
        name: mainTaskName,
        userId: currentUser.uid,
        expireAt: mainTaskExpireAt ? new Date(mainTaskExpireAt).toISOString() : null,
        description: mainTaskDescription,
      });

      if (data.success) {
        setMainTaskName("");
        setIsCreatingMainTask(false);

        fetchMainTasks();
      }
    } catch (error) {
      console.error("Create main task error:", error);
    }
  };

  // =========================
  // CREATE SUBTASK
  // =========================

  const createSubTask = async () => {
    if (!subTaskName.trim() || !selectedTaskId) return;

    try {
      const data = await createSubTaskService(getIdToken, selectedTaskId, {
        name: subTaskName,
        status: "To do",
        timeLogged: 0,
        assignedTo: null,
      });

      if (data.success) {
        setSubTaskName("");
        setIsCreatingSubTask(false);

        fetchSubTasks(selectedTaskId);
      }
    } catch (error) {
      console.error("Create subtask error:", error);
    }
  };

  // =========================
  // UPDATE MAIN TASK
  // =========================

  const updateMainTask = async () => {
    if (!editingTask) return;

    try {
      const data = await updateMainTaskService(getIdToken, editingTask.id, {
        name: editingTask.name,
        group: editingTask.group,
      });

      if (data.success) {
        setMainTasks((prev) =>
          prev.map((task) =>
            task.id === editingTask.id
              ? {
                  ...task,
                  name: editingTask.name,
                  group: editingTask.group,
                }
              : task,
          ),
        );

        setEditingTask(null);
      }
    } catch (error) {
      console.error("Update main task error:", error);
    }
  };

  // =========================
  // UPDATE SUBTASK STATUS
  // =========================

  const updateSubTaskStatus = async (taskId, subTaskId, status) => {
    try {
      await updateSubTaskService(getIdToken, taskId, subTaskId, {
        status,
      });
    } catch (error) {
      console.error("Update subtask error:", error);
    }
  };

  // =========================
  // HANDLE DROP
  // =========================

  const handleDrop = async (status) => {
    if (!draggedTask || !selectedTaskId) return;

    const updatedTasks = tasks.map((task) =>
      task.id === draggedTask.id ? { ...task, status } : task,
    );

    setTasks(updatedTasks);

    await updateSubTaskStatus(selectedTaskId, draggedTask.id, status);

    setDraggedTask(null);
  };

  // =========================
  // DELETE MAIN TASK
  // =========================

  const deleteMainTask = async (taskId) => {
    try {
      const data = await deleteMainTaskService(getIdToken, taskId);

      if (data.success) {
        const updatedTasks = mainTasks.filter((task) => task.id !== taskId);

        setMainTasks(updatedTasks);

        if (selectedTaskId === taskId) {
          setSelectedTaskId(null);
          setMainTaskSelected(false);
          setTasks([]);
        }
      }
    } catch (error) {
      console.error("Delete main task error:", error);
    }
  };

  // =========================
  // DELETE SUBTASK
  // =========================

  const deleteSubTask = async (subTaskId) => {
    try {
      const data = await deleteSubTaskService(
        getIdToken,
        selectedTaskId,
        subTaskId,
      );

      if (data.success) {
        setTasks((prev) => prev.filter((task) => task.id !== subTaskId));
      }
    } catch (error) {
      console.error("Delete subtask error:", error);
    }
  };

  // =========================
  // TASK LOG
  // =========================

  const getTaskLog = async (taskId) => {
    try {
      const data = await fetchTaskLogsService(getIdToken, taskId);

      if (data.success) {
        setTaskLog(data.data);
      }
    } catch (error) {
      console.log("Fail to fetch log", error);
    }
  };

  // =========================
  // CREATE USING AI
  // =========================
  const createUsingAI = async (description) => {
    try {
      const data = await createTaskUsingAIService(getIdToken, {
        description,
        userId: currentUser.uid
      })
      setAiGeneratedTask(data.result);
    }   catch (error) {
      console.error("Create using AI error:", error);
    }
  }

  const fetchGroupList = async () => {
    try {
      const data = await fetchGroupTasksService(getIdToken, currentUser.uid);
      setGroups([
        {
          id: "default",
          name: "Default",
          members: [],
        },
        ...(data.data.groups || []),
      ]);
    } catch (error) {
      console.error("Fetch group list error:", error);
    }
  }

  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {
    if (currentUser) {
      fetchMainTasks();
      fetchGroupList();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedTaskId) {
      fetchSubTasks(selectedTaskId);
    }
  }, [selectedTaskId]);

  useEffect(() => {
    if (selectedTaskId) {
      getTaskLog(selectedTaskId);
    }
  }, [selectedTaskId]);


  // =========================
  // RENDER COLUMN
  // =========================

  const renderColumn = (status) => (
    <div
      style={styleSheet.taskBox}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(status)}
    >
      <h4>{status}</h4>

      {tasks
        .filter((task) => task.status === status)
        .map((task) => (
          <div key={task.id} style={styleSheet.subTaskItem}>
            <TaskComponent task={task} onDragStart={setDraggedTask} />

            <button
              onClick={() => deleteSubTask(task.id)}
              style={styleSheet.deleteButton}
            >
              Delete
            </button>
          </div>
        ))}
    </div>
  );

  return (
    <div>
      <NavbarComponent />

      <h1 style={{ paddingLeft: "20px" }}>Task</h1>

      <div style={{ display: "flex" }}>
        {/* LEFT SIDE */}

        <div style={styleSheet.leftContainer}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              onClick={() => setIsCreatingMainTask(true)}
              style={{
                ...styleSheet.button,
                marginLeft: "10px",
                display: "flex",
                alignItems: "center",
                padding: "6px 12px",
                backgroundColor: "#0077b6",
              }}
            >
              <FaPlus
                style={{
                  fontSize: "25px",
                }}
              />
            </button>

            <button 
              onClick={() => setIsCreatingUsingAI(true)}
              style={{
                ...styleSheet.button,
                marginLeft: "10px",
                display: "flex",
                alignItems: "center",
                padding: "6px 12px",
                backgroundColor: "#0077b6",
              }}
            >
              <FaRobot
                style={{
                  fontSize: "25px",
                  marginRight: "5px",
                }}
              />
            </button>
          </div>

          <div style={styleSheet.taskListContainer}>
            {mainTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTaskId(task.id);

                  if (!mainTaskSelected) {
                    setMainTaskSelected(true);
                  } else if (mainTaskSelected && selectedTaskId === task.id) {
                    setMainTaskSelected(false);
                  }
                }}
                style={{
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                <div style={styleSheet.mainTaskItem}>
                  <TaskListComponent tasks={[task]} />

                  <div
                    style={{
                      position: "relative",
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();

                        setOpenedMenuId(
                          openedMenuId === task.id ? null : task.id,
                        );
                      }}
                      style={styleSheet.menuButton}
                    >
                      ⋮
                    </button>

                    {openedMenuId === task.id && (
                      <div
                        style={styleSheet.popupMenu}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          style={styleSheet.popupMenuItem}
                          onClick={() => {
                            setEditingTask({
                              ...task,
                              group: task.group || "group1",
                            });

                            setOpenedMenuId(null);
                          }}
                        >
                          Edit
                        </button>

                        <button
                          style={{
                            ...styleSheet.popupMenuItem,
                            color: "red",
                          }}
                          onClick={() => {
                            deleteMainTask(task.id);

                            setOpenedMenuId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE */}

        {mainTaskSelected ? (
          <div style={styleSheet.rightContainer}>
            <button
              onClick={() => setIsCreatingSubTask(true)}
              style={{
                ...styleSheet.button,
                backgroundColor: "#0077b6",
                display: "flex",
                alignItems: "center",
                padding: "6px 12px",
              }}
            >
              <FaPlus
                style={{
                  fontSize: "25px",
                }}
              />
            </button>

            <div style={styleSheet.taskContainer}>
              {renderColumn("To do")}
              {renderColumn("In Progress")}
              {renderColumn("Done")}
            </div>
          </div>
        ) : (
          <div style={styleSheet.placeholderContainer}>
            <img
              src="./Sto_Ast_Logo_Title.png"
              alt=""
              style={{
                height: "50%",
                opacity: "30%",
              }}
            />
          </div>
        )}

        {/* RIGHT SIDE */}
        {mainTaskSelected && <TaskLog taskLog={taskLog} />}
      </div>

      {/* CREATE MAIN TASK MODAL */}
      {isCreatingMainTask && (
        <div style={styleSheet.modalOverlay}>
          <div style={styleSheet.modalContainer}>
            <h2>Create Main Task</h2>
            <input
              type="text"
              placeholder="Main task name"
              value={mainTaskName}
              onChange={(e) => setMainTaskName(e.target.value)}
              style={styleSheet.input}
            />

            <input
              type="date"
              value={mainTaskExpireAt}
              onChange={(e) => setMainTaskExpireAt(e.target.value)}
              style={styleSheet.input}
            />

            <input
              type="text"
              placeholder="description (optional)"
              value={mainTaskDescription}
              onChange={(e) => setMainTaskDescription(e.target.value)}
              style={{...styleSheet.input, height: "80px", resize: "none"}}
            />

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  setIsCreatingMainTask(false);
                  setMainTaskName("");
                  setMainTaskExpireAt("");
                  setMainTaskDescription("");
                }}
                style={{
                  ...styleSheet.button,
                  backgroundColor: "#6c757d",
                }}
              >
                Cancel
              </button>

              <button onClick={createMainTask} style={styleSheet.button}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUB TASK MODAL */}
      {isCreatingSubTask && (
        <div style={styleSheet.modalOverlay}>
          <div style={styleSheet.modalContainer}>
            <h2>Create Sub Task</h2>

            <input
              type="text"
              placeholder="Sub task name"
              value={subTaskName}
              onChange={(e) => setSubTaskName(e.target.value)}
              style={styleSheet.input}
            />

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  setIsCreatingSubTask(false);
                  setSubTaskName("");
                }}
                style={{
                  ...styleSheet.button,
                  backgroundColor: "#6c757d",
                }}
              >
                Cancel
              </button>

              <button onClick={createSubTask} style={styleSheet.button}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CREATE USING AI MODAL */}
      {isCreatingUsingAI && (
        <div style={styleSheet.modalOverlay}>
          <div style={styleSheet.modalContainer}>
            <h2>Create Task Using AI</h2>
            <input
              type="text"
              placeholder="Describe the task you want to create"
              style={styleSheet.input}
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
            />

            <input
              type="text"
              placeholder="AI Generated Task will appear here"
              value={aiGeneratedTask}
              readOnly
              style={{...styleSheet.input, height: "80px", resize: "none", backgroundColor: "#e9ecef"}}
            />

            <button
              onClick={() => setIsCreatingUsingAI(false)}
              style={{
                ...styleSheet.button,
                backgroundColor: "#6c757d",
              }}
            >Close</button>

            <button onClick={() => createUsingAI(aiDescription)} style={styleSheet.button}>
              Create Using AI
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}

      {editingTask && (
        <div style={styleSheet.modalOverlay}>
          <div style={styleSheet.modalContainer}>
            <h2>Edit Task</h2>

            <input
              type="text"
              placeholder="Edit task name"
              value={editingTask.name}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  name: e.target.value,
                })
              }
              style={styleSheet.input}
            />

            <select
              value={editingTask.group || ""}
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  group: e.target.value,
                })
              }
              style={styleSheet.select}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setEditingTask(null)}
                style={{
                  ...styleSheet.button,
                  backgroundColor: "#6c757d",
                }}
              >
                Close
              </button>

              <button onClick={updateMainTask} style={styleSheet.button}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styleSheet = {
  taskListContainer: {
    width: "80%",
    marginBottom: "20px",
  },

  taskContainer: {
    marginTop: "10px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },

  input: {
    padding: "8px",
    marginRight: "10px",
    marginBottom: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "100%",
  },

  select: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    width: "100%",
    marginTop: "10px",
  },

  button: {
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  taskBox: {
    width: "100%",
    minHeight: "300px",
    border: "1px solid #ccc",
    borderRadius: "5px",
    backgroundColor: "#fff",
    padding: "10px",
  },

  leftContainer: {
    width: "20%",
    padding: "10px",
  },

  rightContainer: {
    width: "80%",
    padding: "10px",
  },

  placeholderContainer: {
    borderRadius: "5px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "80vh",
    width: "80%",
  },

  mainTaskItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
    gap: "10px",
  },

  subTaskItem: {
    marginBottom: "10px",
  },

  deleteButton: {
    padding: "6px 10px",
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },

  menuButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "20px",
  },

  popupMenu: {
    position: "absolute",
    top: "30px",
    right: "0",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "5px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
    zIndex: 10,
    minWidth: "120px",
  },

  popupMenuItem: {
    width: "100%",
    padding: "10px",
    border: "none",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },

  modalContainer: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    minWidth: "350px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  },
};
