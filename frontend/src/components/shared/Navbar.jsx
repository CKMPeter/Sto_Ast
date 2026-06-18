import React, { useState, useRef, useEffect } from "react";
import { Navbar, Nav, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useDarkMode } from "../../hooks/useDarkMode";
import { useScheduleRealtime } from "../../hooks/scheduleHook/useScheduleRealtime";
import { FaSun, FaMoon } from "react-icons/fa";
import Notification from "./Notification";

export default function NavbarComponent() {
  const { darkMode, toggleDarkMode, loading } = useDarkMode();

  const [showNotification, setShowNotification] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);

  const notificationRef = useRef(null);

  const eventList = useScheduleRealtime();

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 991);
    }

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
      bg={darkMode ? "dark" : "light"}
      variant={darkMode ? "dark" : "light"}
      expand="lg"
      className="px-3"
      style={styleSheet.navbar}
    >
      <Navbar.Brand as={Link} to="/" style={styleSheet.brand}>
        <h1
          className={`app-title ${darkMode ? "dark" : "light"}`}
          style={{
            ...styleSheet.title,
            ...(isMobile ? styleSheet.titleMobile : {}),
          }}
        >
          <span>Sto</span>
          <span>rage</span>&<span>As</span>
          <span>sis</span>
          <span>t</span>
          <span>ance</span>
        </h1>
      </Navbar.Brand>

      <Navbar.Toggle aria-controls="main-navbar" />

      <Navbar.Collapse id="main-navbar">
        <Nav
          className="ms-auto"
          style={{
            ...styleSheet.navContainer,
            ...(isMobile ? styleSheet.navContainerMobile : {}),
          }}
        >
          <Nav.Link as={Link} to="/" style={styleSheet.link}>
            Storage
          </Nav.Link>

          <Nav.Link as={Link} to="/message" style={styleSheet.link}>
            Message
          </Nav.Link>

          <Nav.Link as={Link} to="/schedule" style={styleSheet.link}>
            Schedule
          </Nav.Link>

          <Nav.Link as={Link} to="/task" style={styleSheet.link}>
            Task
          </Nav.Link>

          <Nav.Link as={Link} to="/user" style={styleSheet.link}>
            Profile
          </Nav.Link>

          <div
            ref={notificationRef}
            style={{
              ...styleSheet.notificationWrapper,
              ...(isMobile ? styleSheet.notificationWrapperMobile : {}),
            }}
          >
            <Nav.Link
              style={styleSheet.link}
              onClick={() => setShowNotification((prev) => !prev)}
            >
              Notification
            </Nav.Link>

            {showNotification && (
              <div
                style={{
                  ...styleSheet.popup,
                  ...(darkMode ? styleSheet.popupDark : {}),
                  ...(isMobile ? styleSheet.popupMobile : {}),
                }}
              >
                <Notification eventList={eventList} />
              </div>
            )}
          </div>

          <div
            style={{
              ...styleSheet.darkModeContainer,
              ...(isMobile ? styleSheet.darkModeContainerMobile : {}),
            }}
          >
            <FaSun
              style={{
                color: !darkMode ? "#f39c12" : "#ccc",
                fontSize: "1.2rem",
                marginRight: "0.4rem",
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
                color: darkMode ? "#f1c40f" : "#ccc",
                fontSize: "1.2rem",
                marginLeft: "0.4rem",
              }}
            />
          </div>
        </Nav>
      </Navbar.Collapse>
    </Navbar>
  );
}

const styleSheet = {
  navbar: {
    minHeight: "72px",
    zIndex: 1000,
  },

  brand: {
    maxWidth: "70%",
    overflow: "hidden",
  },

  title: {
    margin: 0,
    padding: 0,
    fontSize: "60px",
  },

  titleMobile: {
    fontSize: "30px",
  },

  navContainer: {
    display: "flex",
    alignItems: "center",
  },

  navContainerMobile: {
    alignItems: "flex-start",
    flexDirection: "column",
    width: "100%",
    paddingTop: "1rem",
  },

  link: {
    fontSize: "1rem",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },

  notificationWrapper: {
    position: "relative",
    marginRight: "1rem",
    cursor: "pointer",
  },

  notificationWrapperMobile: {
    width: "100%",
    marginRight: 0,
  },

  popup: {
    position: "absolute",
    top: "35px",
    right: 0,
    width: "300px",
    maxHeight: "400px",
    overflowY: "auto",
    background: "#ffffff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    padding: "0.5rem",
    zIndex: 4000,
  },

  popupDark: {
    background: "#1e1e1e",
    color: "#ffffff",
    border: "1px solid #444",
  },

  popupMobile: {
    position: "static",
    width: "100%",
    maxHeight: "300px",
    marginTop: "0.5rem",
  },

  darkModeContainer: {
    display: "flex",
    alignItems: "center",
    marginLeft: "1rem",
    marginRight: "0.5rem",
  },

  darkModeContainerMobile: {
    marginLeft: 0,
    marginTop: "1rem",
    paddingBottom: "0.5rem",
  },
};