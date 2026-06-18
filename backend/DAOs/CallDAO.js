/**
 * CallDAO.js — Data Access Object cho 1-on-1 call signaling
 *
 * Tất cả thao tác Firebase Realtime Database liên quan đến cuộc gọi 1-1
 * đều được đặt ở đây, tách biệt khỏi business logic của Controller.
 *
 * Firebase schema:
 *   calls/{userId}/offer      — caller ghi, callee đọc
 *   calls/{userId}/answer     — callee ghi, caller đọc
 *   calls/{userId}/callerIce  — caller ghi ICE candidate
 *   calls/{userId}/calleeIce  — callee ghi ICE candidate
 *   calls/{userId}/signal     — tín hiệu điều khiển: "rejected" | "ended"
 */

const { realtimeDatabase } = require("../firebase-admin-setup");

class CallDAO {
  // ─── OFFER ────────────────────────────────────────────────────────────────

  /**
   * Ghi offer lên node của callee (targetUserId).
   * @param {string} targetUserId  - uid của người được gọi
   * @param {object} offerPayload  - { callerId, callerName, offer: JSON.stringify(RTCSessionDescription) }
   */
  async setOffer(targetUserId, offerPayload) {
    await realtimeDatabase
      .ref(`calls/${targetUserId}/offer`)
      .set(offerPayload);
  }

  /**
   * Xóa offer trên node của userId (callee dọn dẹp sau khi acceptCall).
   * @param {string} userId
   */
  async removeOffer(userId) {
    await realtimeDatabase.ref(`calls/${userId}/offer`).remove();
  }

  // ─── ANSWER ───────────────────────────────────────────────────────────────

  /**
   * Ghi answer lên node của caller.
   * @param {string} callerId     - uid của người gọi
   * @param {object} answerPayload - { answer: JSON.stringify(RTCSessionDescription) }
   */
  async setAnswer(callerId, answerPayload) {
    await realtimeDatabase
      .ref(`calls/${callerId}/answer`)
      .set(answerPayload);
  }

  // ─── ICE CANDIDATES ───────────────────────────────────────────────────────

  /**
   * Ghi callerIce lên node của targetUser (callee sẽ đọc).
   * @param {string} targetUserId
   * @param {string} candidateJSON - JSON.stringify(RTCIceCandidate)
   */
  async setCallerIce(targetUserId, candidateJSON) {
    await realtimeDatabase
      .ref(`calls/${targetUserId}/callerIce`)
      .set(candidateJSON);
  }

  /**
   * Ghi calleeIce lên node của caller (caller sẽ đọc).
   * @param {string} callerId
   * @param {string} candidateJSON - JSON.stringify(RTCIceCandidate)
   */
  async setCalleeIce(callerId, candidateJSON) {
    await realtimeDatabase
      .ref(`calls/${callerId}/calleeIce`)
      .set(candidateJSON);
  }

  // ─── SIGNAL ───────────────────────────────────────────────────────────────

  /**
   * Ghi signal lên node của targetUser để thông báo trạng thái cuộc gọi.
   * @param {string} targetUserId
   * @param {"rejected"|"ended"} signal
   */
  async setSignal(targetUserId, signal) {
    await realtimeDatabase
      .ref(`calls/${targetUserId}/signal`)
      .set(signal);
  }

  // ─── CLEANUP ──────────────────────────────────────────────────────────────

  /**
   * Xóa toàn bộ dữ liệu call của một user (dọn dẹp sau khi kết thúc/từ chối).
   * @param {string} userId
   */
  async removeAllCallData(userId) {
    await realtimeDatabase.ref(`calls/${userId}`).remove();
  }

  /**
   * Xóa callerIce trên node của userId.
   * @param {string} userId
   */
  async removeCallerIce(userId) {
    await realtimeDatabase.ref(`calls/${userId}/callerIce`).remove();
  }

  // ─── READ ─────────────────────────────────────────────────────────────────

  /**
   * Lấy offer hiện tại của một user (dùng để kiểm tra hoặc REST fallback).
   * @param {string} userId
   * @returns {object|null}
   */
  async getOffer(userId) {
    const snap = await realtimeDatabase
      .ref(`calls/${userId}/offer`)
      .once("value");
    return snap.val();
  }

  /**
   * Lấy signal hiện tại của một user.
   * @param {string} userId
   * @returns {string|null}
   */
  async getSignal(userId) {
    const snap = await realtimeDatabase
      .ref(`calls/${userId}/signal`)
      .once("value");
    return snap.val();
  }
}

module.exports = new CallDAO();