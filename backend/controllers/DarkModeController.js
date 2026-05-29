const { db, auth } = require("../firebase-admin-setup");

// ✅ Helper: safely extract UID
async function getUidFromRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("No authorization token");
  }

  const token = authHeader.split(" ")[1];

  const decodedToken = await auth.verifyIdToken(token);
  return decodedToken.uid;
}

// ✅ GET /api/user/theme
async function getDarkMode(req, res) {
  try {
    console.log("👉 getDarkMode called");

    const uid = await getUidFromRequest(req);
    console.log("User UID:", uid);

    const doc = await db.collection("themes").doc(uid).get();

    const data = doc.exists ? doc.data() : {};

    res.json({
      darkMode: data.darkMode ?? false, // ✅ unified field name
    });

  } catch (error) {
    console.error("🔥 getDarkMode ERROR:", error.message);

    res.status(401).json({
      error: error.message || "Failed to fetch dark mode",
    });
  }
}

// ✅ PUT /api/user/theme
async function setDarkMode(req, res) {
  try {
    console.log("👉 setDarkMode called");

    const uid = await getUidFromRequest(req);
    const { darkMode } = req.body;

    if (typeof darkMode !== "boolean") {
      return res.status(400).json({
        error: "darkMode must be a boolean",
      });
    }

    await db.collection("themes").doc(uid).set(
      { darkMode }, // ✅ consistent naming
      { merge: true }
    );

    res.status(200).json({
      message: "Dark mode updated",
      darkMode,
    });

  } catch (error) {
    console.error("🔥 setDarkMode ERROR:", error.message);

    res.status(500).json({
      error: error.message || "Failed to update dark mode",
    });
  }
}

module.exports = {
  getDarkMode,
  setDarkMode,
};