import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Pagination,
  Badge,
  Alert,
} from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useAppSelector } from '../../hooks';
import { toast } from 'react-toastify';
import axios, { isAxiosError } from 'axios';
import { FaCoins, FaHistory } from 'react-icons/fa';

interface Transaction {
  id: number;
  senderId: number;
  recipientId: number;
  amount: number;
  timestamp: string;
  senderName?: string;
  recipientName?: string;
}

const API_URL = 'https://backend-g4qt.onrender.com';

export default function DashboardEmployee() {
  const { user } = useAppSelector((state) => state.auth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState({
    transactions: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
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
                        {user.staffPoints.toLocaleString() || '0'} pts
                      </h3>
                    ) : (
                      <Spinner animation="border" size="sm" />
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Transaction History */}
        <Row className="g-4">
          <Col lg={12}>
            <Card className="bank-card">
              <Card.Header className="bank-card-header d-flex align-items-center">
                <FaHistory className="bank-icon" />
                <span>Your Transaction History</span>
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