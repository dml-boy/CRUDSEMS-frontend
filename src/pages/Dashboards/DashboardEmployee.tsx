import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAppSelector } from '../../hooks';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../Home.css';

interface Employee {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  staffPoints: number;
}

interface TransferPointsForm {
  recipientId: number;
  amount: number;
}

const schema = yup.object({
  recipientId: yup.number().required('Recipient is required').positive().integer(),
  amount: yup.number().required('Amount is required').positive().integer().min(1, 'Amount must be at least 1'),
});

export default function DashboardEmployee() {
  const { user } = useAppSelector((state) => state.auth);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserData, setCurrentUserData] = useState<Employee | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferPointsForm>({ resolver: yupResolver(schema) });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const res = await axios.get<Employee[]>('http://localhost:3000/api/users', { headers });
      const otherEmployees = res.data.filter((e) => e.id !== user?.id);
      const current = res.data.find((e) => e.id === user?.id) || null;
      setEmployees(otherEmployees);
      setCurrentUserData(current);
    } catch {
      toast.error('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => setLoading(false);
  }, [user]);

  const onSubmit = async (data: TransferPointsForm) => {
    try {
      await axios.post(
        'http://localhost:3000/api/staff-points/transfer',
        { ...data, senderId: user?.id },
        { headers }
      );
      toast.success('Points transferred successfully');
      reset();
      fetchData(); // Refresh balance
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to transfer points');
    }
  };

  if (loading || !currentUserData) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
      className="homepage"
    >
      <Container className="py-5">
        {/* Dashboard Heading */}
        <motion.h2
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-4 fw-bold text-primary"
        >
          Welcome, {currentUserData.name}
        </motion.h2>

        {/* Points Balance */}
        <Row className="justify-content-center mb-5">
          <Col md={6}>
            <Card className="text-center shadow border-0">
              <Card.Body>
                <Card.Title className="fs-4 fw-semibold">Your StaffPoints Balance</Card.Title>
                <h3 className="text-success fw-bold display-6">{currentUserData.staffPoints}</h3>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Transfer Form */}
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="shadow border-0">
              <Card.Body>
                <Card.Title className="text-primary fw-semibold mb-4">Transfer StaffPoints</Card.Title>
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-3">
                    <Form.Label>Select Recipient</Form.Label>
                    <Form.Select {...register('recipientId')} isInvalid={!!errors.recipientId}>
                      <option value="">Select an employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.email})
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.recipientId?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Points Amount</Form.Label>
                    <Form.Control
                      type="number"
                      {...register('amount')}
                      placeholder="Enter points to transfer"
                      isInvalid={!!errors.amount}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.amount?.message}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Button variant="primary" type="submit" className="cta-button w-100">
                    Transfer Points
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </motion.div>
  );
}
