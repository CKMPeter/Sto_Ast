require("dotenv").config();
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Import Controllers
const { aiAnalyse, chatWithBot } = require("./controllers/AIController");
const { updateUser } = require("./controllers/UserController");
const {
  createFolder,
  updateFolder,
  deleteFolder,
  fetchFolderById,
  fetchFoldersByParentId,
} = require("./controllers/FolderController");
const {
  uploadFile,
  fetchFilesByFolderPath,
  deleteFile,
  updateFile,
  fetchFilesByFolderId,
} = require("./controllers/FileController");
const {
  describeImage,
} = require("./controllers/openAIController");
const { 
  getDarkMode, 
  setDarkMode 
} = require("./controllers/DarkModeController");

// Express setup
const app = express();
const PORT = 5000;

// Middlewares
require("./middlewares/middlewares")(app);

// Theme API
app.get("/api/user/theme", getDarkMode);
app.put("/api/user/theme", setDarkMode);

// --- User API ---
app.put("/api/user", updateUser);

// --- AI API ---
app.post("/api/ai", aiAnalyse); // AI analysis, including: summarization, keyword extraction, object identification
app.post("/api/chatbot", chatWithBot); // Chatbot interaction
app.post("/api/describe-image", describeImage); // Describe image

// --- Folder API ---
app.post("/api/folders", createFolder); // Create folder
app.put("/api/folders/:folderId", updateFolder); // Update folder
app.delete("/api/folders/:folderId", deleteFolder); // Delete folder
app.get("/api/folder/:folderId", fetchFolderById); // Fetch folder by ID
app.get("/api/folders", fetchFoldersByParentId); // Fetch folders by parentId

// --- File API ---
app.post("/api/file", uploadFile); // Upload file
app.put("/api/files/:fileId", updateFile); // Update file
app.delete("/api/files/:fileId", deleteFile); // Delete file
app.get("/api/files", fetchFilesByFolderPath); //Fetch files by folderPath
app.get("/api/files/:folderId", fetchFilesByFolderId); //Fetch files by folderPath


// --- HTTPS Server ---
if (process.env.HTTPS === "true") {
  const https = require("https");
  const fs = require("fs");

  // --- HTTPS Server ---
  const options = {
    key: fs.readFileSync(path.join(__dirname, "key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
  };

  https.createServer(options, app).listen(PORT, () => {
    console.log(`✅ HTTPS server running at https://localhost:${PORT}`);
  });
} else {
  // --- HTTP Server ---
  app.listen(PORT, () => {
    console.log(`✅ HTTP server running at http://localhost:${PORT}`);
  });
}
