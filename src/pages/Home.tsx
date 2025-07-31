import React from 'react';
import { Container, Row, Col, Button, Card, Nav } from 'react-bootstrap';
import { motion } from 'framer-motion';
import './Home.css';

interface Feature {
  icon: string;
  title: string;
  text: string;
}

export default function Home() {
  const features: Feature[] = [
    {
      icon: '👤',
      title: 'Employee Management',
      text: 'Easily manage staff data, assign roles, and track performance all in one secure dashboard.',
    },
    {
      icon: '📅',
      title: 'Leave Automation',
      text: 'Streamline leave requests with automated approval workflows and real-time tracking.',
    },
    {
      icon: '📊',
      title: 'Personalized Dashboards',
      text: 'Deliver role-specific dashboards for admins and employees with relevant tools.',
    },
  ];

  const benefits = [
    { title: 'Boost Efficiency', text: 'Automate manual processes to save admin time.' },
    { title: 'Ironclad Security', text: 'All data is protected using encrypted JWT sessions.' },
    { title: 'Sleek UX', text: 'Built for simplicity — no training required.' },
    { title: 'Data-Driven', text: 'Real-time metrics help you make smarter decisions.' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
      {/* Hero Section */}
      <section className="bg-light py-5 overflow-hidden position-relative">
        <Container className="position-relative z-1">
          <Row className="align-items-center">
            <Col md={6}>
              <motion.h1
                className="display-4 fw-bold mb-3 text-primary"
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                Reinventing Staff Management for Schools
              </motion.h1>
              <motion.p
                className="lead text-muted mb-4"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Smarter tools to manage employee records, leave workflows, and real-time dashboards.
              </motion.p>
              <motion.div
                className="d-flex gap-3 flex-wrap"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <Button href="/register" size="lg" variant="primary" className="px-4">
                  Get Started
                </Button>
                <Button href="/login" size="lg" variant="outline-primary" className="px-4">
                  Login
                </Button>
              </motion.div>
            </Col>
            <Col md={6} className="d-none d-md-block text-end">
              <motion.img
                src="https://img.freepik.com/free-vector/teacher-concept-illustration_114360-7735.jpg"
                alt="Staff Management Illustration"
                className="img-fluid rounded-4 shadow"
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.7 }}
              />
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-white">
        <Container>
          <motion.h2
            className="text-center fw-bold mb-5"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Core Features
          </motion.h2>
          <Row className="g-4">
            {features.map((feature, index) => (
              <Col md={4} key={index}>
                <motion.div
                  className="text-center bg-light rounded-4 h-100 p-4 shadow-sm border feature-card"
                  whileHover={{ scale: 1.03 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.2 }}
                >
                  <div className="fs-1 mb-3">{feature.icon}</div>
                  <h5 className="fw-semibold text-primary">{feature.title}</h5>
                  <p className="text-muted">{feature.text}</p>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="py-5 bg-light">
        <Container>
          <motion.h2
            className="text-center fw-bold mb-5"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Why Schools Choose Us
          </motion.h2>
          <Row className="g-4">
            {benefits.map((b, i) => (
              <Col md={6} lg={3} key={i}>
                <motion.div
                  className="bg-white rounded-4 p-4 h-100 shadow-sm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                >
                  <h6 className="fw-bold text-primary mb-2">{b.title}</h6>
                  <p className="text-muted small">{b.text}</p>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-5 bg-primary text-white text-center">
        <Container>
          <motion.h2
            className="fw-bold mb-3"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            Revolutionize Your School Operations
          </motion.h2>
          <motion.p
            className="text-white-50 mb-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Set up a smarter system in just minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button href="/register" size="lg" variant="light" className="text-primary fw-bold px-4">
              Get Started
            </Button>
          </motion.div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white pt-5 pb-3">
        <Container>
          <Row>
            <Col md={4} className="mb-4">
              <h6 className="fw-bold">About</h6>
              <p className="text-white-50 small">
                We simplify school staff operations with secure, efficient, and user-friendly software.
              </p>
            </Col>
            <Col md={4} className="mb-4">
              <h6 className="fw-bold">Links</h6>
              <Nav className="flex-column">
                <Nav.Link href="/register" className="text-white-50 p-0 mb-2">Register</Nav.Link>
                <Nav.Link href="/login" className="text-white-50 p-0 mb-2">Login</Nav.Link>
                <Nav.Link href="/about" className="text-white-50 p-0 mb-2">About</Nav.Link>
                <Nav.Link href="/contact" className="text-white-50 p-0">Contact</Nav.Link>
              </Nav>
            </Col>
            <Col md={4}>
              <h6 className="fw-bold">Contact</h6>
              <p className="text-white-50 small mb-1">Email: support@schoolstaff.com</p>
              <p className="text-white-50 small">Phone: (123) 456-7890</p>
            </Col>
          </Row>
          <hr className="border-secondary" />
          <Row>
            <Col className="text-center text-white-50 small">
              &copy; {new Date().getFullYear()} School Staff Management. All rights reserved.
            </Col>
          </Row>
        </Container>
      </footer>
    </motion.div>
  );
}
