import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Nav, Navbar, Button } from 'react-bootstrap';
import './MainNavbar.css';

export default function MainNavbar() {
  return (
    <Navbar expand="lg" className="main-navbar py-2">
      <Container>
        <Navbar.Brand as={Link} to="/" className="fw-bold text-white">
          🏫 School Manager
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" className="bg-white" />
        <Navbar.Collapse id="main-navbar-nav" className="justify-content-end">
          <Nav className="align-items-center gap-2">
            <Nav.Link as={Link} to="/" className="nav-link-custom">
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/login" className="nav-link-custom">
              Login
            </Nav.Link>
            <Button
              as={Link}
              to="/register"
              variant="light"
              size="sm"
              className="px-3 rounded-pill fw-semibold"
            >
              Register
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
