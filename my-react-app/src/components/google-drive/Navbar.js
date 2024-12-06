import React from 'react'
import {Navbar, Nav} from 'react-bootstrap'
import { Link } from 'react-router-dom'

export default function NavbarComponent() {
  return (
    <Navbar bg="light" expand="sm">
        <Navbar.Brand as={Link} to = "/" style={{fontSize: '2rem', fontWeight: 'bold', marginLeft: '10px'}}>
            MY DRIVE
        </Navbar.Brand>
        <Nav className="ms-auto" >
            <Nav.Link as = {Link} to="/user" style={{fontSize: '1rem'}}>
                Profile
            </Nav.Link>
        </Nav>
    </Navbar>
  )
}
