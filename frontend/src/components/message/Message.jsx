import React from 'react';
import Navbar  from '../shared/Navbar';
import FriendBox from './FriendBox';

const list = [
  { name: 'Alice', photoURL: 'https://via.placeholder.com/50', uid: '1' },
  { name: 'Bob', photoURL: 'https://via.placeholder.com/50', uid: '2' },
  { name: 'Charlie', photoURL: 'https://via.placeholder.com/50', uid: '3' },
];

export function Message() {
  return (
    <div>
        <Navbar />
        <div className="container-fluid mt-4 d-flex flex-row gap-4">
            <div style={{ minWidth: "220px" }}>
                <h1>Friend List</h1>
                <ul>
                {list.map((friend) => (
                  <li key={friend.uid}>
                    <FriendBox name={friend.name} photoURL={friend.photoURL} uid={friend.uid} />
                  </li>
                ))}
                </ul>
            </div>

            <div className="flex-grow-1 mt-5">
                <h2>Chat Window</h2>
                <div
                className="border p-3"
                style={{ height: "300px", overflowY: "scroll" }}
                >
                <p><strong>Alice:</strong> Hi there!</p>
                <p><strong>You:</strong> Hello! How are you?</p>
                <p><strong>Alice:</strong> I'm good, thanks for asking.</p>
                </div>

                <input
                type="text"
                className="form-control mt-3"
                placeholder="Type your message..."
                />
            </div>
        </div>
    </div>
  )
}

