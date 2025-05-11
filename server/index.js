const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const https = require('https');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const firebaseAdmin = require('firebase-admin'); // Import Firebase Admin SDK
const serviceAccount = require('./firebase-admin-sdk.json'); // Firebase service account key

const app = express();
const PORT = 5000;

// Initialize Firebase Admin SDK
firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});
const auth = firebaseAdmin.auth();
const db = firebaseAdmin.firestore();

// Middleware to verify Firebase ID token
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken; // Attach user info to request
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Initialize Gemini client before defining routes
const client = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

// Middleware to handle CORS
const allowedOrigins = ['https://localhost:3000'];  // Adjusted to use https for local development
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Middleware to parse JSON
app.use(express.json());

// Middleware to set Content-Security-Policy header
app.use(helmet({
  xFrameOptions: { action: "sameorigin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Allow resources from the same origin
      scriptSrc: [
        "'self'",                 // Allow only self-hosted scripts
        "https://localhost:3000", // Allow loading from local React dev server
        "https://apis.google.com", // Allow Google APIs (e.g., Google Fonts, etc.)
        "https://www.gstatic.com", // Allow resources from Google
      ],
      styleSrc: [
        "'self'",                 // Allow only self-hosted styles
        "https://localhost:3000", // Allow styles from React dev server
      ],
      imgSrc: ["'self'", "data:"], // Allow self-hosted images and data URIs
      connectSrc: [
        "'self'", 
        "https://localhost:5000",  // Allow connections to your API
        "https://generativelanguage.googleapis.com", // Allow connection to Gemini API
        "http://localhost:3000",  // Allow connections to local React dev server (if needed)
      ],
      fontSrc: ["'self'", "https://fonts.gstatic.com"], // Allow Google Fonts
      formAction: ["'self'"], // Allow forms to post to the same origin
      objectSrc: ["'none'"],   // Prevent Flash and other plugins
      baseUri: ["'self'"],     // Only allow base URL to be from 'self'
      frameAncestors: ["'self'"], // Prevent embedding your app in iframes
    },
  }
}));

app.disable('x-powered-by');

// User signup route using Firebase Admin SDK
app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await auth.createUser({ email, password });
    res.status(201).json({ user: userRecord });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// User login route (Firebase Admin does not support direct password login)
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await auth.getUserByEmail(email);
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI processing route
app.post('/ai', async (req, res) => {
  const { input, task, isImage = false, mimeType = "image/jpeg" } = req.body;
  if (!input || !task) {
    return res.status(400).json({ error: 'Missing input or task' });
  }

  try {
    const result = await run(input, task, isImage, mimeType);
    res.json({ result });
  } catch (err) {
    console.error("Error interacting with AI:", err);
    res.status(500).json({ error: 'AI processing failed' });
  }
});

// Get a folder by ID
app.get('/api/folder/:folderId', async (req, res) => {
  const { folderId } = req.params;
  try {
    const folderRef = db.collection('folders').doc(folderId);
    const docSnapshot = await folderRef.get();
    if (docSnapshot.exists) {
      res.json({ folder: { id: docSnapshot.id, ...docSnapshot.data() } });
    } else {
      res.status(404).json({ error: 'Folder not found' });
    }
  } catch (error) {
    console.error("Error fetching folder:", error);
    res.status(500).json({ error: 'Internal Server Error', detail: error.message });
  }
});

// Get child folders
app.get('/api/folders', async (req, res) => {
  let { parentId, userId } = req.query;

  try {
    // Log incoming request
    console.log(`Request for folders with parentId: ${parentId}, userId: ${userId}`);
    
    // Ensure userId is present
    if (!userId) {
      console.log('Missing userId');
      return res.status(400).json({ error: 'Missing userId' });
    }

    // Convert 'null' string to actual null for parentId
    parentId = parentId === 'null' ? null : parentId;

    // Log after conversion to ensure correctness
    console.log(`parentId after conversion: ${parentId}`);

    // Firestore query to get folders
    const q = db.collection('folders')
      .where('parentId', '==', parentId)
      .where('userId', '==', userId);

    console.log('Executing Firestore query...');
    const snapshot = await q.get();
    
    if (snapshot.empty) {
      console.log('No folders found');
      return res.status(404).json({ error: 'No folders found' });
    }

    const childFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log('Child folders fetched:', childFolders);
    res.json({ childFolders });
  } catch (error) {
    // Detailed logging for errors
    console.error('Error fetching folders:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// Get files (Firestore version)
app.get('/api/files', async (req, res) => {
  const { folderPath, userId } = req.query;

  try {
    const filesRef = db.collection('files').where('folderPath', '==', folderPath).where('userId', '==', userId);
    const snapshot = await filesRef.get();
    const files = snapshot.docs.map(doc => doc.data());
    res.json({ files });
  } catch (error) {
    console.error("Error fetching files:", error);
    res.status(500).json({ error: error.message });
  }
});

// AI function
async function run(input, task, isImage = false, mimeType = "image/jpeg") {
  const model = client.getGenerativeModel({
    model: isImage ? "gemini-pro-vision" : "gemini-2.0-flash",
  });

  const prompt =
    isImage && task === "describe"
      ? "Describe the image content."
      : isImage && task === "objects"
      ? "Identify key objects or elements in the image."
      : task === "summarize"
      ? `${input}\nSummarize the content of the file.`
      : `${input}\nExtract the main keywords from the file content.`;

  try {
    if (isImage) {
      const imagePart = {
        inlineData: {
          mimeType,
          data: input, // base64 without data:image/...;base64
        },
      };
      const result = await model.generateContent({
        contents: [{ parts: [prompt, imagePart] }],
      });
      const response = await result.response;
      return await response.text();
    } else {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return await response.text();
    }
  } catch (error) {
    console.error("Error generating AI content:", error);
    return "Error processing content with AI.";
  }
}

// SSL certificate configuration
const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
};

// Start the HTTPS server
https.createServer(options, app).listen(PORT, () => {
  console.log(`HTTPS server running on https://localhost:${PORT}`);
});
