import React from 'react';
import { Navbar, Nav, Form } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useDarkMode } from '../../hooks/useDarkMode'; // make sure the path is correct

export default function NavbarComponent() {
  const { darkMode, toggleDarkMode, loading} = useDarkMode();
  
  if (loading) return null; // ⛔ avoid flicker on initial load
  return (
    <Navbar bg={darkMode ? 'dark' : 'light'} variant={darkMode ? 'dark' : 'light'} expand="sm">
      <Navbar.Brand
        as={Link}
        to="/"
        style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginLeft: '10px',
        }}
      >
        <div>
          <h1 className='app-title'>
            <span>Sto</span><span>rage</span>
            &
            <span>As</span><span>sis</span>
            <span>t</span><span>ance</span>
          </h1>
        </div>
      </Navbar.Brand>
      <Nav className="ms-auto d-flex align-items-center">
        <Nav.Link as={Link} to="/user" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
          Profile
        </Nav.Link>
        <Form.Check
          type="switch"
          id="dark-mode-switch"
          label={darkMode ? 'Dark' : 'Light'}
          checked={darkMode}
          onChange={toggleDarkMode}
          className="ms-3"
          style={{fontSize: '1rem', fontWeight: 'bold', marginRight: '10px'}}
        />
      </Nav>
    </Navbar>
  );
}
