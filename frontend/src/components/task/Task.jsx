import React, { useEffect, useState } from "react";
import TaskComponent from "./TaskComponent";
import NavbarComponent from "../shared/Navbar";
import TaskListComponent from "./TaskListComponent";
import { useAuth } from "../../contexts/AuthContext";
import { TaskLog } from "./TaskLog";
import { v4 as uuidv4 } from "uuid";

// import {
//   fetchMainTasksService,
//   fetchSubTasksService,
//   createMainTaskService,
//   createSubTaskService,
//   updateMainTaskService,
//   updateSubTaskService,
//   deleteMainTaskService,
//   deleteSubTaskService,
//   fetchTaskLogsService,
//   createTaskUsingAIService,
//   fetchGroupTasksService,
//   addTaskToGroupService,
//   fetchGroupMembersService,
//   addSubTaskTimeLogService,
//   updateScheduleService,
// } from "./services/taskService"

import {
  fetchGroupTasksService,
  fetchGroupMembersService,
  updateScheduleService,
  createTaskUsingAIService,
  deleteScheduleService,
  fetchTaskLogsService,
} from "../../services/taskService/taskService";

import { useTasks } from "../../hooks/taskHook/useTask";
import { useAITask } from "../../hooks/taskHook/useAITask";
import { useSchedule } from "../../hooks/taskHook/useSchedule";
import TaskChartModal from "./TaskChartModal";

import { FaPlus, FaRobot } from "react-icons/fa";

export default function Task() {
  const { currentUser, getIdToken } = useAuth();

  const {
    mainTasks,
    tasks,
    selectedTaskId,

    setSelectedTaskId,

    createMainTask,
    createSubTask,
    updateMainTask,
    updateSubTask,
    deleteMainTask,
    deleteSubTask,

    fetchSubTasks,
  } = useTasks(getIdToken, currentUser);

  const { updateSchedule } = useSchedule(getIdToken);

  const { aiSteps, isGeneratingTask, createTaskUsingAI } = useAITask({
    getIdToken,
    currentUser,
    createMainTask,
    createSubTask,
    updateSchedule,
  });

  const [mainTaskName, setMainTaskName] = useState("");
  const [subTaskName, setSubTaskName] = useState("");
  const [subTaskDescription, setSubTaskDescription] = useState("");

  // state for dragging sub task
  const [draggedTask, setDraggedTask] = useState(null);

  // state for checking if main task is selected to show sub task and log
  const [mainTaskSelected, setMainTaskSelected] = useState(false);

  // state for editing main task
  const [editingTask, setEditingTask] = useState(null);

  // state for open the context menu for main task
  const [openedMenuId, setOpenedMenuId] = useState(null);

  // state for open the modal for creating main task and sub task
  const [isCreatingMainTask, setIsCreatingMainTask] = useState(false);
  const [isCreatingSubTask, setIsCreatingSubTask] = useState(false);

  // state use for activating create using AI modal
  const [isCreatingUsingAI, setIsCreatingUsingAI] = useState(false);

  //logging
  const [taskLog, setTaskLog] = useState([]);

  //use for creating main task
  const [mainTaskExpireAt, setMainTaskExpireAt] = useState("");
  const [mainTaskDescription, setMainTaskDescription] = useState("");

  //AI generated task
  const [aiGeneratedTask, setAiGeneratedTask] = useState("");
  const [aiDescription, setAiDescription] = useState("");

  // GROUPS
  const [groups, setGroups] = useState([]);

  //for sub task context menu
  const [subTaskContextMenu, setSubTaskContextMenu] = useState(null);

  // Sub task editing states
  const [editingSubTask, setEditingSubTask] = useState(null);

  const [editSubTaskName, setEditSubTaskName] = useState("");
  const [editSubTaskStatus, setEditSubTaskStatus] = useState("To do");
  const [editSubTaskAssignedTo, setEditSubTaskAssignedTo] = useState("");
  const [editSubTaskDescription, setEditSubTaskDescription] = useState("");

  // List of group members for assigning sub tasks
  const [groupMembers, setGroupMembers] = useState([]);

  // Time Log Modal
  const [isLoggingTime, setIsLoggingTime] = useState(false);
  const [selectedSubTask, setSelectedSubTask] = useState(null);
  const [timeToLog, setTimeToLog] = useState("");

  // Task Chart Modal
  const [isShowingChart, setIsShowingChart] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCreateMainTask = async () => {
    if (!mainTaskName.trim()) return;

    try {
      const scheduleId = await updateSchedule(
        `Task: ${mainTaskName}`,
        mainTaskExpireAt || new Date().toISOString().split("T")[0],
        9 * 60,
        currentUser.uid,
      );

      console.log("Schedule created with ID:", scheduleId);
      const data = await createMainTask({
        name: mainTaskName,
        userId: currentUser.uid,
        expireAt: mainTaskExpireAt
          ? new Date(mainTaskExpireAt).toISOString()
          : null,
        description: mainTaskDescription,
        scheduleId: scheduleId,
      });

      if (data.success) {
        setMainTaskName("");
        setMainTaskExpireAt("");
        setMainTaskDescription("");

        setIsCreatingMainTask(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateSubTask = async () => {
    if (!subTaskName.trim() || !selectedTaskId) return;

    try {
      const data = await createSubTask(selectedTaskId, {
        name: subTaskName,
        status: "To do",
        timeLogged: 0,
        assignedTo: null,
        description: subTaskDescription,
      });

      if (data.success) {
        setSubTaskName("");
        setSubTaskDescription("");

        setIsCreatingSubTask(false);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleUpdateMainTask = async () => {
    if (!editingTask) return;

    try {
      const visibility = [
        currentUser.uid, // owner
        ...(editingTask.group?.members || []).map((member) => member.uid),
      ];

      const nExpireAt = mainTaskExpireAt
        ? new Date(mainTaskExpireAt).toISOString()
        : null;

      const oldExpireAt = editingTask.expireAt
        ? new Date(editingTask.expireAt).toISOString()
        : null;

      let newScheduleId = editingTask.scheduleId;
      if (nExpireAt !== oldExpireAt) {
        console.log("Expire date changed, updating schedule...");
        deleteScheduleService(getIdToken, editingTask.scheduleId);
        newScheduleId = await updateSchedule(
          `Task: ${editingTask.name}`,
          mainTaskExpireAt || new Date().toISOString().split("T")[0],
          9 * 60,
          currentUser.uid,
        );
      }
      const data = await updateMainTask(editingTask.id, {
        name: editingTask.name,
        group: editingTask.group,
        expireAt: mainTaskExpireAt
          ? new Date(mainTaskExpireAt).toISOString()
          : null,
        description: mainTaskDescription,
        visibility: visibility,
        scheduleId: newScheduleId || editingTask.scheduleId,
      });

      if (data.success) {
        setEditingTask(null);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleUpdateSubTask = async () => {
    if (!editingSubTask) return;

    try {
      const data = await updateSubTask(selectedTaskId, editingSubTask.id, {
        name: editSubTaskName,
        status: editSubTaskStatus,
        assignedTo: editSubTaskAssignedTo,
        description: editSubTaskDescription,
      });

      if (data.success) {
        setEditingSubTask(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // TASK LOG
  // =========================

  const getTaskLog = async (taskId) => {
    try {
      console.log("Fetching task logs for taskId:", taskId);
      const data = await fetchTaskLogsService(getIdToken, taskId);

      if (data.success) {
        setTaskLog(data.data);
      }
      console.log("Fetched task logs:", data.data);
    } catch (error) {
      //console.log("Fail to fetch log", error);
    }
  };

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
  };

  const fetchMembers = async (groupId) => {
    try {
      const data = await fetchGroupMembersService(getIdToken, groupId);
      //console.log("Fetching members for group:", groupId);
      if (data.success) {
        setGroupMembers(data.data.members);
        //console.log("Group members:", data.data.members);
      } else {
        console.error("Failed to fetch group members");
      }
    } catch (error) {
      console.error("Fetch group members error:", error);
    }
  };

  // =========================
  // LOG TIME
  // =========================
  async function logTime() {
    if (!selectedTaskId || !selectedSubTask) {
      alert("Select a subtask first");
      return;
    }

    if (!timeToLog || Number(timeToLog) <= 0) {
      alert("Enter valid time");
      return;
    }

    try {
      await updateSubTask(selectedTaskId, selectedSubTask.id, {
        timeLogged: Number(selectedSubTask.timeLogged || 0) + Number(timeToLog),
      });

      await fetchSubTasks(selectedTaskId);

      setTimeToLog("");
      setSelectedSubTask(null);
    } catch (error) {
      console.error("Log time error:", error);
    }
  }

  // =========================
  // EFFECTS
  // =========================

  useEffect(() => {
    if (currentUser) {
      //fetchMainTasks();
      fetchGroupList();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedTaskId) {
      //fetchSubTasks(selectedTaskId);
      getTaskLog(selectedTaskId);
    }
  }, [selectedTaskId]);

  // CLOSE CONTEXT MENU ON OUTSIDE CLICK
  useEffect(() => {
    const closeMenu = () => setSubTaskContextMenu(null);

    window.addEventListener("click", closeMenu);

    return () => {
      window.removeEventListener("click", closeMenu);
    };
  }, []);

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
          <div
            key={task.id}
            style={styleSheet.subTaskItem}
            onContextMenu={(e) => {
              e.preventDefault();

              setSubTaskContextMenu({
                mouseX: e.clientX,
                mouseY: e.clientY,
                task,
              });
            }}
          >
            <TaskComponent task={task} onDragStart={setDraggedTask} />

            {/* <button
              onClick={() => deleteSubTask(task.id)}
              style={styleSheet.deleteButton}
            >
              Delete
            </button> */}
          </div>
        ))}
    </div>
  );

  return (
    <div>
      <NavbarComponent />

      <h1 style={{ paddingLeft: "20px" }}>Task</h1>

      <div
        style={{
          ...styleSheet.pageLayout,
          ...(isMobile ? styleSheet.pageLayoutMobile : {}),
        }}
      >
        {/* LEFT SIDE */}

        <div
          style={{
            ...styleSheet.leftContainer,
            ...(isMobile ? styleSheet.leftContainerMobile : {}),
          }}
        >
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

        <div style={{...styleSheet.taskListContainer, ...(isMobile ? styleSheet.taskListContainerMobile : {})}}>
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
                  fetchMembers(task.group?.id);
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
                              group: task.group,
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
                            deleteMainTask(task.id, task.scheduleId);

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
          <div
            style={{
              ...styleSheet.rightContainer,
              ...(isMobile ? styleSheet.rightContainerMobile : {}),
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
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

              <button
                variant="info"
                onClick={() => setIsShowingChart(true)}
                style={{
                  ...styleSheet.button,
                  backgroundColor: "#0077b6",
                }}
              >
                View Charts
              </button>
            </div>

            <div
              style={{
                ...styleSheet.taskContainer,
                ...(isMobile ? styleSheet.taskContainerMobile : {}),
              }}
            >
              {renderColumn("To do")}
              {renderColumn("In Progress")}
              {renderColumn("Done")}
            </div>

            {/*Description*/}
            <div style={{ marginTop: "20px" }}>
              <h3>Description</h3>
              <p>
                {mainTasks.find((task) => task.id === selectedTaskId)
                  ?.description || "No description"}
              </p>
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
              style={{ ...styleSheet.input, height: "80px", resize: "none" }}
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

              <button onClick={handleCreateMainTask} style={styleSheet.button}>
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

            <input
              type="text"
              placeholder="Description (optional)"
              value={editSubTaskDescription}
              onChange={(e) => setEditSubTaskDescription(e.target.value)}
              style={{ ...styleSheet.input, height: "80px", resize: "none" }}
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
                  setEditSubTaskDescription("");
                }}
                style={{
                  ...styleSheet.button,
                  backgroundColor: "#6c757d",
                }}
              >
                Cancel
              </button>

              <button onClick={handleCreateSubTask} style={styleSheet.button}>
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

            {!isGeneratingTask ? (
              <>
                <input
                  type="text"
                  placeholder="Describe the task you want to create"
                  style={styleSheet.input}
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                />

                <button
                  onClick={() =>
                    createTaskUsingAI(
                      aiDescription,
                      () => {
                        setIsCreatingUsingAI(false);
                        setAiDescription("");
                      },
                      (error) => {
                        console.error(error);
                      },
                    )
                  }
                  style={styleSheet.button}
                >
                  Create Using AI
                </button>

                <button
                  onClick={() => setIsCreatingUsingAI(false)}
                  style={{
                    ...styleSheet.button,
                    backgroundColor: "#6c757d",
                    marginLeft: "10px",
                  }}
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <p>🤖 AI is generating your task structure...</p>

                <div style={{ marginTop: "20px" }}>
                  {aiSteps.map((step) => (
                    <div
                      key={step.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "12px",
                        gap: "10px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "20px",
                          width: "24px",
                        }}
                      >
                        {step.done ? "✅" : "⏳"}
                      </span>

                      <span>{step.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
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
              value={editingTask.group?.id || "default"}
              onChange={(e) => {
                const selectedGroup = groups.find(
                  (group) => group.id === e.target.value,
                );

                setEditingTask({
                  ...editingTask,
                  group: selectedGroup,
                });
              }}
              style={{ ...styleSheet.select, marginBottom: "20px" }}
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>

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
              style={{ ...styleSheet.input, height: "80px", resize: "none" }}
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
                onClick={() => setEditingTask(null)}
                style={{
                  ...styleSheet.button,
                  backgroundColor: "#6c757d",
                }}
              >
                Close
              </button>

              <button onClick={handleUpdateMainTask} style={styleSheet.button}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/*SUB TASKS CONTEXT MENU*/}
      {subTaskContextMenu && (
        <div
          style={{
            position: "fixed",
            top: subTaskContextMenu.mouseY,
            left: subTaskContextMenu.mouseX,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            zIndex: 9999,
            minWidth: "150px",
          }}
        >
          {/* time log button */}
          <button
            style={styleSheet.subTaskContextMenuItem}
            onClick={() => {
              setSelectedSubTask(subTaskContextMenu.task);
              setIsLoggingTime(true);
              setSubTaskContextMenu(null);
            }}
          >
            Log Time
          </button>

          {/* edit button */}
          <button
            style={styleSheet.subTaskContextMenuItem}
            onClick={() => {
              setEditingSubTask(subTaskContextMenu.task);

              setEditSubTaskName(subTaskContextMenu.task.name || "");
              setEditSubTaskStatus(subTaskContextMenu.task.status || "To do");
              setEditSubTaskAssignedTo(
                subTaskContextMenu.task.assignedTo || "",
              );

              setSubTaskContextMenu(null);
            }}
          >
            Edit
          </button>

          {/* delete button */}
          <button
            style={{
              ...styleSheet.subTaskContextMenuItem,
              color: "red",
            }}
            onClick={() => {
              deleteSubTask(subTaskContextMenu.task.id);

              setSubTaskContextMenu(null);
            }}
          >
            Delete
          </button>
        </div>
      )}

      {/* EDIT SUB TASK MODAL */}
      {editingSubTask && (
        <div style={styleSheet.modalOverlay}>
          <div style={styleSheet.modalContainer}>
            <h2>Edit Sub Task</h2>

            <input
              type="text"
              placeholder="Sub task name"
              value={editSubTaskName}
              onChange={(e) => setEditSubTaskName(e.target.value)}
              style={styleSheet.input}
            />

            <select
              value={editSubTaskStatus}
              onChange={(e) => setEditSubTaskStatus(e.target.value)}
              style={styleSheet.select}
            >
              <option value="To do">To do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>

            <select
              value={editSubTaskAssignedTo}
              onChange={(e) => setEditSubTaskAssignedTo(e.target.value)}
              style={styleSheet.select}
            >
              <option value="">Select Member</option>
              {groupMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
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
                onClick={() => setEditingSubTask(null)}
                style={{
                  ...styleSheet.button,
                  backgroundColor: "#6c757d",
                }}
              >
                Cancel
              </button>

              <button onClick={handleUpdateSubTask} style={styleSheet.button}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TIME LOG MODAL */}
      {isLoggingTime && selectedSubTask && (
        <div style={styleSheet.modalOverlay}>
          <div style={styleSheet.modalContainer}>
            <h2>Log Time</h2>

            <p>
              <strong>Task:</strong> {selectedSubTask.name}
            </p>

            <p>Current Time Logged: {selectedSubTask.timeLogged || 0} hours</p>

            <input
              type="number"
              min="0"
              step="0.25"
              placeholder="Hours to add"
              value={timeToLog}
              onChange={(e) => setTimeToLog(e.target.value)}
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
                  setIsLoggingTime(false);
                  setSelectedSubTask(null);
                  setTimeToLog("");
                }}
                style={{
                  ...styleSheet.button,
                  backgroundColor: "#6c757d",
                }}
              >
                Cancel
              </button>

              <button onClick={logTime} style={styleSheet.button}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <TaskChartModal
        show={isShowingChart}
        onClose={() => setIsShowingChart(false)}
        subtasks={tasks}
      />
    </div>
  );
}

const styleSheet = {
  pageLayout: {
    display: "flex",
    width: "100%",
  },

  pageLayoutMobile: {
    flexDirection: "column",
  },

  taskListContainer: {
    width: "100%",
    marginBottom: "20px",
    maxHeight: "75vh",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  
  taskListContainerMobile: {
    flexDirection: "row",
    overflowX: "auto",
    overflowY: "hidden",
    paddingBottom: "10px",
  },

  taskContainer: {
    marginTop: "10px",
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    paddingRight: "20px",
  },

  taskContainerMobile: {
    flexDirection: "row",
    overflowX: "auto",
    overflowY: "hidden",
    paddingBottom: "10px",
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
    backgroundColor: "#0077b6",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },

  taskBox: {
    minWidth: "260px",
    width: "33.33%",
    minHeight: "260px",
    border: "1px solid #caf0f8",
    borderRadius: "10px",
    backgroundColor: "#fff",
    padding: "10px",
    maxHeight: "50vh",
    overflowY: "auto",
    flexShrink: 0,
  },

  leftContainer: {
    width: "20%",
    padding: "10px",
  },

  leftContainerMobile: {
    width: "100%",
  },

  rightContainer: {
    width: "80%",
    padding: "10px",
  },

  rightContainerMobile: {
    width: "100%",
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
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5000,
    padding: "1rem",
  },

  modalContainer: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "10px",
    width: "100%",
    maxWidth: "420px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
  },

  subTaskContextMenuItem: {
    width: "100%",
    padding: "10px",
    border: "none",
    background: "white",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: "5px",
  },
};
