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

// =========================
// Import Controllers
// =========================

// AI
const { aiAnalyse, chatWithBot } = require("./controllers/GeminiAIController");
const {
  describeImage,
  aiRename,
  aiPreview,
} = require("./controllers/openAIController");

// User
const { updateUser } = require("./controllers/UserController");

// Folder
const {
  createFolder,
  updateFolder,
  deleteFolder,
  fetchFolderById,
  fetchFoldersByParentId,
  fetchAllUserFolders,
} = require("./controllers/FolderController");

// File
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

// Dark Mode
const {
  getDarkMode,
  setDarkMode,
} = require("./controllers/DarkModeController");

// Schedule
const {
  addSchedule,
  fetchSchedulesByDate,
  updateSchedule,
  deleteSchedule,
} = require("./controllers/ScheduleController");

// Friend
const {
  getFriends,
  getMessages,
  searchUsers,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
} = require("./controllers/FriendController");

// Tasks
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
} = require("./controllers/TaskController");

// =========================
// Express Setup
// =========================

const app = express();
const PORT = process.env.PORT || 5000;

// =========================
// Middlewares
// =========================

require("./middlewares/middlewares")(app);

// =========================
// Theme API
// =========================

app.get("/api/user/theme", getDarkMode);
app.put("/api/user/theme", setDarkMode);

// =========================
// User API
// =========================

app.put("/api/user", updateUser);

// =========================
// AI API
// =========================

app.post("/api/ai", aiAnalyse);
app.post("/api/aiRename", aiRename);
app.post("/api/aiPreview", aiPreview);
app.post("/api/chatbot", chatWithBot);
app.post("/api/describe-image", describeImage);

// =========================
// Folder API
// =========================

app.post("/api/folders", createFolder);

app.get("/api/folders/user", fetchAllUserFolders);

app.put("/api/folders/:folderId", updateFolder);

app.delete("/api/folders/:folderId", deleteFolder);

app.get("/api/folders/:folderId", fetchFolderById);

app.get("/api/folders", fetchFoldersByParentId);

app.get("/api/folders/:folderId/files", fetchFilesByFolderId);

// =========================
// File API
// =========================

// Upload file
app.post("/api/files", uploadFile);

// Fetch all files by user
app.get("/api/files/user", fetchAllFilesByUser);

// Fetch files by exact date
app.get("/api/files/by-date", fetchFilesByExactDate);

// Update file
app.put("/api/files/:fileId", updateFile);

// Delete file
app.delete("/api/files/:fileId", deleteFile);

// Fetch file or folder by ID
app.get("/api/files/:fileId", fetchFileOrFolderById);

// Fetch files by folder path
app.get("/api/files", fetchFilesByFolderPath);

// =========================
// Scheduling API
// =========================

app.post("/api/schedules", addSchedule);

app.get("/api/schedules", fetchSchedulesByDate);

app.put("/api/schedules/:scheduleId", updateSchedule);

app.delete("/api/schedules/:scheduleId", deleteSchedule);

// =========================
// Friends API
// =========================

app.get("/api/users/:userid/friends", getFriends);

app.get("/api/users/:userid/requests", getFriendRequests);

app.post("/api/users/friend-request", sendFriendRequest);

app.post("/api/users/friend-request/accept", acceptFriendRequest);

app.post("/api/users/friend-request/reject", rejectFriendRequest);

app.get("/api/users/search", searchUsers);

// =========================
// Messages API
// =========================

app.get("/api/messages/:userid/:friendid", getMessages);

// =========================
// Tasks API
// =========================

// Main Tasks
app.post("/api/tasks", createMainTask);

app.get("/api/tasks", getMainTasks);

app.put("/api/tasks/:taskId", updateMainTask);

app.delete("/api/tasks/:taskId", deleteMainTask);

// Sub Tasks
app.post("/api/tasks/:taskId/subtasks", createSubTask);

app.get("/api/tasks/:taskId/subtasks", getSubTasks);

app.put(
  "/api/tasks/:taskId/subtasks/:subTaskId",
  updateSubTask
);

app.delete(
  "/api/tasks/:taskId/subtasks/:subTaskId",
  deleteSubTask
);

// Task Logs
app.get("/api/tasks/:taskId/logs", getTaskLogs);

// =========================
// Root Route
// =========================

app.get("/", (req, res) => {
  res.send("Server is running...");
});

// =========================
// HTTPS / HTTP Server Setup
// =========================

const useHttps =
  String(process.env.HTTPS).toLowerCase() === "true";

if (useHttps) {
  const keyPath = path.join(__dirname, "key.pem");
  const certPath = path.join(__dirname, "cert.pem");

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    https.createServer(options, app).listen(PORT, () => {
      console.log(
        `HTTPS server running at https://localhost:${PORT}`
      );
    });
  } else {
    console.warn(
      "HTTPS=true but key.pem/cert.pem not found. Falling back to HTTP."
    );

    app.listen(PORT, () => {
      console.log(
        `HTTP server running at http://localhost:${PORT}`
      );
    });
  }
} else {
  app.listen(PORT, () => {
    console.log(
      `HTTP server running at http://localhost:${PORT}`
    );
  });
}