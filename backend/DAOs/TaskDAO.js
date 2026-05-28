const { db, admin } = require("../firebase-admin-setup")

class TaskDAO {

  // =========================
  // MAIN TASKS
  // =========================

  async createMainTask(taskData) {

    const docRef = await db
      .collection('mainTasks')
      .add({
        ...taskData,
        progress: 0,
        group: taskData.group || 'Default',
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),
        expireAt: taskData.expireAt
          ? admin.firestore.Timestamp.fromDate(
              new Date(taskData.expireAt)
            )
          : null,
        description: taskData.description || ""
      })

    // create logs subcollection starter log
    await this.createTaskLog(
      docRef.id,
      {
        action: 'CREATE_MAIN_TASK',
        message: `Main task "${taskData.name}" created`,
        createdBy: taskData.userId || 'Unknown'
      }
    )

    return {
      id: docRef.id
    }
  }

  async getMainTasks(userId, group = null) {

    let query = db
      .collection('mainTasks')
      .where('userId', '==', userId)

    if (group) {
      query = query.where('group', '==', group)
    }

    const snapshot = await query.get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  async updateMainTask(taskId, updateData) {

    await db
      .collection('mainTasks')
      .doc(taskId)
      .update({
        ...updateData,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp()
      })

    // log update
    await this.createTaskLog(
      taskId,
      {
        action: 'UPDATE_MAIN_TASK',
        message: `Main task updated`,
        updatedFields: Object.keys(updateData)
      }
    )

    return true
  }

  async deleteMainTask(taskId) {

    const subTasksSnapshot = await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .get()

    const logsSnapshot = await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('logs')
      .get()

    const batch = db.batch()

    // delete subtasks
    subTasksSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    // delete logs
    logsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    // delete main task
    batch.delete(
      db.collection('mainTasks')
        .doc(taskId)
    )

    await batch.commit()

    return true
  }

  // =========================
  // SUB TASKS
  // =========================

  async createSubTask(
    taskId,
    subTaskData
  ) {

    const docRef = await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .add({
        ...subTaskData,
        createdAt:
          admin.firestore.FieldValue.serverTimestamp(),
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp(),
        timeLogged: 0,
        assignedTo: subTaskData.assignedTo || null
      })

    // log create
    await this.createTaskLog(
      taskId,
      {
        action: 'CREATE_SUB_TASK',
        message: `Sub task "${subTaskData.name}" created`
      }
    )

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

  async updateSubTask(
    taskId,
    subTaskId,
    updateData
  ) {

    await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .doc(subTaskId)
      .update({
        ...updateData,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp()
      })

    // log update
    await this.createTaskLog(
      taskId,
      {
        action: 'UPDATE_SUB_TASK',
        message: `Sub task updated`,
        subTaskId,
        updatedFields:
          Object.keys(updateData)
      }
    )

    return true
  }

  async deleteSubTask(
    taskId,
    subTaskId
  ) {

    await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('subtasks')
      .doc(subTaskId)
      .delete()

    // log delete
    await this.createTaskLog(
      taskId,
      {
        action: 'DELETE_SUB_TASK',
        message: `Sub task deleted`,
        subTaskId
      }
    )

    return true
  }

  // =========================
  // TASK LOGS
  // =========================

  async createTaskLog(
    taskId,
    logData
  ) {

    const docRef = await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('logs')
      .add({
        ...logData,
        createdAt:
          admin.firestore.FieldValue.serverTimestamp()
      })

    return {
      id: docRef.id
    }
  }

  async getTaskLogs(taskId) {

    const snapshot = await db
      .collection('mainTasks')
      .doc(taskId)
      .collection('logs')
      .orderBy('createdAt', 'desc')
      .get()

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  // =========================
  // PROGRESS CALCULATION
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

    const completedSubTasks =
      subtasks.filter(
        subtask =>
          subtask.status === 'Done'
      ).length

    const progress =
      subtasks.length > 0
        ? Math.round(
            (
              completedSubTasks /
              subtasks.length
            ) * 100
          )
        : 0

    await db
      .collection('mainTasks')
      .doc(taskId)
      .update({
        progress,
        updatedAt:
          admin.firestore.FieldValue.serverTimestamp()
      })

    // log progress update
    await this.createTaskLog(
      taskId,
      {
        action: 'UPDATE_PROGRESS',
        message:
          `Task progress updated to ${progress}%`,
        progress
      }
    )

    return progress
  }
}

module.exports = new TaskDAO()