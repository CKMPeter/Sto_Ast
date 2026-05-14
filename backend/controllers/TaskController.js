const taskDAO = require('../DAOs/taskDAO')

class TaskController {

  // =========================
  // MAIN TASKS
  // =========================

  async createMainTask(req, res) {
    try {

      const result = await taskDAO.createMainTask(req.body)

      res.status(201).json({
        success: true,
        message: 'Main task created',
        data: result
      })

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getMainTasks(req, res) {
    try {

      const { userId } = req.query

      const tasks = await taskDAO.getMainTasks(userId)

      res.status(200).json({
        success: true,
        data: tasks
      })

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async updateMainTask(req, res) {
    try {

      const { taskId } = req.params

      await taskDAO.updateMainTask(
        taskId,
        req.body
      )

      res.status(200).json({
        success: true,
        message: 'Main task updated'
      })

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async deleteMainTask(req, res) {
    try {

      const { taskId } = req.params

      await taskDAO.deleteMainTask(taskId)

      res.status(200).json({
        success: true,
        message: 'Main task deleted'
      })

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  // =========================
  // SUB TASKS
  // =========================

  async createSubTask(req, res) {
    try {

      const { taskId } = req.params

      const result = await taskDAO.createSubTask(
        taskId,
        req.body
      )

      // update main task progress
      await taskDAO.updateTaskProgress(taskId)

      res.status(201).json({
        success: true,
        message: 'Sub task created',
        data: result
      })

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async getSubTasks(req, res) {
    try {

      const { taskId } = req.params

      const subtasks = await taskDAO.getSubTasks(taskId)

      res.status(200).json({
        success: true,
        data: subtasks
      })

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async updateSubTask(req, res) {
    try {

      const { taskId, subTaskId } = req.params

      await taskDAO.updateSubTask(
        taskId,
        subTaskId,
        req.body
      )

      // update main task progress
      await taskDAO.updateTaskProgress(taskId)

      res.status(200).json({
        success: true,
        message: 'Sub task updated'
      })

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

  async deleteSubTask(req, res) {
    try {

      const { taskId, subTaskId } = req.params

      await taskDAO.deleteSubTask(
        taskId,
        subTaskId
      )

      // update main task progress
      await taskDAO.updateTaskProgress(taskId)

      res.status(200).json({
        success: true,
        message: 'Sub task deleted'
      })

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }

}

module.exports = new TaskController()