import React from 'react'

export default function FriendBox({ name, photoURL, uid }) {
  return (
    <div className="friend-box">
      <img src={photoURL} alt={name} className="friend-photo" />
      <div className="friend-name">{name}</div>
    </div>
  )
}
