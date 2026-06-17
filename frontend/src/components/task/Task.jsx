import React, { useEffect, useState } from "react";
import TaskComponent from "./TaskComponent";
import NavbarComponent from "../shared/Navbar";
import TaskListComponent from "./TaskListComponent";
import { useAuth } from "../../contexts/AuthContext";
import { TaskLog } from "./TaskLog";
import { v4 as uuidv4 } from "uuid";

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

import { useDarkMode } from "../../hooks/useDarkMode";

import { FaPlus, FaRobot, FaCheckCircle, FaChartLine } from "react-icons/fa";

import { MdPending } from "react-icons/md";

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
  // const [tasks, setTasks] = useState([])

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

  const { darkMode } = useDarkMode();
  const theme = darkStyles(darkMode);

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
        currentUser.uid,
        ...(editingTask.group?.members || []).map((member) => member.uid),
      ];

      const uniqueVisibility = [...new Set(visibility)];

      const toISODateOrNull = (value) => {
        if (!value) return null;

        const date = new Date(value);

        if (isNaN(date.getTime())) return null;

        return date.toISOString();
      };

      const nExpireAt = toISODateOrNull(mainTaskExpireAt);
      const oldExpireAt = toISODateOrNull(editingTask.expireAt);

      let newScheduleIds = editingTask.scheduleIds || {};

      if (nExpireAt !== oldExpireAt) {
        console.log(
          "Expire date changed, updating schedules for all members...",
        );

        // delete old schedules
        await Promise.all(
          Object.values(newScheduleIds)
            .filter(Boolean)
            .map((scheduleId) => deleteScheduleService(getIdToken, scheduleId)),
        );

        // create new schedules for owner + members
        const scheduleEntries = await Promise.all(
          uniqueVisibility.map(async (uid) => {
            const scheduleId = await updateSchedule(
              `Task: ${editingTask.name}`,
              mainTaskExpireAt || new Date().toISOString().split("T")[0],
              9 * 60,
              uid,
            );

            return [uid, scheduleId];
          }),
        );

        newScheduleIds = Object.fromEntries(scheduleEntries);
      }

      const data = await updateMainTask(editingTask.id, {
        name: editingTask.name,
        group: editingTask.group,
        expireAt: mainTaskExpireAt
          ? new Date(mainTaskExpireAt).toISOString()
          : null,
        description: mainTaskDescription,
        visibility,
        scheduleIds: newScheduleIds,
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

  // Set expire date in the edit modal when editingTask changes
  useEffect(() => {
    if (!editingTask) return;

    setMainTaskExpireAt(
      editingTask.expireAt
        ? new Date(editingTask.expireAt).toISOString().split("T")[0]
        : "",
    );
  }, [editingTask]);

  const handleDrop = async (status) => {
    if (!draggedTask || !selectedTaskId) return;

    try {
      await updateSubTask(selectedTaskId, draggedTask.id, {
        status,
      });

      await fetchSubTasks(selectedTaskId);

      setDraggedTask(null);
    } catch (error) {
      console.error("Drop update error:", error);
    }
  };
  // =========================
  // RENDER COLUMN
  // =========================

  const renderColumn = (status) => (
    <div
      style={{
        ...styleSheet.taskBox,
        ...theme.card,
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleDrop(status);
      }}
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
            <TaskComponent
              task={task}
              onDragStart={setDraggedTask}
              darkMode={darkMode}
            />

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
    <div style={darkStyles.page}>
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
                // marginLeft: "10px",
                // display: "flex",
                // alignItems: "center",
                // padding: "6px 12px",
              }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, styleSheet.buttonHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
                e.currentTarget.style.borderColor = COLORS.primary;
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
                // display: "flex",
                // alignItems: "center",
                //padding: "6px 12px",
                // backgroundColor: "#0077b6",
              }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, styleSheet.buttonHover);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
                e.currentTarget.style.borderColor = COLORS.primary;
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

          <div
            style={{
              ...styleSheet.taskListContainer,
              ...(isMobile ? styleSheet.taskListContainerMobile : {}),
            }}
          >
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
                <div
                  style={{
                    ...styleSheet.mainTaskItem,
                    color: darkMode ? "#f1f1f1" : "#000",
                  }}
                >
                  <TaskListComponent tasks={[task]} darkMode={darkMode} />

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
                      style={{ ...styleSheet.menuButton, ...theme.input }}
                    >
                      ⋮
                    </button>

                    {openedMenuId === task.id && (
                      <div
                        style={{
                          ...styleSheet.popupMenu,
                          ...theme.menu,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          style={{
                            ...styleSheet.popupMenuItem,
                            // color: darkMode ? "#fff" : "#000",
                            ...theme.input,
                          }}
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
                            ...theme.input,
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
                  // backgroundColor: "#0077b6",
                  // display: "flex",
                  // alignItems: "center",
                  // padding: "6px 12px",
                }}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, styleSheet.buttonHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.borderColor = COLORS.primary;
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
                  // backgroundColor: "#0077b6",
                }}
                onMouseEnter={(e) => {
                  Object.assign(e.currentTarget.style, styleSheet.buttonHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                  e.currentTarget.style.borderColor = COLORS.primary;
                }}
              >
                <FaChartLine
                  style={{
                    fontSize: "25px",
                  }}
                />
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
          <div
            style={{
              ...styleSheet.placeholderContainer,
              backgroundColor: darkMode ? "#121212" : "#fff",
            }}
          >
            <img
              src={
                darkMode
                  ? "./Sto_Ast_Logo_Title_Dark.png"
                  : "./Sto_Ast_Logo_Title.png"
              }
              alt=""
              style={{
                height: "50%",
                opacity: "30%",
              }}
            />
          </div>
        )}

        {/* RIGHT SIDE */}
        {mainTaskSelected && <TaskLog taskLog={taskLog} darkMode={darkMode} />}
      </div>

      {/* CREATE MAIN TASK MODAL */}
      {isCreatingMainTask && (
        <div style={styleSheet.modalOverlay}>
          <div
            style={{
              ...styleSheet.modalContainer,
              ...theme.modal,
            }}
          >
            <h2>Create Main Task</h2>
            <input
              type="text"
              placeholder="Main task name"
              value={mainTaskName}
              onChange={(e) => setMainTaskName(e.target.value)}
              style={{
                ...styleSheet.input,
                ...theme.input,
              }}
            />

            <input
              type="date"
              value={mainTaskExpireAt}
              onChange={(e) => setMainTaskExpireAt(e.target.value)}
              style={{
                ...styleSheet.input,
                ...theme.input,
              }}
            />

            <input
              type="text"
              placeholder="description (optional)"
              value={mainTaskDescription}
              onChange={(e) => setMainTaskDescription(e.target.value)}
              style={{
                ...styleSheet.input,
                height: "80px",
                resize: "none",
                ...theme.input,
              }}
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
          <div
            style={{
              ...styleSheet.modalContainer,
              ...darkStyles.modal,
            }}
          >
            <h2>Create Sub Task</h2>

            <input
              type="text"
              placeholder="Sub task name"
              value={subTaskName}
              onChange={(e) => setSubTaskName(e.target.value)}
              style={{
                ...styleSheet.input,
                ...theme.input,
              }}
            />

            <input
              type="text"
              placeholder="Description (optional)"
              value={editSubTaskDescription}
              onChange={(e) => setEditSubTaskDescription(e.target.value)}
              style={{
                ...styleSheet.input,
                height: "80px",
                resize: "none",
                ...theme.input,
              }}
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
          <div
            style={{
              ...styleSheet.modalContainer,
              ...theme.modal,
            }}
          >
            <h2>Create Task Using AI</h2>

            {!isGeneratingTask ? (
              <>
                <input
                  type="text"
                  placeholder="Describe the task you want to create"
                  style={{
                    ...styleSheet.input,
                    ...theme.input,
                  }}
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
                    ...theme.input,
                  }}
                >
                  Close
                </button>
              </>
            ) : (
              <div
                style={{
                  ...theme.card,
                  padding: "24px",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #0077b6, #00b4d8)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "18px",
                    }}
                  >
                    <FaRobot />
                  </div>

                  <div>
                    <h5
                      style={{
                        margin: 0,
                        fontWeight: 600,
                      }}
                    >
                      AI Task Planner
                    </h5>

                    <small
                      style={{
                        opacity: 0.7,
                      }}
                    >
                      Generating task structure...
                    </small>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {aiSteps.map((step) => (
                    <div
                      key={step.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: step.done
                          ? "rgba(40,167,69,0.12)"
                          : "rgba(255,193,7,0.08)",
                        border: step.done
                          ? "1px solid rgba(40,167,69,0.3)"
                          : "1px solid rgba(255,193,7,0.25)",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: step.done ? "#28a745" : "#ffc107",
                          color: "#fff",
                          fontSize: "14px",
                          flexShrink: 0,
                        }}
                      >
                        {step.done ? <FaCheckCircle /> : <MdPending />}
                      </div>

                      <div
                        style={{
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 500,
                          }}
                        >
                          {step.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingTask && (
        <div style={styleSheet.modalOverlay}>
          <div
            style={{
              ...styleSheet.modalContainer,
              ...theme.modal,
            }}
          >
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
              style={{
                ...styleSheet.input,
                ...theme.input,
              }}
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
              style={{
                ...styleSheet.select,
                marginBottom: "20px",
                ...theme.input,
              }}
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
              style={{
                ...styleSheet.input,
                ...theme.input,
              }}
            />

            <input
              type="text"
              placeholder="description (optional)"
              value={mainTaskDescription}
              onChange={(e) => setMainTaskDescription(e.target.value)}
              style={{
                ...styleSheet.input,
                height: "80px",
                resize: "none",
                marginTop: "10px",
                ...theme.input,
              }}
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
                onClick={() => setMainTaskExpireAt("")}
                style={{
                  ...styleSheet.button,
                  backgroundColor: "#6c757d",
                }}
              >
                Clear Expire Date
              </button>
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
            background: darkMode ? "#1e1e1e" : "#fff",
            border: darkMode ? "1px solid #444" : "1px solid #ccc",
            color: darkMode ? "#fff" : "#000",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            zIndex: 9999,
            minWidth: "150px",
            ...theme.modal,
          }}
        >
          {/* time log button */}
          <button
            style={{ ...styleSheet.subTaskContextMenuItem, ...theme.input }}
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
            style={{ ...styleSheet.subTaskContextMenuItem, ...theme.input }}
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
              ...theme.input,
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
          <div
            style={{
              ...styleSheet.modalContainer,
              ...theme.modal,
            }}
          >
            <h2>Edit Sub Task</h2>

            <input
              type="text"
              placeholder="Sub task name"
              value={editSubTaskName}
              onChange={(e) => setEditSubTaskName(e.target.value)}
              style={{
                ...styleSheet.input,
                ...theme.input,
              }}
            />

            <select
              value={editSubTaskStatus}
              onChange={(e) => setEditSubTaskStatus(e.target.value)}
              style={{
                ...styleSheet.select,
                ...theme.input,
              }}
            >
              <option value="To do">To do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>

            <select
              value={editSubTaskAssignedTo}
              onChange={(e) => setEditSubTaskAssignedTo(e.target.value)}
              style={{
                ...styleSheet.select,
                ...theme.input,
              }}
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
          <div
            style={{
              ...styleSheet.modalContainer,
              ...theme.modal,
            }}
          >
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
              style={{
                ...styleSheet.input,
                ...theme.input,
              }}
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
const COLORS = {
  lightBg: "#f8fdff",
  lightSurface: "#ffffff",
  lightAccent: "#e6f7fc",
  lightBorder: "#caf0f8",
  lightText: "#023047",
  lightMuted: "#6c757d",

  darkBg: "#121212",
  darkSurface: "#1a1a1a",
  darkCard: "#202020",
  darkHover: "#2a2a2a",
  darkBorder: "#2d2d2d",
  darkText: "#ffffff",
  darkMuted: "#b8dce8",

  primary: "#0077b6",
  primaryHover: "#0096c7",
  danger: "#d62828",
  success: "#28a745",
};

const styleSheet = {
  pageLayout: {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
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
    scrollbarWidth: "thin",
    scrollbarColor: `${COLORS.darkBorder} transparent`,
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
    padding: "10px 12px",
    marginRight: "10px",
    marginBottom: "10px",
    borderRadius: "10px",
    width: "100%",
    outline: "none",
    transition: "all 0.2s ease",
  },

  select: {
    padding: "10px 12px",
    borderRadius: "10px",
    width: "100%",
    marginTop: "10px",
    outline: "none",
    transition: "all 0.2s ease",
  },

  button: {
    padding: "10px 16px",
    backgroundColor: COLORS.primary,
    color: COLORS.darkText,
    border: `1px solid ${COLORS.primary}`,
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },

  buttonHover: {
    backgroundColor: COLORS.primaryHover,
    borderColor: COLORS.primaryHover,
  },

  secondaryButton: {
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },

  dangerButton: {
    padding: "10px 16px",
    backgroundColor: COLORS.danger,
    color: COLORS.darkText,
    border: `1px solid ${COLORS.danger}`,
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },

  taskBox: {
    minWidth: "260px",
    width: "33.33%",
    minHeight: "260px",
    borderRadius: "14px",
    padding: "14px",
    maxHeight: "50vh",
    overflowY: "auto",
    flexShrink: 0,
    scrollbarWidth: "thin",
    scrollbarColor: `${COLORS.darkBorder} transparent`,
  },

  leftContainer: {
    width: "20%",
    padding: "10px",
    scrollbarWidth: "thin",
    scrollbarColor: `${COLORS.darkBorder} transparent`,
  },

  leftContainerMobile: {
    width: "100%",
    scrollbarWidth: "thin",
    scrollbarColor: `${COLORS.darkBorder} transparent`,
  },

  rightContainer: {
    width: "80%",
    padding: "10px",
  },

  rightContainerMobile: {
    width: "100%",
  },

  placeholderContainer: {
    borderRadius: "14px",
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
    borderRadius: "12px",
    padding: "10px",
    transition: "all 0.2s ease",
  },

  subTaskItem: {
    marginBottom: "10px",
    borderRadius: "12px",
    padding: "10px",
    transition: "all 0.2s ease",
  },

  menuButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "20px",
    color: "inherit",
  },

  popupMenu: {
    position: "absolute",
    top: "30px",
    right: "0",
    borderRadius: "10px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
    zIndex: 10,
    minWidth: "140px",
    overflow: "hidden",
  },

  popupMenuItem: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    color: "inherit",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(3px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5000,
    padding: "1rem",
  },

  modalContainer: {
    padding: "20px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
  },

  subTaskContextMenuItem: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    background: "transparent",
    color: "inherit",
    textAlign: "left",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "all 0.2s ease",
  },
};

const darkStyles = (darkMode) => ({
  page: {
    backgroundColor: darkMode ? COLORS.darkBg : COLORS.lightBg,
    color: darkMode ? COLORS.darkText : COLORS.lightText,
    minHeight: "100vh",
  },

  card: {
    backgroundColor: darkMode ? COLORS.darkSurface : COLORS.lightSurface,
    color: darkMode ? COLORS.darkText : COLORS.lightText,
    border: darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.lightBorder}`,
    boxShadow: darkMode
      ? "0 8px 24px rgba(0,0,0,0.25)"
      : "0 8px 22px rgba(0,119,182,0.08)",
  },

  taskCard: {
    backgroundColor: darkMode ? COLORS.darkCard : COLORS.lightSurface,
    color: darkMode ? COLORS.darkText : COLORS.lightText,
    border: darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.lightBorder}`,
  },

  hoverCard: {
    backgroundColor: darkMode ? COLORS.darkHover : COLORS.lightAccent,
  },

  modal: {
    backgroundColor: darkMode ? COLORS.darkSurface : COLORS.lightSurface,
    color: darkMode ? COLORS.darkText : COLORS.lightText,
    border: darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.lightBorder}`,
  },

  input: {
    backgroundColor: darkMode ? COLORS.darkCard : COLORS.lightSurface,
    color: darkMode ? COLORS.darkText : COLORS.lightText,
    border: darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.lightBorder}`,
  },

  select: {
    backgroundColor: darkMode ? COLORS.darkCard : COLORS.lightSurface,
    color: darkMode ? COLORS.darkText : COLORS.lightText,
    border: darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.lightBorder}`,
  },

  menu: {
    backgroundColor: darkMode ? COLORS.darkSurface : COLORS.lightSurface,
    color: darkMode ? COLORS.darkText : COLORS.lightText,
    border: darkMode ? `1px solid ${COLORS.darkBorder}` : `1px solid #ccc`,
  },

  menuItemHover: {
    backgroundColor: darkMode ? COLORS.darkHover : COLORS.lightAccent,
  },

  secondaryButton: {
    backgroundColor: darkMode ? COLORS.darkCard : COLORS.lightAccent,
    color: darkMode ? COLORS.darkText : COLORS.primary,
    border: darkMode
      ? `1px solid ${COLORS.darkBorder}`
      : `1px solid ${COLORS.lightBorder}`,
  },

  secondaryButtonHover: {
    backgroundColor: darkMode ? COLORS.darkHover : "#d8f3ff",
    borderColor: COLORS.primary,
  },

  mutedText: {
    color: darkMode ? COLORS.darkMuted : COLORS.lightMuted,
  },
});
