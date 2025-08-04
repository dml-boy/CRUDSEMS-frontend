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
const API_URL = 'https://backend-g4qt.onrender.com';

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
          {/* Welcome, {currentUserData.name} */}
        </motion.h2>

        {/* Points Balance */}
        <Row className="justify-content-center mb-5">
          <Col md={6}>
            <Card className="text-center shadow border-0">
              <Card.Body>
                <Card.Title className="fs-4 fw-semibold">Your StaffPoints Balance</Card.Title>
                {/* <h3 className="text-success fw-bold display-6">{currentUserData.staffPoints}</h3> */}
              </Card.Body>
            </Card>
          </Col>
        </Row>

   

      </Container>
    </motion.div>
  );
}
