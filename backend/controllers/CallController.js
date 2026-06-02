/**
 * CallController.js — HTTP Controller cho 1-on-1 call signaling
 *
 * Các endpoint này là REST fallback / helper cho phía client.
 * Logic WebRTC thực sự vẫn chạy trực tiếp trên Firebase client SDK (useCall.js).
 * Controller này phục vụ khi cần thao tác qua backend (ví dụ: server-side cleanup,
 * push notification, hoặc kiểm tra trạng thái cuộc gọi).
 *
 * Routes (đăng ký trong index.js):
 *   POST   /api/calls/offer                — caller gửi offer tới callee
 *   POST   /api/calls/answer               — callee gửi answer về caller
 *   POST   /api/calls/ice                  — gửi ICE candidate
 *   POST   /api/calls/signal               — gửi signal (rejected / ended)
 *   DELETE /api/calls/:userId              — xóa toàn bộ call data của user
 *   GET    /api/calls/:userId/offer        — lấy offer hiện tại (REST check)
 */

const CallDAO = require("../DAOs/CallDAO");
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

class CallController {

  /**
   * POST /api/calls/offer
   * Body: { targetUserId, callerName, offer }
   *
   * Caller ghi offer lên Firebase node của callee.
   * "offer" là JSON.stringify(RTCSessionDescription) từ frontend.
   */
  async sendOffer(req, res) {
    try {
      const callerId = await getUidFromRequest(req, res);
      if (!callerId) return;

      const { targetUserId, callerName, offer } = req.body;

      if (!targetUserId || !offer) {
        return res.status(400).json({ error: "Missing targetUserId or offer" });
      }

      if (callerId === targetUserId) {
        return res.status(400).json({ error: "Cannot call yourself" });
      }

      await CallDAO.setOffer(targetUserId, {
        callerId,
        callerName: callerName || callerId,
        offer,
      });

      return res.status(200).json({ message: "Offer sent" });
    } catch (error) {
      console.error("SEND OFFER ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/calls/answer
   * Body: { callerId, answer }
   *
   * Callee ghi answer lên Firebase node của caller.
   * "answer" là JSON.stringify(RTCSessionDescription) từ frontend.
   */
  async sendAnswer(req, res) {
    try {
      const calleeId = await getUidFromRequest(req, res);
      if (!calleeId) return;

      const { callerId, answer } = req.body;

      if (!callerId || !answer) {
        return res.status(400).json({ error: "Missing callerId or answer" });
      }

      await CallDAO.setAnswer(callerId, { answer });

      // Dọn dẹp offer trên node của callee sau khi đã accept
      await CallDAO.removeOffer(calleeId);
      await CallDAO.removeCallerIce(calleeId);

      return res.status(200).json({ message: "Answer sent" });
    } catch (error) {
      console.error("SEND ANSWER ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/calls/ice
   * Body: { targetUserId, candidate, role }
   *   role: "caller" → ghi callerIce; "callee" → ghi calleeIce
   *
   * Gửi ICE candidate tới đối phương.
   * "candidate" là JSON.stringify(RTCIceCandidate) từ frontend.
   */
  async sendIceCandidate(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { targetUserId, candidate, role } = req.body;

      if (!targetUserId || !candidate || !role) {
        return res.status(400).json({ error: "Missing targetUserId, candidate, or role" });
      }

      if (role === "caller") {
        await CallDAO.setCallerIce(targetUserId, candidate);
      } else if (role === "callee") {
        await CallDAO.setCalleeIce(targetUserId, candidate);
      } else {
        return res.status(400).json({ error: "role must be 'caller' or 'callee'" });
      }

      return res.status(200).json({ message: "ICE candidate sent" });
    } catch (error) {
      console.error("SEND ICE ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/calls/signal
   * Body: { targetUserId, signal }
   *   signal: "rejected" | "ended"
   *
   * Gửi tín hiệu kết thúc/từ chối tới đối phương.
   */
  async sendSignal(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { targetUserId, signal } = req.body;

      if (!targetUserId || !signal) {
        return res.status(400).json({ error: "Missing targetUserId or signal" });
      }

      const validSignals = ["rejected", "ended"];
      if (!validSignals.includes(signal)) {
        return res.status(400).json({ error: `signal must be one of: ${validSignals.join(", ")}` });
      }

      await CallDAO.setSignal(targetUserId, signal);

      // Người gửi signal tự dọn dẹp data của mình
      await CallDAO.removeAllCallData(uid);

      return res.status(200).json({ message: "Signal sent" });
    } catch (error) {
      console.error("SEND SIGNAL ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/calls/:userId
   *
   * Xóa toàn bộ call data của userId (server-side cleanup).
   * Chỉ user chính mình hoặc admin mới được xóa.
   */
  async clearCallData(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { userId } = req.params;

      if (uid !== userId) {
        return res.status(403).json({ error: "Cannot clear another user's call data" });
      }

      await CallDAO.removeAllCallData(userId);

      return res.status(200).json({ message: "Call data cleared" });
    } catch (error) {
      console.error("CLEAR CALL DATA ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/calls/:userId/offer
   *
   * Lấy offer hiện tại của một user (REST check, dùng để debug hoặc REST client).
   */
  async getOffer(req, res) {
    try {
      const uid = await getUidFromRequest(req, res);
      if (!uid) return;

      const { userId } = req.params;

      // Chỉ cho phép lấy offer của chính mình
      if (uid !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const offer = await CallDAO.getOffer(userId);

      return res.status(200).json({ offer: offer || null });
    } catch (error) {
      console.error("GET OFFER ERROR:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new CallController();