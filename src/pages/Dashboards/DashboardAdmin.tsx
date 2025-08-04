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
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import axios, { isAxiosError } from 'axios';
import { FaUserTie, FaUser, FaExchangeAlt, FaCoins, FaHistory, FaChartLine } from 'react-icons/fa';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  staffPoints: number | null;
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

interface AdminBalance {
  availablePoints: number;
  allocatedPoints: number;
  totalTransactions: number;
}

const schema = yup.object().shape({
  recipientId: yup.number().required('Recipient is required').positive().integer(),
  amount: yup.number().required('Amount is required').positive().integer().min(1, 'Amount must be at least 1'),
  note: yup.string().max(100, 'Note must be less than 100 characters').optional(),
});

const API_URL = 'https://backend-g4qt.onrender.com';

export default function DashboardAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<AdminBalance | null>(null);
  const [loading, setLoading] = useState({
    users: false,
    transactions: false,
    balance: false,
    submitting: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const limit = 10;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      recipientId: 0,
      amount: 100,
      note: '',
    },
  });

  const recipientId = watch('recipientId');

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

  const fetchUsers = (page = 1, limit = 10) => {
    setLoadingState('users', true);
    axios
      .get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { page, limit },
      })
      .then((response) => {
        const allUsers = [...(response.data.admins || []), ...(response.data.users || [])];
        setUsers(allUsers);
        setTotalPages(Math.ceil((response.data.total || 0) / limit));
      })
      .catch((error) => {
        handleAxiosError(error, 'Failed to fetch users');
        setUsers([]);
      })
      .finally(() => setLoadingState('users', false));
  };

  const fetchTransactions = (page: number) => {
    setLoadingState('transactions', true);
    axios
      .get(`${API_URL}/api/transactions?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
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

  const fetchAdminBalance = () => {
    setLoadingState('balance', true);
    axios
      .get(`${API_URL}/api/admin/balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setBalance({
          availablePoints: Math.floor(Number(response.data.availablePoints)),
          allocatedPoints: Math.floor(Number(response.data.allocatedPoints)),
          totalTransactions: response.data.totalTransactions || 0,
        });
      })
      .catch((error) => {
        handleAxiosError(error, 'Failed to fetch balance');
        setBalance(null);
      })
      .finally(() => setLoadingState('balance', false));
  };

  useEffect(() => {
    fetchUsers(currentPage, limit);
    fetchTransactions(currentPage);
    fetchAdminBalance();
  }, [currentPage, limit]);

  const onSubmit = (data: any) => {
    setLoadingState('submitting', true);
    axios
      .post(`${API_URL}/api/staff-points/allocate`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(() => {
        toast.success(`Successfully transferred ${data.amount} points`);
        reset();
        fetchUsers();
        fetchAdminBalance();
        fetchTransactions(currentPage);
      })
      .catch((error) => {
        handleAxiosError(error, 'Failed to allocate points');
      })
      .finally(() => setLoadingState('submitting', false));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const initializeAdminPoints = () => {
    setLoadingState('submitting', true);
    axios
      .post(`${API_URL}/api/admin/points/initialize`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(() => {
        toast.success('Admin points initialized successfully');
        fetchUsers();
        fetchAdminBalance();
      })
      .catch((error) => {
        handleAxiosError(error, 'Failed to initialize admin points');
      })
      .finally(() => setLoadingState('submitting', false));
  };

  const selectUserForTransfer = (user: User) => {
    setSelectedUser(user);
    setValue('recipientId', user.id);
  };

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
          
          .bank-secondary {
            background-color: #6c757d;
            border-color: #6c757d;
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
          
          .bank-sidebar {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            padding: 1.5rem;
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
          StaffPoints Banking Dashboard
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
                    <h6 className="mb-0 text-muted">Available Balance</h6>
                    {loading.balance ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <h3 className="bank-account-balance mb-0">
                        {balance?.availablePoints?.toLocaleString() || '0'} pts
                      </h3>
                    )}
                  </div>
                </div>
                <ProgressBar
                  now={balance ? (balance.availablePoints / (balance.availablePoints + balance.allocatedPoints)) * 100 : 0}
                  variant="primary"
                  className="mt-3"
                  style={{ height: '6px' }}
                />
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
                    <h6 className="mb-0 text-muted">Allocated Points</h6>
                    {loading.balance ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <h3 className="text-success mb-0">
                        {balance?.allocatedPoints?.toLocaleString() || '0'} pts
                      </h3>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">Total distributed to staff</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={6} lg={4}>
            <Card className="bank-card h-100">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div className="bg-info bg-opacity-10 rounded p-2 me-3">
                    <FaHistory size={24} className="text-info" />
                  </div>
                  <div>
                    <h6 className="mb-0 text-muted">Total Transactions</h6>
                    {loading.balance ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <h3 className="text-info mb-0">
                        {balance?.totalTransactions?.toLocaleString() || '0'}
                      </h3>
                    )}
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">All time transactions</small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Main Content */}
        <Row className="g-4">
          {/* User List and Transfer Form */}
          <Col lg={4}>
            <Card className="bank-card h-100">
              <Card.Header className="bank-card-header d-flex align-items-center">
                <FaUserTie className="bank-icon" />
                <span>Staff Directory</span>
                <Badge bg="light" text="dark" className="ms-auto">
                  {users.length} users
                </Badge>
              </Card.Header>
              <Card.Body className="p-0">
                {loading.users ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {users.map((user) => (
                      <ListGroup.Item
                        key={user.id}
                        className={`bank-user-list-item ${recipientId === user.id ? 'active' : ''}`}
                        onClick={() => selectUserForTransfer(user)}
                      >
                        <div className="d-flex align-items-center">
                          <div className="bank-user-avatar">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h6 className="mb-0">{user.name}</h6>
                            <small className="text-muted">
                              {user.role === 'ADMIN' ? (
                                <Badge bg="primary" pill>Admin</Badge>
                              ) : (
                                <Badge bg="secondary" pill>Employee</Badge>
                              )}{' '}
                              • {user.email}
                            </small>
                          </div>
                          <div className="ms-auto text-end">
                            <strong>{user.staffPoints?.toLocaleString() || '0'} pts</strong>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Transfer Form and Recent Transactions */}
          <Col lg={8}>
            <Row className="g-4">
              <Col xs={12}>
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
                              disabled={loading.users}
                            >
                              <option value="">Select recipient</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name} ({user.role === 'ADMIN' ? 'Admin' : 'Employee'})
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
                          <div className="d-flex justify-content-between align-items-center">
                            <Button
                              variant="primary"
                              type="submit"
                              className="bank-primary"
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
                            <Button
                              variant="outline-primary"
                              onClick={initializeAdminPoints}
                              disabled={loading.submitting}
                            >
                              {loading.submitting ? (
                                <Spinner size="sm" animation="border" />
                              ) : (
                                'Initialize Points'
                              )}
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>

              <Col xs={12}>
                <Card className="bank-card">
                  <Card.Header className="bank-card-header d-flex align-items-center">
                    <FaHistory className="bank-icon" />
                    <span>Recent Transactions</span>
                    <Badge bg="light" text="dark" className="ms-auto">
                      Page {currentPage} of {totalPages}
                    </Badge>
                  </Card.Header>
                  <Card.Body>
                    {loading.transactions ? (
                      <div className="text-center py-5">
                        <Spinner animation="border" variant="primary" />
                      </div>
                    ) : (
                      <>
                        <div className="table-responsive">
                          <Table hover className="align-middle">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Amount</th>
                                <th>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {transactions.map((tx) => {
                                const senderInitial = tx.senderName?.charAt(0)?.toUpperCase() || 'S';
                                const recipientInitial = tx.recipientName?.charAt(0)?.toUpperCase() || 'R';
                                
                                return (
                                  <tr key={tx.id}>
                                    <td>{tx.id}</td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="bank-user-avatar small">
                                          {senderInitial}
                                        </div>
                                        {tx.senderName}
                                      </div>
                                    </td>
                                    <td>
                                      <div className="d-flex align-items-center">
                                        <div className="bank-user-avatar small">
                                          {recipientInitial}
                                        </div>
                                        {tx.recipientName}
                                      </div>
                                    </td>
                                    <td className={tx.amount > 0 ? 'bank-transaction-positive' : 'bank-transaction-negative'}>
                                      {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} pts
                                    </td>
                                    <td>
                                      {new Date(tx.timestamp).toLocaleString()}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </Table>
                        </div>
                        <div className="d-flex justify-content-center mt-3">
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
          </Col>
        </Row>
      </Container>
    </motion.div>
  );
}