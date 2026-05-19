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

// Import Controllers
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
} = require("./controllers/FileController");
const {
  describeImage,
  aiRename,
  aiPreview,
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

// Express setup
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
require("./middlewares/middlewares")(app);

// Theme API
app.get("/api/user/theme", getDarkMode);
app.put("/api/user/theme", setDarkMode);

// --- User API ---
app.put("/api/user", updateUser);

// --- AI API ---
app.post("/api/ai", aiAnalyse);
app.post("/api/aiRename", aiRename);
app.post("/api/aiPreview", aiPreview);
app.post("/api/chatbot", chatWithBot);
app.post("/api/describe-image", describeImage);

// --- Folder API ---
app.post("/api/folders", createFolder);
app.get("/api/folders/user", fetchAllUserFolders);
app.put("/api/folders/:folderId", updateFolder);
app.delete("/api/folders/:folderId", deleteFolder);
app.get("/api/folders/:folderId", fetchFolderById);
app.get("/api/folders", fetchFoldersByParentId);

// --- File API ---
app.post("/api/files", uploadFile);
app.get("/api/files/user", fetchAllFilesByUser);
app.put("/api/files/:fileId", updateFile);
app.delete("/api/files/:fileId", deleteFile);
app.get("/api/files/:fileId", fetchFileOrFolderById);
app.get("/api/files", fetchFilesByFolderPath);
app.get("/api/folders/:folderId/files", fetchFilesByFolderId);

// --- Scheduling API ---
app.post("/api/schedules", addSchedule);
app.get("/api/schedules", fetchSchedulesByDate);
app.put("/api/schedules/:scheduleId", updateSchedule);
app.delete("/api/schedules/:scheduleId", deleteSchedule);

// --- Friends API ---
app.get("/api/users/:userid/friends", getFriends);
app.get("/api/users/:userid/requests", getFriendRequests);
app.post("/api/users/friend-request", sendFriendRequest);
app.post("/api/users/friend-request/accept", acceptFriendRequest);
app.post("/api/users/friend-request/reject", rejectFriendRequest);
app.get("/api/users/search", searchUsers);

// --- Messages API ---
app.get("/api/messages/:userid/:friendid", getMessages);

// --- Server Setup ---
const useHttps = String(process.env.HTTPS).toLowerCase() === "true";

if (useHttps) {
  const keyPath = path.join(__dirname, "key.pem");
  const certPath = path.join(__dirname, "cert.pem");

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    https.createServer(options, app).listen(PORT, () => {
      console.log(`HTTPS server running at https://localhost:${PORT}`);
    });
  } else {
    console.warn(
      "HTTPS=true but cert.pem/key.pem not found. Falling back to HTTP."
    );

    app.listen(PORT, () => {
      console.log(`HTTP server running at http://localhost:${PORT}`);
    });
  }
} else {
  app.listen(PORT, () => {
    console.log(`HTTP server running at http://localhost:${PORT}`);
  });
}