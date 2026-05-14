const { db, admin } = require("../firebase-admin-setup");

class TaskDAO {

  // =========================
  // MAIN TASKS
  // =========================

  async createMainTask(taskData) {
    const docRef = await db.collection('mainTasks').add({
      ...taskData,
      progress: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })

    return {
      id: docRef.id
    }
  }

  async getMainTasks() {
    const snapshot = await db.collection('mainTasks').get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  async updateMainTask(taskId, updateData) {
    await db.collection('mainTasks')
      .doc(taskId)
      .update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

    return true
  }

  async deleteMainTask(taskId) {

    const subTasksSnapshot = await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .get()

    const batch = db.batch()

    subTasksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    batch.delete(
      db.collection('mainTasks').doc(taskId)
    )

    await batch.commit()

    return true
  }

  // =========================
  // SUB TASKS
  // =========================

  async createSubTask(taskId, subTaskData) {
    const docRef = await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .add({
        ...subTaskData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

    return {
      id: docRef.id
    }
  }

  async getSubTasks(taskId) {
    const snapshot = await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  async updateSubTask(taskId, subTaskId, updateData) {
    await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .doc(subTaskId)
      .update({
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

    return true
  }

  async deleteSubTask(taskId, subTaskId) {
    await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .doc(subTaskId)
      .delete()

    return true
  }

  // =========================
  // Process Calculation
  // =========================
  async updateTaskProgress(taskId) {

    const snapshot = await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .get()

    const subtasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    const completedSubTasks = subtasks.filter(
      subtask => subtask.status === 'Done'
    ).length

    const progress = subtasks.length > 0
      ? Math.round(
          (completedSubTasks / subtasks.length) * 100
        )
      : 0

    await db
      .collection('mainTasks')
      .doc(taskId)
      .update({
        progress,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      })

    return progress
  }
}

module.exports = new TaskDAO()