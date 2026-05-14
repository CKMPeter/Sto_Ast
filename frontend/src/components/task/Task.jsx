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

  const [mainTaskName, setMainTaskName] = useState('')
  const [subTaskName, setSubTaskName] = useState('')

  const [mainTasks, setMainTasks] = useState([])
  const [tasks, setTasks] = useState([])

  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [draggedTask, setDraggedTask] = useState(null)

  const [mainTaskSelected, setMainTaskSelected] = useState(false)

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

  const createMainTask = async () => {
  if (!mainTaskName.trim()) return

  try {
    const token = await getIdToken()

    const response = await fetch(
      `${BACKEND_URL}/api/tasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: mainTaskName,
          userId: currentUser.uid
        })
      }
    )

    const data = await response.json()

    if (data.success) {
      setMainTaskName('')
      fetchMainTasks()
    }

  } catch (error) {
    console.error('Create main task error:', error)
  }
}

const createSubTask = async () => {
  if (!subTaskName.trim() || !selectedTaskId) return

  try {
    const token = await getIdToken()

    const response = await fetch(
      `${BACKEND_URL}/api/tasks/${selectedTaskId}/subtasks`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: subTaskName,
          status: 'To do'
        })
      }
    )

    const data = await response.json()

    if (data.success) {
      setSubTaskName('')
      fetchSubTasks(selectedTaskId)
    }

  } catch (error) {
    console.error('Create subtask error:', error)
  }
}

//delete main task
const deleteMainTask = async (taskId) => {
  try {
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

    const data = await response.json()

    if (data.success) {
      const updatedTasks = mainTasks.filter(
        task => task.id !== taskId
      )

      setMainTasks(updatedTasks)

      if (selectedTaskId === taskId) {
        setSelectedTaskId(null)
        setMainTaskSelected(false)
        setTasks([])
      }
    }

  } catch (error) {
    console.error('Delete main task error:', error)
  }
}
//delete subtask
const deleteSubTask = async (subTaskId) => {
  try {
    const token = await getIdToken()

    const response = await fetch(
      `${BACKEND_URL}/api/tasks/${selectedTaskId}/subtasks/${subTaskId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    const data = await response.json()

    if (data.success) {
      setTasks(prev =>
        prev.filter(task => task.id !== subTaskId)
      )
    }

  } catch (error) {
    console.error('Delete subtask error:', error)
  }
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
          <div key={task.id} style={styleSheet.subTaskItem}>
            <TaskComponent
              task={task}
              onDragStart={setDraggedTask}
            />

            <button
              onClick={() => deleteSubTask(task.id)}
              style={styleSheet.deleteButton}
            >
              Delete
            </button>
          </div>
        ))}
    </div>
  )

  return (
    <div>
      <NavbarComponent />

      <h1>Task</h1>

      <div style={{display: 'flex'}}>
        {/* left column - main task creation and list */}
        <div style={styleSheet.leftContainer}>
          <div style={styleSheet.createContainer}>
            <input
              type="text"
              placeholder="Main task name"
              value={mainTaskName}
              onChange={(e) => setMainTaskName(e.target.value)}
              style={styleSheet.input}
            />

            <button
              onClick={createMainTask}
              style={styleSheet.button}
            >
              Create Main Task
            </button>
          </div>
          {/* MAIN TASK LIST */}
          <div style={styleSheet.taskListContainer}>
            {mainTasks.map(task => (
              <div
                key={task.id}
                onClick={() => {
                  setSelectedTaskId(task.id);
                  if (!mainTaskSelected)setMainTaskSelected(true)
                  else if (mainTaskSelected && selectedTaskId === task.id) setMainTaskSelected(false)}}
                style={{
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                <div style={styleSheet.mainTaskItem}>
                  <TaskListComponent
                    tasks={[task]}
                  />

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteMainTask(task.id)
                    }}
                    style={styleSheet.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {mainTaskSelected ? (
          <div style = {styleSheet.rightContainer}>
             {/*right column - sub task creation and board */}
            <div style={styleSheet.createContainer}>
              <input
                type="text"
                placeholder="Sub task name"
                value={subTaskName}
                onChange={(e) => setSubTaskName(e.target.value)}
                style={styleSheet.input}
            />

            <button
              onClick={createSubTask}
              style={styleSheet.button}
            >
              Create Sub Task
            </button>
          </div>
          {/* SUBTASK BOARD */}
          <div style={styleSheet.taskContainer}>
            {renderColumn('To do')}
            {renderColumn('In Progress')}
            {renderColumn('Done')}
          </div>
        </div>  
      ) : (
          <div style={styleSheet.placeholderContainer}>
            <img src="./Sto_Ast_Logo_Title.png" alt="" style={{height: '50%', opacity: '30%'}}/>
          </div>
      )}

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
    gap: '10px'
  },
  createContainer: {
    width: '100%',
    marginBottom: '20px'
  },
  input: {
    padding: '8px',
    marginRight: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    width: '200px'
  },
  button: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  taskBox: {
    width: '100%',
    minHeight: '300px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    backgroundColor: '#fff',
    padding: '10px',
  },
  leftContainer: {
    width: '20%',
    padding: '10px'
  },
  rightContainer: {
    width: '100%',
    padding: '10px',
  },
  placeholderContainer: {
    borderRadius: '5px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '80vh',
    width: '80%',
  },
  mainTaskItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
    gap: '10px'
  },

  subTaskItem: {
    marginBottom: '10px'
  },

  deleteButton: {
    padding: '6px 10px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
}