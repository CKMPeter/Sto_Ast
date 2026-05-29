const { realtimeDatabase } = require("../firebase-admin-setup");

class GroupDAO {

  // CREATE GROUP
  async createGroup(groupData) {
    const groupRef = realtimeDatabase.ref("groups").push();

    const groupId = groupRef.key;

    await groupRef.set({
      ...groupData,
      id: groupId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tasks: [],
    });

    return groupId;
  }

  // GET GROUP BY ID
  async getGroupById(groupId) {
    const snapshot = await realtimeDatabase
      .ref(`groups/${groupId}`)
      .once("value");

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.val();
  }

  // GET USER GROUPS
  async getUserGroups(userId) {
    const snapshot = await realtimeDatabase
      .ref("groups")
      .once("value");

    if (!snapshot.exists()) {
      return [];
    }

    const groupsData = snapshot.val();

    return Object.values(groupsData).filter((group) =>
      Array.isArray(group.members) &&
      group.members.includes(userId)
    );
  }

  // UPDATE GROUP
  async updateGroup(groupId, updateData) {
    await realtimeDatabase
      .ref(`groups/${groupId}`)
      .update({
        ...updateData,
        updatedAt: Date.now(),
      });

    return true;
  }

  // DELETE GROUP
  async deleteGroup(groupId) {
    await realtimeDatabase
      .ref(`groups/${groupId}`)
      .remove();

    return true;
  }

  // ADD MEMBER
  async addMember(groupId, userId) {
    const snapshot = await realtimeDatabase
      .ref(`groups/${groupId}/members`)
      .once("value");

    const members = snapshot.val() || [];

    if (!members.includes(userId)) {
      members.push(userId);
    }

    await realtimeDatabase
      .ref(`groups/${groupId}`)
      .update({
        members,
        updatedAt: Date.now(),
      });

    return true;
  }

  // REMOVE MEMBER
  async removeMember(groupId, userId) {
    const snapshot = await realtimeDatabase
      .ref(`groups/${groupId}/members`)
      .once("value");

    let members = snapshot.val() || [];

    members = members.filter((id) => id !== userId);

    await realtimeDatabase
      .ref(`groups/${groupId}`)
      .update({
        members,
        updatedAt: Date.now(),
      });

    return true;
  }

  // ADD TASK TO GROUP
  async addTaskToGroup(groupId, taskId) {
    const snapshot = await realtimeDatabase
      .ref(`groups/${groupId}/tasks`)
      .once("value");

    const tasks = snapshot.val() || [];

    if (!tasks.includes(taskId)) {
      tasks.push(taskId);
    }

    await realtimeDatabase
      .ref(`groups/${groupId}`)
      .update({
        tasks,
        updatedAt: Date.now(),
      });

    return true;
  }
}

module.exports = new GroupDAO();