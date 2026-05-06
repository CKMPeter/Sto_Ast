import React from 'react'

export default function TaskComponent({ task, onDragStart }) {
  return (
    <div
      style={styleSheet.taskComponent}
      draggable
      onDragStart={() => onDragStart(task)}
    >
      <h3>{task.name}</h3>
      <p>Asignee: {task.asignee}</p>
    </div>
  )
}

const styleSheet = {
  taskComponent: {
    border: '1px solid #ccc',
    padding: '10px',
    margin: '10px 0',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
    cursor: 'grab'
  }
}