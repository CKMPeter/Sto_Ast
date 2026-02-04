import React from 'react';
import { Navbar, Nav, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDarkMode } from '../../hooks/useDarkMode';
import { FaSun, FaMoon } from 'react-icons/fa';

export default function NavbarComponent() {
  const { darkMode, toggleDarkMode, loading } = useDarkMode();

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
        <Nav.Link
          as={Link}
          to="/user"
          style={{ fontSize: '1rem', fontWeight: 'bold' }}
        >
          Profile
        </Nav.Link>

        {/* Sun/Moon Switch */}
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
