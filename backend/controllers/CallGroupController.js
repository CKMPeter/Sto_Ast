/**
 * CallGroupController.js — HTTP Controller cho group call signaling
 *
 * Routes (đăng ký trong index.js):
 *   POST   /api/group-calls/invite              — caller gửi invite tới cả group
 *   DELETE /api/group-calls/invite/:groupId     — xóa invite (sau khi accept)
 *   GET    /api/group-calls/invite/:groupId     — lấy invite hiện tại
 *
 *   POST   /api/group-calls/offer               — caller gửi offer tới 1 callee
 *   POST   /api/group-calls/answer              — callee gửi answer về caller
 *   POST   /api/group-calls/ice                 — push ICE candidate (caller hoặc callee)
 *   POST   /api/group-calls/signal              — gửi signal tới 1 peer
 *   POST   /api/group-calls/leave               — rời khỏi call (signal "left" tới tất cả peers)
 *   POST   /api/group-calls/end                 — kết thúc call (signal "ended" tới tất cả peers)
 *   DELETE /api/group-calls/room                — xóa roomKey data giữa 2 uid
 */

const CallGroupDAO = require("../DAOs/CallGroupDAO");
const { auth } = require("../firebase-admin-setup");

// ─── HELPER: lấy uid từ Bearer token ─────────────────────────────────────────
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

class CallGroupController {

  // ─── INVITE ──────────────────────────────────────────────────────────────

  /**
   * POST /api/group-calls/invite
   * Body: { groupId, groupName, callerName, members }
   *   members: [{ uid, name }]
   *
   * Caller ghi invite lên Firebase để tất cả member trong group nhận.
   */
  async sendGroupInvite(req, res) {
    try {
      const callerId = await getUidFromRequest(req, res);
      if (!callerId) return;

      const { groupId, groupName, callerName, members } = req.body;

      if (!groupId || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: "Missing groupId or members" });
      }

      await CallGroupDAO.setGroupInvite(groupId, {
        callerId,
        callerName: callerName || callerId,
        groupId,
        groupName: groupName || "Group Call",
        timestamp: Date.now(),
        members,
      });

      return res.status(200).json({ message: "Group invite sent" });
    } catch (error) {
      console.error("SEND GROUP INVITE ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/group-calls/invite/:groupId
   *
   * Xóa invite sau khi callee accept hoặc call kết thúc.
   */
  async removeGroupInvite(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { groupId } = req.params;

      if (!groupId) {
        return res.status(400).json({ error: "Missing groupId" });
      }

      await CallGroupDAO.removeGroupInvite(groupId);

      return res.status(200).json({ message: "Group invite removed" });
    } catch (error) {
      console.error("REMOVE GROUP INVITE ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/group-calls/invite/:groupId
   *
   * Lấy invite hiện tại của group (REST check).
   */
  async getGroupInvite(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { groupId } = req.params;

      const invite = await CallGroupDAO.getGroupInvite(groupId);

      return res.status(200).json({ invite: invite || null });
    } catch (error) {
      console.error("GET GROUP INVITE ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ─── OFFER / ANSWER (per-pair) ────────────────────────────────────────────

  /**
   * POST /api/group-calls/offer
   * Body: { calleeId, offer }
   *
   * Caller ghi offer tới một callee cụ thể trong group.
   */
  async sendOffer(req, res) {
    try {
      const callerId = await getUidFromRequest(req, res);
      if (!callerId) return;

      const { calleeId, offer } = req.body;

      if (!calleeId || !offer) {
        return res.status(400).json({ error: "Missing calleeId or offer" });
      }

      await CallGroupDAO.setOffer(callerId, calleeId, {
        callerId,
        offer,
      });

      return res.status(200).json({ message: "Offer sent" });
    } catch (error) {
      console.error("GROUP SEND OFFER ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/group-calls/answer
   * Body: { callerId, answer }
   *
   * Callee ghi answer về caller trong group.
   */
  async sendAnswer(req, res) {
    try {
      const calleeId = await getUidFromRequest(req, res);
      if (!calleeId) return;

      const { callerId, answer } = req.body;

      if (!callerId || !answer) {
        return res.status(400).json({ error: "Missing callerId or answer" });
      }

      await CallGroupDAO.setAnswer(callerId, calleeId, { answer });

      return res.status(200).json({ message: "Answer sent" });
    } catch (error) {
      console.error("GROUP SEND ANSWER ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ─── ICE CANDIDATES ───────────────────────────────────────────────────────

  /**
   * POST /api/group-calls/ice
   * Body: { peerId, candidate, role }
   *   role: "caller" → pushCallerIce; "callee" → pushCalleeIce
   *
   * Push ICE candidate tới peer (không ghi đè — Firebase push() tạo unique key).
   */
  async sendIceCandidate(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { peerId, candidate, role } = req.body;

      if (!peerId || !candidate || !role) {
        return res.status(400).json({ error: "Missing peerId, candidate, or role" });
      }

      if (role === "caller") {
        await CallGroupDAO.pushCallerIce(uid, peerId, candidate);
      } else if (role === "callee") {
        await CallGroupDAO.pushCalleeIce(uid, peerId, candidate);
      } else {
        return res.status(400).json({ error: "role must be 'caller' or 'callee'" });
      }

      return res.status(200).json({ message: "ICE candidate pushed" });
    } catch (error) {
      console.error("GROUP SEND ICE ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ─── SIGNAL ───────────────────────────────────────────────────────────────

  /**
   * POST /api/group-calls/signal
   * Body: { peerId, signal }
   *   signal: "rejected" | "left" | "ended"
   *
   * Gửi signal tới 1 peer cụ thể.
   */
  async sendSignal(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { peerId, signal } = req.body;

      if (!peerId || !signal) {
        return res.status(400).json({ error: "Missing peerId or signal" });
      }

      const validSignals = ["rejected", "left", "ended"];
      if (!validSignals.includes(signal)) {
        return res.status(400).json({ error: `signal must be one of: ${validSignals.join(", ")}` });
      }

      await CallGroupDAO.setSignal(uid, peerId, signal);

      return res.status(200).json({ message: "Signal sent" });
    } catch (error) {
      console.error("GROUP SEND SIGNAL ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ─── LEAVE / END ──────────────────────────────────────────────────────────

  /**
   * POST /api/group-calls/leave
   * Body: { peerUids: string[], groupId? }
   *
   * Người dùng rời khỏi group call.
   * Gửi signal "left" tới tất cả peers rồi xóa roomKey data.
   * Những peers khác vẫn tiếp tục call với nhau.
   */
  async leaveGroupCall(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { peerUids, groupId } = req.body;

      if (!Array.isArray(peerUids) || peerUids.length === 0) {
        return res.status(400).json({ error: "Missing or empty peerUids array" });
      }

      await CallGroupDAO.signalAndCleanupAll(uid, peerUids, "left");

      return res.status(200).json({ message: "Left group call" });
    } catch (error) {
      console.error("LEAVE GROUP CALL ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/group-calls/end
   * Body: { peerUids: string[], groupId }
   *
   * Host kết thúc group call cho tất cả.
   * Gửi signal "ended" tới tất cả peers rồi xóa invite + roomKey data.
   */
  async endGroupCall(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { peerUids, groupId } = req.body;

      if (!Array.isArray(peerUids) || peerUids.length === 0) {
        return res.status(400).json({ error: "Missing or empty peerUids array" });
      }

      await CallGroupDAO.signalAndCleanupAll(uid, peerUids, "ended");

      if (groupId) {
        await CallGroupDAO.removeGroupInvite(groupId);
      }

      return res.status(200).json({ message: "Group call ended" });
    } catch (error) {
      console.error("END GROUP CALL ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/group-calls/room
   * Body: { peerId }
   *
   * Xóa roomKey data giữa currentUser và peerId.
   */
  async removeRoomData(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { peerId } = req.body;

      if (!peerId) {
        return res.status(400).json({ error: "Missing peerId" });
      }

      await CallGroupDAO.removeRoomData(uid, peerId);

      return res.status(200).json({ message: "Room data removed" });
    } catch (error) {
      console.error("REMOVE ROOM DATA ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CallGroupController();