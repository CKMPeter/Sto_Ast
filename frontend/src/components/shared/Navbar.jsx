import React, { useState, useRef, useEffect } from 'react';
import { Navbar, Nav, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useScheduleRealtime } from '../../hooks/scheduleHook/useScheduleRealtime';
import { FaSun, FaMoon } from 'react-icons/fa';
import Notification from './Notification'; // ✅ FIXED PATH

export default function NavbarComponent() {
  const { darkMode, toggleDarkMode, loading } = useDarkMode();

  const [showNotification, setShowNotification] = useState(false);
  const notificationRef = useRef(null);

  // 🔹 temporary dummy data (you'll replace later)
  // const dummyEvents = [
  //   { id: 1, title: "Gym", start: 480 },
  //   { id: 2, title: "Study", start: 600 }
  // ];  

  const eventList = useScheduleRealtime();

  // ❌ Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotification(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return null;

  return (
    <Navbar
      bg={darkMode ? 'dark' : 'light'}
      variant={darkMode ? 'dark' : 'light'}
      expand="sm"
      className="px-3"
    >
      <Navbar.Brand
        as={Link}
        to="/"
        style={{ fontSize: '2rem', fontWeight: 'bold' }}
      >
        <h1 className={`app-title ${darkMode ? 'dark' : 'light'}`}>
          <span>Sto</span><span>rage</span>
          &<span>As</span><span>sis</span><span>t</span><span>ance</span>
        </h1>
      </Navbar.Brand>

      <Nav className="ms-auto d-flex align-items-center">

        <Nav.Link as={Link} to="/" style={style.link}>
          Storage
        </Nav.Link>

        <Nav.Link as={Link} to="/message" style={style.link}>
          Message
        </Nav.Link>

        <Nav.Link as={Link} to="/Schedule" style={style.link}>
          Schedule
        </Nav.Link>

        <Nav.Link as={Link} to="/user" style={style.link}>
          Profile
        </Nav.Link>

        {/* 🔔 Notification Bell */}
        <div style={style.notificationWrapper} ref={notificationRef}>
          <Nav.Link style={style.link}
            onClick={() => setShowNotification(prev => !prev)}
          >
            Notification
          </Nav.Link>

          {showNotification && (
            <div style={style.popup}>
              <Notification eventList={eventList} />
            </div>
          )}
        </div>

        {/* 🌙 Dark Mode Switch */}
        <div className="d-flex align-items-center ms-3 me-2">
          <FaSun
            style={{
              color: !darkMode ? '#f39c12' : '#ccc',
              fontSize: '1.2rem',
              marginRight: '0.4rem',
            }}
          />

          <Form.Check
            type="switch"
            id="dark-mode-switch"
            checked={darkMode}
            onChange={toggleDarkMode}
            className="custom-switch"
            style={{ marginBottom: 0 }}
          />

          <FaMoon
            style={{
              color: darkMode ? '#f1c40f' : '#ccc',
              fontSize: '1.2rem',
              marginLeft: '0.4rem',
            }}
          />
        </div>

      </Nav>
    </Navbar>
  );
}

const style = {
  link: {
    fontSize: '1rem',
    fontWeight: 'bold'
  },

  notificationWrapper: {
    position: "relative",
    marginRight: "1rem",
    cursor: "pointer"
  },

  bell: {
    fontSize: "1.3rem"
  },

  popup: {
    position: "absolute",
    top: "35px",
    right: 0,
    width: "300px",
    maxHeight: "400px",
    overflowY: "auto",
    background: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    padding: "0.5rem",
    zIndex: 2000
  }
};