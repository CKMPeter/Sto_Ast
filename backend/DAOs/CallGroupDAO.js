/**
 * CallGroupDAO.js — Data Access Object cho group call signaling
 *
 * Tất cả thao tác Firebase Realtime Database liên quan đến group call
 * đều được đặt ở đây.
 *
 * Firebase schema:
 *   groupCalls/{roomKey}/offer            — caller ghi (roomKey = sort([uid1,uid2]).join("_"))
 *   groupCalls/{roomKey}/answer           — callee ghi
 *   groupCalls/{roomKey}/callerIce/{id}   — caller push nhiều ICE candidates
 *   groupCalls/{roomKey}/calleeIce/{id}   — callee push nhiều ICE candidates
 *   groupCalls/{roomKey}/signal           — "rejected" | "left" | "ended"
 *   groupCallInvite/{groupId}             — invite chung cho cả group
 */

const { realtimeDatabase } = require("../firebase-admin-setup");

// Helper: tạo roomKey từ 2 uid (thứ tự không quan trọng)
const roomKey = (uid1, uid2) => [uid1, uid2].sort().join("_");

class CallGroupDAO {
  // ─── INVITE ───────────────────────────────────────────────────────────────

  /**
   * Ghi invite cho cả group (caller gọi, tất cả member sẽ nhận).
   * @param {string} groupId
   * @param {object} invitePayload - { callerId, callerName, groupId, groupName, timestamp, members }
   */
  async setGroupInvite(groupId, invitePayload) {
    await realtimeDatabase
      .ref(`groupCallInvite/${groupId}`)
      .set(invitePayload);
  }

  /**
   * Xóa invite của group (sau khi callee đã accept hoặc call kết thúc).
   * @param {string} groupId
   */
  async removeGroupInvite(groupId) {
    await realtimeDatabase.ref(`groupCallInvite/${groupId}`).remove();
  }

  /**
   * Lấy invite hiện tại của group.
   * @param {string} groupId
   * @returns {object|null}
   */
  async getGroupInvite(groupId) {
    const snap = await realtimeDatabase
      .ref(`groupCallInvite/${groupId}`)
      .once("value");
    return snap.val();
  }

  // ─── OFFER (per-pair) ─────────────────────────────────────────────────────

  /**
   * Ghi offer lên roomKey giữa caller và một callee cụ thể.
   * @param {string} callerId
   * @param {string} calleeId
   * @param {object} offerPayload - { callerId, offer: JSON.stringify(RTCSessionDescription) }
   */
  async setOffer(callerId, calleeId, offerPayload) {
    const rk = roomKey(callerId, calleeId);
    await realtimeDatabase.ref(`groupCalls/${rk}/offer`).set(offerPayload);
  }

  /**
   * Lấy offer trong roomKey giữa 2 uid.
   * @param {string} uid1
   * @param {string} uid2
   * @returns {object|null}
   */
  async getOffer(uid1, uid2) {
    const rk = roomKey(uid1, uid2);
    const snap = await realtimeDatabase
      .ref(`groupCalls/${rk}/offer`)
      .once("value");
    return snap.val();
  }

  // ─── ANSWER (per-pair) ────────────────────────────────────────────────────

  /**
   * Ghi answer lên roomKey.
   * @param {string} uid1
   * @param {string} uid2
   * @param {object} answerPayload - { answer: JSON.stringify(RTCSessionDescription) }
   */
  async setAnswer(uid1, uid2, answerPayload) {
    const rk = roomKey(uid1, uid2);
    await realtimeDatabase.ref(`groupCalls/${rk}/answer`).set(answerPayload);
  }

  // ─── ICE CANDIDATES (per-pair, multiple) ──────────────────────────────────

  /**
   * Push callerIce candidate (không ghi đè, dùng push() để tạo unique key).
   * @param {string} callerId
   * @param {string} calleeId
   * @param {string} candidateJSON - JSON.stringify(RTCIceCandidate)
   */
  async pushCallerIce(callerId, calleeId, candidateJSON) {
    const rk = roomKey(callerId, calleeId);
    await realtimeDatabase
      .ref(`groupCalls/${rk}/callerIce`)
      .push(candidateJSON);
  }

  /**
   * Push calleeIce candidate.
   * @param {string} callerId
   * @param {string} calleeId
   * @param {string} candidateJSON - JSON.stringify(RTCIceCandidate)
   */
  async pushCalleeIce(callerId, calleeId, candidateJSON) {
    const rk = roomKey(callerId, calleeId);
    await realtimeDatabase
      .ref(`groupCalls/${rk}/calleeIce`)
      .push(candidateJSON);
  }

  // ─── SIGNAL (per-pair) ────────────────────────────────────────────────────

  /**
   * Ghi signal lên roomKey giữa 2 uid.
   * @param {string} uid1
   * @param {string} uid2
   * @param {"rejected"|"left"|"ended"} signal
   */
  async setSignal(uid1, uid2, signal) {
    const rk = roomKey(uid1, uid2);
    await realtimeDatabase.ref(`groupCalls/${rk}/signal`).set(signal);
  }

  // ─── CLEANUP (per-pair) ───────────────────────────────────────────────────

  /**
   * Xóa toàn bộ data trong roomKey giữa 2 uid.
   * @param {string} uid1
   * @param {string} uid2
   */
  async removeRoomData(uid1, uid2) {
    const rk = roomKey(uid1, uid2);
    await realtimeDatabase.ref(`groupCalls/${rk}`).remove();
  }

  /**
   * Xóa toàn bộ signaling data của một user với tất cả members trong group.
   * Dùng khi một người rời khỏi group call.
   * @param {string} userId        - uid của người rời
   * @param {Array<string>} peerUids - danh sách uid của các peers
   */
  async removeAllPairData(userId, peerUids = []) {
    const removes = peerUids.map((peerUid) => this.removeRoomData(userId, peerUid));
    await Promise.all(removes);
  }

  /**
   * Ghi signal "left" hoặc "ended" tới tất cả peers rồi xóa data.
   * @param {string} userId
   * @param {Array<string>} peerUids
   * @param {"left"|"ended"} signal
   */
  async signalAndCleanupAll(userId, peerUids = [], signal = "left") {
    const validSignals = ["left", "ended", "rejected"];
    if (!validSignals.includes(signal)) {
      throw new Error(`signal must be one of: ${validSignals.join(", ")}`);
    }

    for (const peerUid of peerUids) {
      await this.setSignal(userId, peerUid, signal);
      await this.removeRoomData(userId, peerUid);
    }
  }
}

module.exports = new CallGroupDAO();