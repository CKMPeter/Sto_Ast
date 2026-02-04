import React from 'react';
import Navbar  from '../shared/Navbar';
import FriendBox from './FriendBox';
import { styled } from "@mui/material/styles";

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
                  <FriendBox name={friend.name} photoURL={friend.photoURL} uid={friend.uid} />
                ))}
                </ul>
            </div>

            <div className="flex-grow-1 mt-5">
                <ChatBox
                  className="border p-3"
                >
                  <MessageContainer>
                    <p><strong>Alice:</strong> Hi there!</p>
                  </MessageContainer>
                  <MessageContainer>
                    <p><strong>You:</strong> Hello, Alice! How are you?</p>
                  </MessageContainer>
                  <MessageContainer>
                    <p><strong>Alice:</strong> I'm good, thanks! Just wanted to check in.</p>
                  </MessageContainer>

                </ChatBox>

                <div>
                  <input
                    type="text"
                    className="form-control mt-3"
                    placeholder="Type your message..."
                  />
                </div>
            </div>
        </div>
    </div>
  )
}
const ChatBox = styled("div")(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  height: "60vh",
  overflowY: "auto",
  padding: theme.spacing(2),
}));
const MessageContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));