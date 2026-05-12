import React from 'react'

export default function TaskListComponent({ tasks }) {
  return (
    <div>
      {tasks.map(task => (
        <div key={task.name} style={{ margin: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', width: '200px' }}>
          <h3>{task.name}</h3>
          <p>Group: {task.group}</p>
          <p>Progress: {task.progress}%</p>
        </div>
      ))}
    </div>
  )
}

