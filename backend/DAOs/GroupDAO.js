const { admin } = require("../firebase-admin-setup");

class GroupDAO {

  //  CREATE GROUP
  async createGroup(groupData) {
    const docRef = await admin
      .firestore()
      .collection("groups")
      .add({
        ...groupData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return docRef.id;
  }

  //  GET GROUP BY ID
  async getGroupById(groupId) {
    const doc = await admin
      .firestore()
      .collection("groups")
      .doc(groupId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  }

  //  GET USER GROUPS
  async getUserGroups(userId) {
    const snapshot = await admin
      .firestore()
      .collection("groups")
      .where("members", "array-contains", userId)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  //  UPDATE GROUP
  async updateGroup(groupId, updateData) {
    await admin
      .firestore()
      .collection("groups")
      .doc(groupId)
      .update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return true;
  }

  //  DELETE GROUP
  async deleteGroup(groupId) {
    await admin
      .firestore()
      .collection("groups")
      .doc(groupId)
      .delete();

    return true;
  }

  //  ADD MEMBER
  async addMember(groupId, userId) {
    await admin
      .firestore()
      .collection("groups")
      .doc(groupId)
      .update({
        members: admin.firestore.FieldValue.arrayUnion(userId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return true;
  }

  //  REMOVE MEMBER
  async removeMember(groupId, userId) {
    await admin
      .firestore()
      .collection("groups")
      .doc(groupId)
      .update({
        members: admin.firestore.FieldValue.arrayRemove(userId),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return true;
  }
}

module.exports = new GroupDAO();