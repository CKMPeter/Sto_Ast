// src/services/task/taskService.js

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ||
  'http://localhost:5000'

// =========================
// MAIN TASKS
// =========================

export const fetchMainTasksService = async (
  getIdToken,
  userId
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/tasks?userId=${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return await response.json()
}

export const createMainTaskService = async (
  getIdToken,
  taskData
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/tasks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    }
  )

  return await response.json()
}

export const updateMainTaskService = async (
  getIdToken,
  taskId,
  updateData
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/tasks/${taskId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    }
  )

  return await response.json()
}

export const deleteMainTaskService = async (
  getIdToken,
  taskId
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/tasks/${taskId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return await response.json()
}

// =========================
// SUBTASKS
// =========================

export const fetchSubTasksService = async (
  getIdToken,
  taskId
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/tasks/${taskId}/subtasks`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return await response.json()
}

export const createSubTaskService = async (
  getIdToken,
  taskId,
  subTaskData
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/tasks/${taskId}/subtasks`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(subTaskData)
    }
  )

  return await response.json()
}

export const updateSubTaskService = async (
  getIdToken,
  taskId,
  subTaskId,
  updateData
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/tasks/${taskId}/subtasks/${subTaskId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    }
  )

  return await response.json()
}

export const deleteSubTaskService = async (
  getIdToken,
  taskId,
  subTaskId
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/tasks/${taskId}/subtasks/${subTaskId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return await response.json()
}

// =========================
// TASK LOGS
// =========================

export const fetchTaskLogsService = async (
  getIdToken,
  taskId
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/tasks/${taskId}/logs`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )

  return await response.json()
}

// =========================
// OTHER SERVICES (if needed)
// =========================

export const createTaskUsingAIService = async (
  getIdToken,
  taskData
) => {

  const token = await getIdToken()

  const response = await fetch(
    `${BACKEND_URL}/api/create-task`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    }
  )

  return await response.json()
}