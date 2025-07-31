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
} from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import axios, { isAxiosError } from 'axios';

interface Employee {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
  staffPoints: number;
}

interface Transaction {
  id: number;
  senderId: number;
  recipientId: number;
  amount: number;
  timestamp: string;
}

interface AllocatePointsForm {
  recipientId: number;
  amount: number;
}

interface AdminBalance {
  availablePoints: number;
  allocatedPoints: number;
}

const schema = yup.object().shape({
  recipientId: yup.number().required('Recipient is required').positive().integer(),
  amount: yup.number().required('Amount is required').positive().integer().min(1, 'Amount must be at least 1'),
});

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export default function DashboardAdmin() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [admins, setAdmins] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<AdminBalance | null>(null);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdmins, setShowAdmins] = useState(false);
  const limit = 10;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AllocatePointsForm>({
    resolver: yupResolver(schema),
  });

  const handleAxiosError = (error: unknown, defaultMessage: string) => {
    if (isAxiosError(error)) {
      toast.error(error.response?.data?.message || defaultMessage);
    } else {
      toast.error(defaultMessage);
    }
  };

  const fetchEmployees = (page = 1, limit = 10) => {
    setIsLoadingEmployees(true);
    axios
      .get(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { page, limit },
      })
      .then((response) => {
        console.log('fetchEmployees response:', response.data);
        const users = response.data.users
          ? Array.isArray(response.data.users)
            ? response.data.users
            : []
          : Array.isArray(response.data)
            ? response.data
            : [];
        setEmployees(users);
        setTotalPages(Math.ceil(response.data.total / limit));
      })
      .catch((error) => {
        console.error('fetchEmployees error:', error);
        handleAxiosError(error, 'Failed to fetch employees');
        setEmployees([]);
      })
      .finally(() => setIsLoadingEmployees(false));
  };

  const fetchAdmins = () => {
    setIsLoadingAdmins(true);
    axios
      .get(`${API_URL}/api/admin/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        console.log('fetchAdmins response:', response.data);
        setAdmins(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error) => {
        console.error('fetchAdmins error:', error);
        handleAxiosError(error, 'Failed to fetch admins');
        setAdmins([]);
      })
      .finally(() => setIsLoadingAdmins(false));
  };

  const fetchTransactions = (page: number) => {
    setIsLoadingTransactions(true);
    axios
      .get<{ transactions: Transaction[]; total: number }>(
        `${API_URL}/api/transactions?page=${page}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      )
      .then((response) => {
        console.log('fetchTransactions response:', response.data);
        setTransactions(response.data.transactions || []);
        setTotalPages(Math.ceil(response.data.total / limit));
      })
      .catch((error) => {
        console.error('fetchTransactions error:', error);
        handleAxiosError(error, 'Failed to fetch transactions');
        setTransactions([]);
      })
      .finally(() => setIsLoadingTransactions(false));
  };

  const fetchAdminBalance = () => {
    setIsLoadingBalance(true);
    axios
      .get<AdminBalance>(`${API_URL}/api/admin/balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        console.log('fetchAdminBalance response:', response.data);
        setBalance(response.data);
      })
      .catch((error) => {
        console.error('fetchAdminBalance error:', error);
        handleAxiosError(error, 'Failed to fetch balance');
        setBalance(null);
      })
      .finally(() => setIsLoadingBalance(false));
  };

  useEffect(() => {
    fetchEmployees(currentPage, limit);
    fetchAdmins();
    fetchTransactions(currentPage);
    fetchAdminBalance();
  }, [currentPage, limit]);

  const onSubmit = (data: AllocatePointsForm) => {
    const payload = {
      recipientId: data.recipientId,
      amount: data.amount,
    };
    console.log('Submitting points allocation:', payload);
    setIsSubmitting(true);
    axios
      .post(`${API_URL}/api/staff-points/allocate`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(() => {
        toast.success('Points transferred successfully');
        reset();
        fetchEmployees();
        fetchAdmins();
        fetchAdminBalance();
      })
      .catch((error) => {
        console.error('allocatePoints error:', error);
        handleAxiosError(error, 'Failed to allocate points');
      })
      .finally(() => setIsSubmitting(false));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const initializeAdminPoints = () => {
    setIsSubmitting(true);
    axios
      .post(`${API_URL}/api/admin/points/initialize`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(() => {
        toast.success('Admin points initialized successfully');
        fetchAdmins();
      })
      .catch((error) => {
        console.error('initializeAdminPoints error:', error);
        handleAxiosError(error, 'Failed to initialize admin points');
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="dashboard-admin bg-light min-vh-100"
      style={{ paddingTop: '80px' }}
    >
      <style>
        {`
          /* Global Styles */
          .dashboard-admin {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }

          .card {
            transition: transform 0.2s, box-shadow 0.2s;
            border-radius: 12px;
          }
          .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
          }

          /* Typography */
          h2, h3, h4, h6 {
            font-weight: 600;
            color: #1a1a1a;
          }

          /* Form and Button Styles */
          .form-control-lg, .form-select-lg {
            font-size: clamp(0.9rem, 2.5vw, 1rem);
            padding: 0.75rem 1rem;
            border-radius: 8px;
          }
          .btn-primary {
            background-color: #0052cc;
            border-color: #0052cc;
            padding: 0.75rem 1.5rem;
            font-size: clamp(0.9rem, 2.5vw, 1rem);
            font-weight: 600;
            border-radius: 8px;
            transition: background-color 0.2s, border-color 0.2s;
          }
          .btn-primary:hover {
            background-color: #003d99;
            border-color: #003d99;
          }
          .btn-outline-primary {
            font-size: clamp(0.85rem, 2.2vw, 0.95rem);
            padding: 0.5rem 1rem;
          }

          /* Badge Styles */
          .badge-primary {
            background-color: #0052cc !important;
          }
          .badge-secondary {
            background-color: #6c757d !important;
          }
          .badge-success {
            background-color: #28a745 !important;
          }
          .badge-danger {
            background-color: #dc3545 !important;
          }
          .badge-light {
            font-size: clamp(0.8rem, 2vw, 0.9rem);
          }

          /* Table Styles */
          .table th, .table td {
            padding: 0.75rem;
            vertical-align: middle;
            font-size: clamp(0.85rem, 2.2vw, 0.95rem);
          }
          .table-responsive {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .avatar-sm {
            width: 2rem;
            height: 2rem;
            font-size: clamp(0.75rem, 2vw, 0.85rem);
            font-weight: 600;
            border-radius: 50%;
          }

          /* Pagination Styles */
          .pagination .page-link {
            color: #0052cc;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            margin: 0 0.25rem;
            font-size: clamp(0.85rem, 2.2vw, 0.95rem);
          }
          .pagination .page-item.active .page-link {
            background-color: #0052cc;
            border-color: #0052cc;
          }
          .pagination .page-item.disabled .page-link {
            color: #6c757d;
          }

          /* Responsive Adjustments */
          @media (max-width: 992px) {
            .card-body {
              padding: 1.5rem !important;
            }
            .container {
              padding-left: 1rem;
              padding-right: 1rem;
            }
            .form-group {
              margin-bottom: 1.25rem;
            }
            .btn-primary {
              padding: 0.65rem 1.25rem;
              font-size: clamp(0.85rem, 2.2vw, 0.95rem);
            }
          }

          @media (max-width: 768px) {
            .dashboard-admin {
              padding-top: 60px;
            }
            h2 {
              font-size: clamp(1.75rem, 5vw, 2rem);
              margin-bottom: 2rem;
            }
            .card-title {
              font-size: clamp(1.25rem, 3.5vw, 1.5rem);
            }
            .table-responsive {
              font-size: clamp(0.8rem, 2vw, 0.9rem);
            }
            .table th, .table td {
              padding: 0.5rem;
            }
            .avatar-sm {
              width: 1.75rem;
              height: 1.75rem;
              font-size: clamp(0.7rem, 1.8vw, 0.8rem);
            }
            .form-control-lg, .form-select-lg {
              font-size: clamp(0.85rem, 2.2vw, 0.95rem);
              padding: 0.65rem 1rem;
            }
            .btn-primary, .btn-outline-primary {
              padding: 0.6rem 1rem;
              font-size: clamp(0.8rem, 2vw, 0.9rem);
            }
            .row.g-4 {
              gap: 1.5rem !important;
            }
            .pagination .page-link {
              padding: 0.4rem 0.65rem;
              font-size: clamp(0.8rem, 2vw, 0.9rem);
            }
          }

          @media (max-width: 576px) {
            .container {
              padding-left: 0.75rem;
              padding-right: 0.75rem;
            }
            .card {
              margin-bottom: 1rem;
            }
            .card-body {
              padding: 1rem !important;
            }
            .table th, .table td {
              font-size: clamp(0.75rem, 1.8vw, 0.85rem);
              padding: 0.4rem;
            }
            .btn-primary, .btn-outline-primary {
              width: 100%;
              margin-bottom: 0.5rem;
            }
            .badge {
              font-size: clamp(0.7rem, 1.8vw, 0.8rem);
            }
            .pagination {
              flex-wrap: wrap;
              justify-content: center;
            }
            .pagination .page-link {
              margin: 0.2rem;
            }
            .d-flex.align-items-center {
              flex-direction: column;
              align-items: flex-start;
            }
            .d-flex.align-items-center .avatar-sm {
              margin-bottom: 0.5rem;
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
          Admin Dashboard
        </motion.h2>

        {/* Balance Overview */}
        <Row className="mb-4 mb-md-5">
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-3 p-md-4">
                <Card.Title className="text-dark mb-3 mb-md-4 fw-semibold">
                  Points Overview
                </Card.Title>
                {isLoadingBalance ? (
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : balance ? (
                  <Row className="g-3 g-md-4">
                    {[
                      { label: 'Available Points', value: balance.availablePoints, color: 'text-success' },
                      { label: 'Allocated Points', value: balance.allocatedPoints, color: 'text-primary' },
                      {
                        label: 'Total Points',
                        value: balance.availablePoints + balance.allocatedPoints,
                        color: 'text-info',
                      },
                    ].map((item, index) => (
                      <Col key={index} xs={12} sm={4}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.4 }}
                          className="p-3 p-md-4 bg-white rounded-3 shadow-sm text-center"
                        >
                          <h6 className="text-muted mb-2">{item.label}</h6>
                          <h3 className={`${item.color} mb-0`}>{item.value.toLocaleString()}</h3>
                        </motion.div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Alert variant="warning" className="mb-0">
                    Unable to load balance information
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Allocate Points Form & Quick Stats */}
        <Row className="mb-4 mb-md-5 g-3 g-md-4">
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-3 p-md-4">
                <Card.Title className="text-dark mb-3 mb-md-4 fw-semibold">
                  Allocate StaffPoints
                </Card.Title>
                <Form onSubmit={handleSubmit(onSubmit)}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-medium">Select Recipient</Form.Label>
                    <Form.Select
                      {...register('recipientId')}
                      className={`form-select-lg ${errors.recipientId ? 'is-invalid' : ''}`}
                    >
                      <option value="">Select a recipient</option>
                      {Array.isArray(employees) &&
                        employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} ({employee.email}) - Employee
                          </option>
                        ))}
                      {Array.isArray(admins) &&
                        admins.map((admin) => (
                          <option key={admin.id} value={admin.id}>
                            {admin.name} ({admin.email}) - Admin
                          </option>
                        ))}
                    </Form.Select>
                    {errors.recipientId && (
                      <div className="invalid-feedback">{errors.recipientId.message}</div>
                    )}
                  </Form.Group>
                  <Form.Group className="mb-3 mb-md-4">
                    <Form.Label className="fw-medium">Points Amount</Form.Label>
                    <Form.Control
                      type="number"
                      {...register('amount')}
                      placeholder="Enter points to allocate"
                      className={`form-control-lg ${errors.amount ? 'is-invalid' : ''}`}
                    />
                    {errors.amount && <div className="invalid-feedback">{errors.amount.message}</div>}
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 fw-bold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Spinner size="sm" animation="border" /> : 'Transfer Points'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className="shadow-sm border-0 h-100">
              <Card.Body className="p-3 p-md-4">
                <Card.Title className="text-dark mb-3 mb-md-4 fw-semibold">
                  Quick Stats
                </Card.Title>
                {isLoadingEmployees || isLoadingAdmins ? (
                  <div className="text-center">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {[
                      { label: 'Total Employees', value: Array.isArray(employees) ? employees.length : 0 },
                      { label: 'Total Admins', value: Array.isArray(admins) ? admins.length : 0 },
                      { label: 'Recent Transactions', value: `${Array.isArray(transactions) ? transactions.length : 0} this page` },
                      {
                        label: 'Points Distribution',
                        value: Array.isArray(employees)
                          ? `${employees.reduce((sum, emp) => sum + (emp.staffPoints || 0), 0).toLocaleString()} total points`
                          : '0 total points',
                      },
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        className="p-3 bg-white rounded-3 shadow-sm"
                      >
                        <h6 className="text-muted mb-1">{stat.label}</h6>
                        <h4 className="mb-0">{stat.value}</h4>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Initialize Admin Points Button */}
        <Row className="mb-4 mb-md-5">
          <Col>
            <Button
              variant="primary"
              onClick={initializeAdminPoints}
              disabled={isSubmitting}
              className="w-100 fw-bold"
            >
              {isSubmitting ? <Spinner size="sm" animation="border" /> : 'Initialize 1B Points for Admins'}
            </Button>
          </Col>
        </Row>

        {/* Employees/Admins Table */}
        <Row className="mb-4 mb-md-5">
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 mb-md-4">
                  <Card.Title className="text-dark mb-2 mb-md-0 fw-semibold">
                    {showAdmins ? 'Admins' : 'Employees'}
                  </Card.Title>
                  <div className="d-flex flex-column flex-md-row align-items-center gap-2">
                    <Button
                      variant={showAdmins ? 'outline-primary' : 'primary'}
                      size="sm"
                      onClick={() => setShowAdmins(false)}
                    >
                      Show Employees
                    </Button>
                    <Button
                      variant={showAdmins ? 'primary' : 'outline-primary'}
                      size="sm"
                      onClick={() => setShowAdmins(true)}
                    >
                      Show Admins
                    </Button>
                    <Badge bg="light" text="dark" pill>
                      {showAdmins
                        ? Array.isArray(admins)
                          ? admins.length
                          : 0
                        : Array.isArray(employees)
                          ? employees.length
                          : 0}{' '}
                      records
                    </Badge>
                  </div>
                </div>

                {(showAdmins ? isLoadingAdmins : isLoadingEmployees) ? (
                  <div className="text-center py-4 py-md-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Loading {showAdmins ? 'admins' : 'employees'}...</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <Table hover className="align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th className="text-end">StaffPoints</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showAdmins ? admins : employees).length > 0 ? (
                          (showAdmins ? admins : employees).map((user) => (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <td>{user.id}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div
                                    className="avatar-sm bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-2"
                                  >
                                    {user.name.charAt(0)}
                                  </div>
                                  <h6 className="mb-0">{user.name}</h6>
                                </div>
                              </td>
                              <td>{user.email}</td>
                              <td>
                                <Badge
                                  bg={user.role === 'ADMIN' ? 'primary' : 'secondary'}
                                  pill
                                >
                                  {user.role}
                                </Badge>
                              </td>
                              <td className="text-end fw-bold">
                                {(user.staffPoints || 0).toLocaleString()}
                              </td>
                            </motion.tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center text-muted">
                              No {showAdmins ? 'admins' : 'employees'} found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Transaction History */}
        <Row>
          <Col>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
                  <Card.Title className="text-dark mb-0 fw-semibold">
                    Transaction History
                  </Card.Title>
                  <Badge bg="light" text="dark" pill>
                    Page {currentPage} of {totalPages}
                  </Badge>
                </div>
                {isLoadingTransactions ? (
                  <div className="text-center py-4 py-md-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Loading transactions...</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <Table hover className="align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Sender</th>
                            <th>Recipient</th>
                            <th className="text-end">Amount</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                       <tbody>
  {Array.isArray(transactions) && transactions.length > 0 ? (
    transactions.map((transaction) => {
      const sender =
        (showAdmins ? admins : employees)?.find((e) => e.id === transaction.senderId)?.name || 'System';

      const recipient =
        (showAdmins ? admins : employees)?.find((e) => e.id === transaction.recipientId)?.name || 'Unknown';

      return (
        <motion.tr
          key={transaction.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <td>{transaction.id}</td>
          <td>{sender}</td>
          <td>{recipient}</td>
          <td className="text-end fw-bold">
            <Badge bg={transaction.amount > 0 ? 'success' : 'danger'}>
              {transaction.amount > 0 ? '+' : ''}
              {transaction.amount.toLocaleString()}
            </Badge>
          </td>
          <td>
            {new Date(transaction.timestamp).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </td>
        </motion.tr>
      );
    })
  ) : (
    <tr>
      <td colSpan={5} className="text-center text-muted">
        No transactions found
      </td>
    </tr>
  )}
</tbody>

                      </Table>
                    </div>
                    <div className="d-flex justify-content-center mt-3 mt-md-4">
                      <Pagination>
                        <Pagination.Prev
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        />
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Pagination.Item
                              key={pageNum}
                              active={pageNum === currentPage}
                              onClick={() => handlePageChange(pageNum)}
                            >
                              {pageNum}
                            </Pagination.Item>
                          );
                        })}
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