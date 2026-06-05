const fs = require("fs");
const path = require("path");
const express = require("express");
const https = require("https");

// Load .env.local first if it exists, otherwise .env
const envLocalPath = path.join(__dirname, ".env.local");
const envPath = fs.existsSync(envLocalPath)
  ? envLocalPath
  : path.join(__dirname, ".env");

require("dotenv").config({ path: envPath });

// ─── Import Controllers ────────────────────────────────────────────────────────
const { aiAnalyse, chatWithBot } = require("./controllers/GeminiAIController");
const { updateUser } = require("./controllers/UserController");
const {
  createFolder,
  updateFolder,
  deleteFolder,
  fetchFolderById,
  fetchFoldersByParentId,
  fetchAllUserFolders,
} = require("./controllers/FolderController");
const {
  uploadFile,
  fetchFilesByFolderPath,
  deleteFile,
  updateFile,
  fetchFilesByFolderId,
  fetchAllFilesByUser,
  fetchFileOrFolderById,
  fetchFilesByExactDate,
} = require("./controllers/FileController");
const {
  describeImage,
  aiRename,
  aiPreview,
  createMainTaskAI,
} = require("./controllers/openAIController");
const {
  getDarkMode,
  setDarkMode,
} = require("./controllers/DarkModeController");
const {
  addSchedule,
  fetchSchedulesByDate,
  updateSchedule,
  deleteSchedule,
} = require("./controllers/ScheduleController");
const {
  getFriends,
  getMessages,
  searchUsers,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} = require("./controllers/FriendController");
const {
  createMainTask,
  getMainTasks,
  updateMainTask,
  deleteMainTask,
  createSubTask,
  getSubTasks,
  updateSubTask,
  deleteSubTask,
  getTaskLogs,
  addSubTaskTimeLog,
} = require("./controllers/TaskController");
const {
  createGroup,
  getUserGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  addTaskToGroup,
  getGroupMembers,
} = require("./controllers/GroupController");

const {
  getScheduleNotifications,
} = require("./controllers/NotificationController");


// ─── Call Controllers (1-on-1 và Group) ──────────────────────────────────────
const CallController = require("./controllers/CallController");
const CallGroupController = require("./controllers/CallGroupController");

// ─── Express Setup ────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
require("./middlewares/middlewares")(app);

// ─── Theme API ────────────────────────────────────────────────────────────────
app.get("/api/user/theme", getDarkMode);
app.put("/api/user/theme", setDarkMode);

// ─── User API ─────────────────────────────────────────────────────────────────
app.put("/api/user", updateUser);

// ─── AI API ───────────────────────────────────────────────────────────────────
app.post("/api/ai", aiAnalyse);
app.post("/api/aiRename", aiRename);
app.post("/api/aiPreview", aiPreview);
app.post("/api/chatbot", chatWithBot);
app.post("/api/describe-image", describeImage);
app.post("/api/create-task", createMainTaskAI);

// ─── Folder API ───────────────────────────────────────────────────────────────
app.post("/api/folders", createFolder);
app.get("/api/folders/user", fetchAllUserFolders);
app.put("/api/folders/:folderId", updateFolder);
app.delete("/api/folders/:folderId", deleteFolder);
app.get("/api/folders/:folderId", fetchFolderById);
app.get("/api/folders", fetchFoldersByParentId);

// ─── File API ─────────────────────────────────────────────────────────────────
app.post("/api/files", uploadFile);
app.get("/api/files/user", fetchAllFilesByUser);
app.get("/api/files/by-date", fetchFilesByExactDate);
app.put("/api/files/:fileId", updateFile);
app.delete("/api/files/:fileId", deleteFile);
app.get("/api/files/:fileId", fetchFileOrFolderById);
app.get("/api/files", fetchFilesByFolderPath);
app.get("/api/folders/:folderId/files", fetchFilesByFolderId);

// ─── Scheduling API ───────────────────────────────────────────────────────────
app.post("/api/schedules", addSchedule);
app.get("/api/schedules", fetchSchedulesByDate);
app.put("/api/schedules/:scheduleId", updateSchedule);
app.delete("/api/schedules/:scheduleId", deleteSchedule);

// ─── Schedule Notifications API ──────────────────────────────────────────────
app.get("/api/notifications/:userId", getScheduleNotifications);

// ─── Friends API ──────────────────────────────────────────────────────────────
app.get("/api/users/:userid/friends", getFriends);
app.get("/api/users/:userid/requests", getFriendRequests);
app.post("/api/users/friend-request", sendFriendRequest);
app.post("/api/users/friend-request/accept", acceptFriendRequest);
app.post("/api/users/friend-request/reject", rejectFriendRequest);
app.get("/api/users/search", searchUsers);

// ─── Messages API ─────────────────────────────────────────────────────────────
app.get("/api/messages/:userid/:friendid", getMessages);

// ─── Tasks API ────────────────────────────────────────────────────────────────
app.post("/api/tasks", createMainTask);
app.get("/api/tasks", getMainTasks);
app.put("/api/tasks/:taskId", updateMainTask);
app.delete("/api/tasks/:taskId", deleteMainTask);

app.get("/api/tasks/:taskId/logs", getTaskLogs);

app.post("/api/tasks/:taskId/subtasks", createSubTask);
app.get("/api/tasks/:taskId/subtasks", getSubTasks);
app.put("/api/tasks/:taskId/subtasks/:subTaskId", updateSubTask);
app.delete("/api/tasks/:taskId/subtasks/:subTaskId", deleteSubTask);
app.post("/api/tasks/:taskId/subtasks/:subTaskId/log-time", addSubTaskTimeLog);

// ─── Group API ────────────────────────────────────────────────────────────────
app.post("/api/groups", createGroup);
app.get("/api/groups/user/:userId", getUserGroups);
app.get("/api/groups/:groupId", getGroupById);
app.put("/api/groups/:groupId", updateGroup);
app.delete("/api/groups/:groupId", deleteGroup);
app.post("/api/groups/:groupId/add-member", addMember);
app.post("/api/groups/:groupId/add-task", addTaskToGroup);
app.post("/api/groups/:groupId/remove-member", removeMember);
app.get("/api/groups/:groupId/members", getGroupMembers);

// ─── 1-on-1 Call API ──────────────────────────────────────────────────────────
// Signaling REST endpoints (fallback / server-side cleanup)
// Logic WebRTC chính vẫn chạy qua Firebase client SDK (useCall.js)
app.post("/api/calls/offer",            CallController.sendOffer.bind(CallController));
app.post("/api/calls/answer",           CallController.sendAnswer.bind(CallController));
app.post("/api/calls/ice",              CallController.sendIceCandidate.bind(CallController));
app.post("/api/calls/signal",           CallController.sendSignal.bind(CallController));
app.get("/api/calls/:userId/offer",     CallController.getOffer.bind(CallController));
app.delete("/api/calls/:userId",        CallController.clearCallData.bind(CallController));

// ─── Group Call API ───────────────────────────────────────────────────────────
// Invite
app.post("/api/group-calls/invite",                 CallGroupController.sendGroupInvite.bind(CallGroupController));
app.get("/api/group-calls/invite/:groupId",         CallGroupController.getGroupInvite.bind(CallGroupController));
app.delete("/api/group-calls/invite/:groupId",      CallGroupController.removeGroupInvite.bind(CallGroupController));
// Per-pair signaling
app.post("/api/group-calls/offer",                  CallGroupController.sendOffer.bind(CallGroupController));
app.post("/api/group-calls/answer",                 CallGroupController.sendAnswer.bind(CallGroupController));
app.post("/api/group-calls/ice",                    CallGroupController.sendIceCandidate.bind(CallGroupController));
app.post("/api/group-calls/signal",                 CallGroupController.sendSignal.bind(CallGroupController));
// Leave / End
app.post("/api/group-calls/leave",                  CallGroupController.leaveGroupCall.bind(CallGroupController));
app.post("/api/group-calls/end",                    CallGroupController.endGroupCall.bind(CallGroupController));
app.delete("/api/group-calls/room",                 CallGroupController.removeRoomData.bind(CallGroupController));

// ─── HTTPS / HTTP Server ──────────────────────────────────────────────────────
if (process.env.HTTPS === "true") {
  const options = {
    key: fs.readFileSync(path.join(__dirname, "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
  };

  https.createServer(options, app).listen(PORT, () => {
    console.log(`HTTPS server running at https://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`HTTP server running at http://localhost:${PORT}`);
  });
}