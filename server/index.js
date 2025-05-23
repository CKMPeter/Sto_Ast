require("dotenv").config();
const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const cors = require('cors');

<<<<<<< HEAD
const corsOptions = {
  origin: `${process.env.FRONTEND_URL}`,  // your React frontend origin
  credentials: true,                  // if you need to send cookies or auth headers
};


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
require("./middlewares")(app);

app.use(express.json());

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

app.use(cors({
  origin: `${process.env.FRONTEND_URL}`,  // your React frontend origin
  methods: ['GET', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
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
=======

// ---Firebase Admin SDK Initialization---
const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.PROJECT_ID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENT_ID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URI,
  "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
  "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
  "universe_domain": process.env.UNIVERSE_DOMAIN
};
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const auth = firebaseAdmin.auth();
const db = firebaseAdmin.firestore();


// ---Gemini client setup---
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// ---App Setup---
const app = express();
const PORT = 5000;


// Middleware
app.use(cors({
  origin: ['https://localhost:3000', process.env.FRONTEND_URL],
  credentials: true,
}));

app.use(express.json());

app.use(helmet({
  xFrameOptions: { action: "sameorigin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 
        process.env.FRONTEND_URL, "https://localhost:3000", 
        "https://apis.google.com", "https://www.gstatic.com"],
      styleSrc: ["'self'", process.env.FRONTEND_URL, "https://localhost:3000"],
      imgSrc: ["'self'", "data:", "https://firebasestorage.googleapis.com", "https://*.googleusercontent.com"],
      connectSrc: ["'self'", 
        process.env.BACKEND_URL, "https://localhost:5000", 
        process.env.FRONTEND_URL, "http://localhost:3000", 
        "https://generativelanguage.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      formAction: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
}));

app.disable('x-powered-by');

// Authentication middleware
// async function authenticateToken(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (!authHeader?.startsWith('Bearer ')) {
//     return res.status(401).json({ error: 'Missing or invalid Authorization header' });
//   }

//   const idToken = authHeader.split('Bearer ')[1];
//   try {
//     const decodedToken = await auth.verifyIdToken(idToken);
//     req.user = decodedToken;
//     next();
//   } catch (error) {
//     console.error('Token verification failed:', error.message);
//     res.status(401).json({ error: 'Unauthorized' });
//   }
// }

// --- AI Routes ---

// Gemini text or image processing
app.post('/ai', async (req, res) => {
  const { input, task, isImage = false, mimeType = "image/jpeg" } = req.body;
  if (!input || !task) return res.status(400).json({ error: 'Missing input or task' });

  try {
    const result = await runAI(input, task, isImage, mimeType);
    res.json({ result });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// Simple chatbot endpoint
app.post('/chatbot', async (req, res) => {
  const { input } = req.body;
  if (!input) return res.status(400).json({ error: 'Input required' });

  try {
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(input);
    const response = await result.response;
    res.json({ result: await response.text() });
  } catch (error) {
    console.error('Chatbot error:', error.message);
    res.status(500).json({ error: 'Chatbot failed' });
  }
});

// AI logic
async function runAI(input, task, isImage = false, mimeType = "image/jpeg") {
  const model = client.getGenerativeModel({ model: isImage ? "gemini-pro-vision" : "gemini-2.0-flash" });
  const prompt = isImage
    ? (task === "describe" ? "Describe the image." : "Identify objects in the image.")
    : (task === "summarize" ? `${input}\nSummarize.` : `${input}\nExtract keywords.`);

  if (isImage) {
    return (await model.generateContent({
      contents: [{ parts: [prompt, { inlineData: { mimeType, data: input } }] }]
    })).response.text();
  } else {
    return (await model.generateContent(prompt)).response.text();
  }
}

// --- Folder/Files API ---

app.get('/api/folder/:folderId', async (req, res) => {
  try {
    const doc = await db.collection('folders').doc(req.params.folderId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Folder not found' });
    res.json({ folder: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Fetch folder error:', error.message);
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

app.post('/api/folders', async (req, res) => {
  try {
    const { name, userId, parentId, path } = req.body;

    if (!name || !userId || !parentId || !path) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const folderRef = db.collection('folders').doc(); // New folder document
    const folderData = {
      name,
      userId,
      parentId,
      path,
      createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
    };

    await folderRef.set(folderData); // Save folder to Firestore

    res.status(201).json({ folder: { id: folderRef.id, ...folderData } });
  } catch (error) {
    console.error('Error creating folder:', error.message);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});


app.get('/api/files', async (req, res) => {
  const { folderPath, userId } = req.query;
  if (!folderPath || !userId) return res.status(400).json({ error: 'Missing folderPath or userId' });

  try {
    const query = db.collection('files')
      .where('folderPath', '==', folderPath)
      .where('userId', '==', userId);
    const snapshot = await query.get();
    const files = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ files });
  } catch (error) {
    console.error('Fetch files error:', error.message);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// DELETE a file
app.delete('/api/files/:userId/:fileId', async (req, res) => {
  const { userId, fileId } = req.params;

  try {
    await rtdb.ref(`files/${userId}/${fileId}`).remove();
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE a file
app.put('/api/files/:userId/:fileId', async (req, res) => {
  const { userId, fileId } = req.params;
  const { name, content } = req.body;

  if (!name || !content) {
    return res.status(400).json({ success: false, error: "Missing name or content" });
  }

  try {
    await rtdb.ref(`files/${userId}/${fileId}`).update({
      name: name.trim(),
      content,
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// --- HTTPS Server ---
if (process.env.HTTPS === 'true') {
const options = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem')),
};

https.createServer(options, app).listen(PORT, () => {
  console.log(`✅ HTTPS server running at https://localhost:${PORT}`);
}); 
>>>>>>> 8e253eed6e7569779758e99574e4ef4a3e653a97
} else {
  // --- HTTP Server ---
  app.listen(PORT, () => {
    console.log(`✅ HTTP server running at http://localhost:${PORT}`);
  });
}
