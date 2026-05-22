const { realtimeDatabase, auth } = require('../firebase-admin-setup');

//
//  HELPER: GET UID FROM TOKEN
//
async function getUidFromRequest(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid;
  } catch (err) {
    console.error("Token error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

//
// ✅ GET FRIENDS
//
async function getFriends(req, res) {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ error: "Missing userid" });
    }

    const snapshot = await realtimeDatabase
      .ref(`users/${userid}/friends`)
      .once("value");

    const data = snapshot.val();

    if (!data) {
      return res.status(200).json([]);
    }

    const friendIds = Object.keys(data);

    //  fetch each friend's profile
    const promises = friendIds.map(async (uid) => {
      const userSnap = await realtimeDatabase
        .ref(`users/${uid}`)
        .once("value");

      const userData = userSnap.val() || {};

      return {
        uid,
        email: userData.email || "",
        name: userData.name || ""
      };
    });

    const friends = await Promise.all(promises);

    return res.status(200).json(friends);
  } catch (error) {
    console.error("Error fetching friends:", error);
    return res.status(500).json({ error: error.message });
  }
}

//
// ✅ GET FRIEND REQUESTS
//
async function getFriendRequests(req, res) {
  try {
    const { userid } = req.params;

    if (!userid) {
      return res.status(400).json({ error: "Missing userid" });
    }

    const snapshot = await realtimeDatabase
      .ref(`users/${userid}/friendRequests`)
      .once("value");

    const data = snapshot.val();

    if (!data) {
      return res.status(200).json([]);
    }

    const requesterIds = Object.keys(data);

    //  fetch user info for each requester
    const promises = requesterIds.map(async (uid) => {
      const userSnap = await realtimeDatabase
        .ref(`users/${uid}`)
        .once("value");

      const userData = userSnap.val() || {};

      return {
        uid,
        email: userData.email || "",
        name: userData.name || ""
      };
    });

    const requests = await Promise.all(promises);

    return res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return res.status(500).json({ error: error.message });
  }
}

//
// ✅ SEND FRIEND REQUEST
// Supports both:
// - { from, to }
// - { toUid }
// Also auto-gets "from" from token if missing.
//
async function sendFriendRequest(req, res) {
  try {
    let { from, to, toUid } = req.body || {};

    // support old frontend
    if (!to && toUid) {
      to = toUid;
    }

    // if frontend doesn't send "from", use token UID
    if (!from) {
      from = await getUidFromRequest(req, res);
      if (!from) return;
    }

    if (!from || !to) {
      return res.status(400).json({ error: "Missing from or to" });
    }

    if (from === to) {
      return res.status(400).json({ error: "Cannot add yourself" });
    }

    const dbRef = realtimeDatabase.ref();

    //  get both users
    const [fromSnap, toSnap] = await Promise.all([
      dbRef.child(`users/${from}`).once("value"),
      dbRef.child(`users/${to}`).once("value"),
    ]);

    if (!toSnap.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const fromData = fromSnap.val() || {};
    const toData = toSnap.val() || {};

    //  check if already friends
    const alreadyFriend = await dbRef
      .child(`users/${from}/friends/${to}`)
      .once("value");

    if (alreadyFriend.exists()) {
      return res.status(400).json({ error: "Already friends" });
    }

    //  check if request already sent
    const alreadyRequested = await dbRef
      .child(`users/${to}/friendRequests/${from}`)
      .once("value");

    if (alreadyRequested.exists()) {
      return res.status(400).json({ error: "Request already sent" });
    }

    const updates = {};

    updates[`users/${to}/friendRequests/${from}`] = {
      email: fromData.email || "",
      name: fromData.name || "",
      timestamp: Date.now(),
    };

    updates[`users/${from}/sentRequests/${to}`] = {
      email: toData.email || "",
      name: toData.name || "",
      timestamp: Date.now(),
    };

    await dbRef.update(updates);

    return res.status(200).json({ message: "Request sent" });
  } catch (error) {
    console.error("Error sending request:", error);
    return res.status(500).json({ error: error.message });
  }
}

//
// ✅ ACCEPT FRIEND REQUEST
// body: { requesterId }
//
async function acceptFriendRequest(req, res) {
  try {
    const uid = await getUidFromRequest(req, res);
    if (!uid) return;

    const { requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ error: "Missing requesterId" });
    }

    const rootRef = realtimeDatabase.ref();

    //  get BOTH user profiles
    const [currentSnap, requesterSnap] = await Promise.all([
      rootRef.child(`users/${uid}`).once("value"),
      rootRef.child(`users/${requesterId}`).once("value"),
    ]);

    const currentUser = currentSnap.val() || {};
    const requesterUser = requesterSnap.val() || {};

    const updates = {};

    updates[`users/${uid}/friends/${requesterId}`] = {
      uid: requesterId,
      email: requesterUser.email || "",
      name: requesterUser.name || ""
    };

    updates[`users/${requesterId}/friends/${uid}`] = {
      uid,
      email: currentUser.email || "",
      name: currentUser.name || ""
    };

    updates[`users/${uid}/friendRequests/${requesterId}`] = null;
    updates[`users/${uid}/sentRequests/${requesterId}`] = null;
    updates[`users/${requesterId}/sentRequests/${uid}`] = null;

    await rootRef.update(updates);

    return res.status(200).json({ message: "Friend added" });
  } catch (error) {
    console.error("Error accepting request:", error);
    return res.status(500).json({ error: error.message });
  }
}

//
// ✅ REJECT FRIEND REQUEST
// body: { requesterId }
//
async function rejectFriendRequest(req, res) {
  try {
    const uid = await getUidFromRequest(req, res);
    if (!uid) return;

    const { requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ error: "Missing requesterId" });
    }

    const updates = {};
    updates[`users/${uid}/friendRequests/${requesterId}`] = null;
    updates[`users/${uid}/sentRequests/${requesterId}`] = null;
    updates[`users/${requesterId}/sentRequests/${uid}`] = null;

    await realtimeDatabase.ref().update(updates);

    return res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    console.error("Error rejecting request:", error);
    return res.status(500).json({ error: error.message });
  }
}

//
// ✅ GET MESSAGES
//
async function getMessages(req, res) {
  try {
    const { userid, friendid } = req.params;

    if (!userid || !friendid) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const chatId = [userid, friendid].sort().join("_");

    const snapshot = await realtimeDatabase
      .ref(`messages/${chatId}`)
      .once("value");

    const data = snapshot.val();

    let messages = data
      ? Object.keys(data).map(id => ({ id, ...data[id] }))
      : [];

    messages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ error: error.message });
  }
}

//
// ✅ SEARCH USERS (email)
// GET /api/users/search?query=abc
//
async function searchUsers(req, res) {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Missing query" });
    }

    const snapshot = await realtimeDatabase
      .ref("users")
      .orderByChild("email")
      .startAt(query)
      .endAt(query + "\uf8ff")
      .limitToFirst(10)
      .once("value");

    const data = snapshot.val();

    const users = data
      ? Object.keys(data).map(uid => ({
          uid,
          email: data[uid].email || "",
          name: data[uid].name || ""
        }))
      : [];

    return res.json(users);
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getFriends,
  getMessages,
  searchUsers,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
};