const { realtimeDatabase } = require('../firebase-admin-setup');

// GET /api/:userid/friends
async function getFriends(req, res) {
  try {
    const { userid } = req.params;
    if (!userid) return res.status(400).json({ error: 'Missing userid' });

    const snapshot = await realtimeDatabase.ref(`friends/${userid}`).once('value');
    const data = snapshot.val();

    // If data is an object keyed by friendId, convert to array
    let list = [];
    if (!data) list = [];
    else if (Array.isArray(data)) list = data;
    else if (typeof data === 'object') {
      list = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
    } else list = [];

    return res.status(200).json(list);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return res.status(500).json({ error: error.message });
  }
}

// GET /api/:userid/:friendid/message
async function getMessages(req, res) {
  try {
    const { userid, friendid } = req.params;
    if (!userid || !friendid)
      return res.status(400).json({ error: 'Missing userid or friendid' });

    const path = `messages/${userid}/${friendid}`;
    const snapshot = await realtimeDatabase.ref(path).once('value');
    const data = snapshot.val();

    // data expected as object keyed by message id, where each value has text, timestamp, sender
    let messages = [];
    if (data) {
      messages = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
      // sort by timestamp desc
      messages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      // return latest 20 messages (or 10-20 as requested)
      messages = messages.slice(0, 20);
    }

    return res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getFriends,
  getMessages,
};
