// src/App.tsx
import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { Navbar, Nav, Container } from 'react-bootstrap';
import PrivateRoute from './components/PrivateRoute';
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import DashboardAdmin from './pages/Dashboards/DashboardAdmin';
import DashboardEmployee from './pages/Dashboards/DashboardEmployee';
import Home from './pages/Home';
import { useAppSelector } from './hooks';
import 'react-toastify/dist/ReactToastify.css';

const App: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const dashboardPath = useMemo(() => {
    if (!user) return '/';
    switch (user.role) {
      case 'ADMIN':
        return '/dashboard/admin';
      case 'EMPLOYEE':
        return '/dashboard/employee';
      default:
        return '/';
    }
  }, [user]);

  return (
    <Router>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/">School Staff Management</Navbar.Brand>
          <Navbar.Toggle aria-controls="main-navbar-nav" />
          <Navbar.Collapse id="main-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              {!isAuthenticated ? (
                <>
                  <Nav.Link as={Link} to="/login">Login</Nav.Link>
                  <Nav.Link as={Link} to="/register">Register</Nav.Link>
                </>
              ) : (
                <Nav.Link as={Link} to={dashboardPath}>Dashboard</Nav.Link>
              )}
              <Nav.Link as={Link} to="/about">About</Nav.Link>
              <Nav.Link as={Link} to="/contact">Contact</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={
          <Container className="py-5">
            <h2>About Our Platform</h2>
            <p>Learn more about our mission to streamline school staff management.</p>
          </Container>
        } />
        <Route path="/contact" element={
          <Container className="py-5">
            <h2>Contact Us</h2>
            <p>Reach out to us at support@schoolstaff.com.</p>
          </Container>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard/admin" element={
          <PrivateRoute requiredRole="ADMIN">
            <DashboardAdmin />
          </PrivateRoute>
        } />
        <Route path="/dashboard/employee" element={
          <PrivateRoute requiredRole="EMPLOYEE">
            <DashboardEmployee />
          </PrivateRoute>
        } />

        {/* Fallback Routes */}
        <Route path="/unauthorized" element={
          <h2 className="text-center py-5">Access Denied</h2>
        } />
        <Route path="*" element={
          <h2 className="text-center py-5">404 - Page Not Found</h2>
        } />
      </Routes>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </Router>
  );
};

export default App;
