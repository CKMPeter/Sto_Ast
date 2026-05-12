import React, { useEffect, useState } from 'react'
import TaskComponent from './TaskComponent'
import NavbarComponent from '../shared/Navbar'
import TaskListComponent from './TaskListComponent'
import { useAuth } from '../../contexts/AuthContext'

const BACKEND_URL =
  import.meta.env.VITE_APP_BACKEND_URL ||
  'http://localhost:5000'

export default function Task() {
  const { currentUser, getIdToken } = useAuth()

  const [mainTasks, setMainTasks] = useState([])
  const [tasks, setTasks] = useState([])

  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)

//fetch main tasks for the current user
  const fetchMainTasks = async () => {
    try {
      const token = await getIdToken()

      const response = await fetch(
        `${BACKEND_URL}/api/tasks?userId=${currentUser.uid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (data.success) {
        setMainTasks(data.data)

        // auto select first task
        if (data.data.length > 0 && !selectedTaskId) {
          setSelectedTaskId(data.data[0].id)
        }
      }

    } catch (error) {
      console.error('Fetch main tasks error:', error)
    }
  }

//fetch subtasks for the selected main task
  const fetchSubTasks = async (taskId) => {
    try {
      const token = await getIdToken()

      const response = await fetch(
        `${BACKEND_URL}/api/tasks/${taskId}/subtasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const data = await response.json()

      if (data.success) {
        setTasks(data.data)
      }

    } catch (error) {
      console.error('Fetch subtasks error:', error)
    }
  }

//update subtask status in the backend when a subtask is dropped into a new status column
  const updateSubTaskStatus = async (
    taskId,
    subTaskId,
    status
  ) => {
    try {
      const token = await getIdToken()

      await fetch(
        `${BACKEND_URL}/api/tasks/${taskId}/subtasks/${subTaskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status
          })
        }
      )

    } catch (error) {
      console.error('Update subtask error:', error)
    }
  }

// handle drop event when a subtask is dropped into a new status column
  const handleDrop = async (status) => {
    if (!draggedTask || !selectedTaskId) return

    const updatedTasks = tasks.map(task =>
      task.id === draggedTask.id
        ? { ...task, status }
        : task
    )

    setTasks(updatedTasks)

    await updateSubTaskStatus(
      selectedTaskId,
      draggedTask.id,
      status
    )

    setDraggedTask(null)
  }

//  load main tasks on component mount and when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchMainTasks()
    }
  }, [currentUser])

//load subtasks when selectedTaskId changes
  useEffect(() => {
    if (selectedTaskId) {
      fetchSubTasks(selectedTaskId)
    }
  }, [selectedTaskId])

// render a column for a given status with its subtasks
  const renderColumn = (status) => (
    <div
      style={styleSheet.taskBox}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => handleDrop(status)}
    >
      <h4>{status}</h4>

      {tasks
        .filter(task => task.status === status)
        .map(task => (
          <TaskComponent
            key={task.id}
            task={task}
            onDragStart={setDraggedTask}
          />
        ))}
    </div>
  )

  return (
    <div>
      <NavbarComponent />

      <h1>Task</h1>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >

        {/* MAIN TASK LIST */}
        <div style={styleSheet.taskListContainer}>
          {mainTasks.map(task => (
            <div
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              style={{
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <TaskListComponent tasks={[task]} />
            </div>
          ))}
        </div>

        {/* SUBTASK BOARD */}
        <div style={styleSheet.taskContainer}>
          {renderColumn('To do')}
          {renderColumn('In Progress')}
          {renderColumn('Done')}
        </div>
      </div>
    </div>
  )
}

const styleSheet = {
  taskListContainer: {
    width: '80%',
    marginBottom: '20px'
  },

  taskContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    width: '80%',
  },

  taskBox: {
    width: '100%',
    minHeight: '300px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    padding: '10px',
    margin: '10px',
    backgroundColor: '#fff'
  }
}