import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Spinner,
  Pagination,
  Badge,
  Alert,
  ListGroup,
  ProgressBar,
} from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAppSelector } from '../../hooks';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import axios, { isAxiosError } from 'axios';
import { FaUserTie, FaUser, FaExchangeAlt, FaCoins, FaHistory } from 'react-icons/fa';

interface Employee {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  staffPoints: number;
  lastLogin?: string;
}

interface Transaction {
  id: number;
  senderId: number;
  recipientId: number;
  amount: number;
  timestamp: string;
  senderName?: string;
  recipientName?: string;
}

interface TransferPointsForm {
  recipientId: number;
  amount: number;
  note?: string;
}

const schema = yup.object({
  recipientId: yup.number().required('Recipient is required').positive().integer(),
  amount: yup.number().required('Amount is required').positive().integer().min(1, 'Amount must be at least 1'),
  note: yup.string().max(100, 'Note must be less than 100 characters').optional(),
});

const API_URL = 'https://backend-g4qt.onrender.com';

export default function DashboardEmployee() {
  const { user } = useAppSelector((state) => state.auth);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState({
    employees: false,
    transactions: false,
    submitting: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const limit = 10;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransferPointsForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      recipientId: 0,
      amount: 100,
      note: '',
    },
  });

  const recipientId = watch('recipientId');
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const setLoadingState = (key: keyof typeof loading, value: boolean) =>
    setLoading((prev) => ({ ...prev, [key]: value }));

  const handleAxiosError = (error: unknown, defaultMessage: string) => {
    if (isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || defaultMessage;
      if (status === 401) {
        toast.error('Unauthorized: Please log in again');
      } else if (status === 400) {
        toast.error(`Bad Request: ${message}`);
      } else {
        toast.error(message);
      }
    } else {
      toast.error(defaultMessage);
    }
  };

  const fetchEmployees = (page = 1, limit = 10) => {
    setLoadingState('employees', true);
    axios
      .get(`${API_URL}/api/users`, { headers, params: { page, limit } })
      .then((response) => {
        setEmployees(response.data.users || []);
        setTotalPages(Math.ceil((response.data.total || 0) / limit));
      })
      .catch((error) => {
        handleAxiosError(error, 'Failed to fetch employees');
        setEmployees([]);
      })
      .finally(() => setLoadingState('employees', false));
  };

  const fetchTransactions = (page: number) => {
    setLoadingState('transactions', true);
    axios
      .get(`${API_URL}/api/transactions/user`, { headers, params: { page, limit } })
      .then((response) => {
        const processedTransactions = response.data.transactions?.map((tx: Transaction) => ({
          ...tx,
          senderName: tx.senderName || 'System',
          recipientName: tx.recipientName || 'Unknown'
        })) || [];
        setTransactions(processedTransactions);
        setTotalPages(Math.ceil(response.data.total / limit));
      })
      .catch((error) => {
        handleAxiosError(error, 'Failed to fetch transactions');
        setTransactions([]);
      })
      .finally(() => setLoadingState('transactions', false));
  };

  const onSubmit = (data: TransferPointsForm) => {
    setLoadingState('submitting', true);
    axios
      .post(`${API_URL}/api/staff-points/transfer`, data, { headers })
      .then(() => {
        toast.success(`Successfully transferred ${data.amount} points`);
        reset();
        fetchEmployees();
        fetchTransactions(currentPage);
      })
      .catch((error) => {
        handleAxiosError(error, 'Failed to transfer points');
      })
      .finally(() => setLoadingState('submitting', false));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const selectUserForTransfer = (employee: Employee) => {
    setSelectedUser(employee);
    setValue('recipientId', employee.id);
  };

  useEffect(() => {
    fetchEmployees(currentPage, limit);
    fetchTransactions(currentPage);
  }, [currentPage, limit]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bank-dashboard bg-light min-vh-100"
      style={{ paddingTop: '80px' }}
    >
      <style>
        {`
          .bank-dashboard {
            font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f8f9fa;
          }
          
          .bank-card {
            border: none;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
          }
          
          .bank-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          }
          
          .bank-card-header {
            background-color: #f8f9fa;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            font-weight: 600;
            padding: 1.25rem 1.5rem;
          }
          
          .bank-primary {
            background-color: #0052cc;
            border-color: #0052cc;
          }
          
          .bank-primary:hover {
            background-color: #003d99;
            border-color: #003d99;
          }
          
          .bank-account-balance {
            font-size: 2rem;
            font-weight: 700;
            color: #0052cc;
          }
          
          .bank-user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #0052cc;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin-right: 12px;
          }

          .bank-user-avatar.small {
            width: 30px;
            height: 30px;
            font-size: 0.8rem;
          }
          
          .bank-transaction-positive {
            color: #28a745;
            font-weight: 600;
          }
          
          .bank-transaction-negative {
            color: #dc3545;
            font-weight: 600;
          }
          
          .bank-user-list-item {
            cursor: pointer;
            transition: background-color 0.2s;
            border-radius: 8px;
            padding: 0.75rem 1rem;
          }
          
          .bank-user-list-item:hover {
            background-color: rgba(0, 82, 204, 0.05);
          }
          
          .bank-user-list-item.active {
            background-color: rgba(0, 82, 204, 0.1);
            border-left: 3px solid #0052cc;
          }
          
          .bank-form-control {
            border-radius: 8px;
            padding: 0.75rem 1rem;
            border: 1px solid #e0e0e0;
          }
          
          .bank-form-control:focus {
            border-color: #0052cc;
            box-shadow: 0 0 0 0.2rem rgba(0, 82, 204, 0.25);
          }
          
          .bank-icon {
            margin-right: 8px;
            color: #0052cc;
          }
          
          @media (max-width: 768px) {
            .bank-dashboard {
              padding-top: 60px;
            }
            
            .bank-card {
              margin-bottom: 1rem;
            }
          }
        `}
      </style>
      
      <Container className="py-4 py-md-5">
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-4 mb-md-5 fw-bold text-dark"
        >
          <FaCoins className="bank-icon" />
          StaffPoints Dashboard
        </motion.h2>

        {/* Balance Overview */}
        <Row className="mb-4 mb-md-5 g-3 g-md-4">
          <Col md={6} lg={4}>
            <Card className="bank-card h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary bg-opacity-10 rounded p-2 me-3">
                    <FaCoins size={24} className="text-primary" />
                  </div>
                  <div>
                    <h6 className="mb-0 text-muted">Your Balance</h6>
                    {user ? (
                      <h3 className="bank-account-balance mb-0">
                        {user.staffPoints?.toLocaleString() || '0'} pts
                      </h3>
                    ) : (
                      <Spinner animation="border" size="sm" />
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={4}>
            <Card className="bank-card h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-success bg-opacity-10 rounded p-2 me-3">
                    <FaExchangeAlt size={24} className="text-success" />
                  </div>
                  <div>
                    <h6 className="mb-0 text-muted">Recent Activity</h6>
                    <h3 className="text-success mb-0">
                      {transactions.length} transactions
                    </h3>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Row className="g-4">
          {/* Transfer Form */}
          <Col lg={6}>
            <Card className="bank-card">
              <Card.Header className="bank-card-header d-flex align-items-center">
                <FaExchangeAlt className="bank-icon" />
                <span>Transfer Points</span>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Recipient</Form.Label>
                        <Form.Control
                          as="select"
                          {...register('recipientId')}
                          className={`bank-form-control ${errors.recipientId ? 'is-invalid' : ''}`}
                          disabled={loading.employees}
                        >
                          <option value="">Select recipient</option>
                          {employees.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name} ({employee.role === 'ADMIN' ? 'Admin' : 'Employee'})
                            </option>
                          ))}
                        </Form.Control>
                        {errors.recipientId && (
                          <div className="invalid-feedback">{errors.recipientId.message}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Amount</Form.Label>
                        <Form.Control
                          type="number"
                          {...register('amount')}
                          className={`bank-form-control ${errors.amount ? 'is-invalid' : ''}`}
                          placeholder="Enter amount"
                        />
                        {errors.amount && (
                          <div className="invalid-feedback">{errors.amount.message}</div>
                        )}
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label>Note (Optional)</Form.Label>
                        <Form.Control
                          as="textarea"
                          {...register('note')}
                          className="bank-form-control"
                          rows={2}
                          placeholder="Add a note about this transfer"
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Button
                        variant="primary"
                        type="submit"
                        className="bank-primary w-100"
                        disabled={loading.submitting}
                      >
                        {loading.submitting ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          <>
                            <FaExchangeAlt className="me-2" />
                            Transfer Points
                          </>
                        )}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          {/* Recent Transactions */}
          <Col lg={6}>
            <Card className="bank-card h-100">
              <Card.Header className="bank-card-header d-flex align-items-center">
                <FaHistory className="bank-icon" />
                <span>Recent Transactions</span>
                <Badge bg="light" text="dark" className="ms-auto">
                  Page {currentPage} of {totalPages}
                </Badge>
              </Card.Header>
              <Card.Body className="p-0">
                {loading.transactions ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <>
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Table hover className="align-middle mb-0">
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                          <tr>
                            <th>From/To</th>
                            <th>Amount</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map((tx) => {
                            const isSender = tx.senderId === user?.id;
                            const counterpartyName = isSender ? tx.recipientName : tx.senderName;
                            const counterpartyInitial = counterpartyName?.charAt(0)?.toUpperCase() || '?';
                            
                            return (
                              <tr key={tx.id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className={`bank-user-avatar small ${isSender ? 'bg-danger' : 'bg-success'}`}>
                                      {counterpartyInitial}
                                    </div>
                                    <div>
                                      <div className="fw-medium">{isSender ? 'To' : 'From'}</div>
                                      <div className="text-muted small">{counterpartyName}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className={isSender ? 'bank-transaction-negative' : 'bank-transaction-positive'}>
                                  {isSender ? '-' : '+'}{tx.amount.toLocaleString()} pts
                                </td>
                                <td>
                                  {new Date(tx.timestamp).toLocaleDateString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </Table>
                    </div>
                    <div className="d-flex justify-content-center mt-3 p-3">
                      <Pagination>
                        <Pagination.Prev
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        />
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                          <Pagination.Item
                            key={i + 1}
                            active={i + 1 === currentPage}
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </motion.div>
  );
}