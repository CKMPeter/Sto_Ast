import React from 'react'

export function TaskLog({ taskLog }) {

  return (
    <div style={styleSheet.taskLogContainer}>

      <h2>Task Log</h2>

      {taskLog.length > 0 ? (

        <ul style={styleSheet.list}>

          {taskLog.map((log, index) => (

            <li
              key={log.id || index}
              style={styleSheet.logItem}
            >

              <div>
                <strong>
                  {log.action}
                </strong>
              </div>

              <div>
                {log.message}
              </div>

              {log.progress !== undefined && (
                <div>
                  Progress: {log.progress}%
                </div>
              )}

              {log.updatedFields && (
                <div>
                  Updated Fields:
                  {' '}
                  {JSON.stringify(
                    log.updatedFields
                  )}
                </div>
              )}

              <div style={styleSheet.date}>

                {log.createdAt?.seconds
                  ? new Date(
                      log.createdAt.seconds * 1000
                    ).toLocaleString()
                  : 'No date'}

              </div>

            </li>

          ))}

        </ul>

      ) : (

        <div>
          <p>No logs available yet.</p>
        </div>

      )}

    </div>
  )
}

const styleSheet = {

  taskLogContainer: {
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '5px',
    border: '1px solid #ddd',
    height: '400px',
    overflowY: 'auto',
    width: '20%'
  },

  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },

  logItem: {
    padding: '10px',
    marginBottom: '10px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '5px'
  },

  date: {
    marginTop: '5px',
    fontSize: '12px',
    color: '#666'
  }
}