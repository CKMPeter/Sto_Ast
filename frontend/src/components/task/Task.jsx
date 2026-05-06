import React, { useState } from 'react'
import TaskComponent from './TaskComponent'
import NavbarComponent from '../shared/Navbar'

export default function Task() {
  const mockupTasks = [
    { name: 'Task 1', asignee: 'John Doe', status: 'To do' },
    { name: 'Task 2', asignee: 'Jane Doe', status: 'In Progress' },
    { name: 'Task 3', asignee: 'John Smith', status: 'Done' },
  ]

  const [tasks, setTasks] = useState(mockupTasks)
  const [draggedTask, setDraggedTask] = useState(null)

  // Handle drop
  const handleDrop = (status) => {
    if (!draggedTask) return

    const updatedTasks = tasks.map(task =>
      task.name === draggedTask.name
        ? { ...task, status }
        : task
    )

    setTasks(updatedTasks)
    setDraggedTask(null)
  }

  // Render column
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
            key={task.name}
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

      <div style={styleSheet.taskContainer}>
        {renderColumn('To do')}
        {renderColumn('In Progress')}
        {renderColumn('Done')}
      </div>
    </div>
  )
}

const styleSheet = {
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
    margin: '10px'
  }
}