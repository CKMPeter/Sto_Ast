import React from 'react'

export default function FriendBox({ name, photoURL, uid }) {
  return (
    <div className="friend-box" style={styles.friendBox} key={uid}>
      <img src={photoURL} alt={name} className="friend-photo" style={styles.friendPhoto} />
      <div className="friend-name" style={styles.friendName}>{name}</div>
    </div>
  )
}

const styles = {
  friendBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    borderBottom: '1px solid #ccc',
    cursor: 'pointer',
  },
  friendPhoto: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    marginRight: '10px',
  },
  friendName: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
}
