const { db, verifyIdToken } = require("../firebase-admin-setup");

// Helper to extract UID from Bearer token
async function getUidFromRequest(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No authorization token" });
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await verifyIdToken(token);
    return decodedToken.uid;
  } catch (err) {
    console.error("Error verifying token:", err);
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

// GET /api/user/theme
async function getDarkMode(req, res) {
  const uid = await getUidFromRequest(req, res);
  if (!uid) return;

  try {
    const doc = await db.collection("themes").doc(uid).get();
    const data = doc.exists ? doc.data() : {};
    res.json({ darkMode: data.darkmode ?? false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// PUT /api/user/theme
async function setDarkMode(req, res) {
  const uid = await getUidFromRequest(req, res);
  if (!uid) return;

  const { darkMode } = req.body;
  if (typeof darkMode !== "boolean") {
    return res.status(400).json({ error: "darkMode must be a boolean" });
  }

  try {
    await db.collection("themes").doc(uid).set({ darkmode: darkMode }, { merge: true });
    res.status(200).json({ message: "Dark mode updated", darkMode });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getDarkMode,
  setDarkMode,
};
