import React, { useEffect, useState } from 'react';
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
  staffPoints: number | null;
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

interface AdminUser {
  id: number;
  name: string;
  email: string;
}

const schema = yup.object().shape({
  recipientId: yup.number().required('Recipient is required').positive().integer(),
  amount: yup.number().required('Amount is required').positive().integer().min(1, 'Amount must be at least 1'),
});

const API_URL = 'https://backend-g4qt.onrender.com';

export default function DashboardAdmin() {
  const [users, setUsers] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState<AdminBalance | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState({
    users: false,
    transactions: false,
    balance: false,
    submitting: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AllocatePointsForm>({
    resolver: yupResolver(schema),
  });

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

  const fetchAdminUser = () => {
    setLoadingState('users', true);
    axios
      .get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        setAdminUser(response.data);
      })
      .catch((error) => {
        console.error('fetchAdminUser error:', error);
        handleAxiosError(error, 'Failed to fetch admin details');
      })
      .finally(() => setLoadingState('users', false));
  };

  const fetchUsers = (page = 1, limit = 10) => {
    setLoadingState('users', true);
    axios
      .get(`${API_URL}/api/users/all`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        params: { page, limit },
      })
      .then((response) => {
        console.log('fetchUsers response:', response.data);
        const users = Array.isArray(response.data.users) ? response.data.users : [];
        setUsers(users);
        setTotalPages(Math.ceil((response.data.total || 0) / limit));
      })
      .catch((error) => {
        console.error('fetchUsers error:', error);
        handleAxiosError(error, 'Failed to fetch users');
        setUsers([]);
      })
      .finally(() => setLoadingState('users', false));
  };

  const fetchTransactions = (page: number) => {
    setLoadingState('transactions', true);
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
      .finally(() => setLoadingState('transactions', false));
  };

  const fetchAdminBalance = () => {
    setLoadingState('balance', true);
    axios
      .get<AdminBalance>(`${API_URL}/api/admin/balance`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then((response) => {
        console.log('fetchAdminBalance response:', response.data);
        setBalance({
          availablePoints: Math.floor(Number(response.data.availablePoints)),
          allocatedPoints: Math.floor(Number(response.data.allocatedPoints)),
        });
      })
      .catch((error) => {
        console.error('fetchAdminBalance error:', error);
        handleAxiosError(error, 'Failed to fetch balance');
        setBalance(null);
      })
      .finally(() => setLoadingState('balance', false));
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
        console.error('initializeAdminPoints error:', error);
        handleAxiosError(error, 'Failed to initialize admin points');
      })
      .finally(() => setLoadingState('submitting', false));
  };

  useEffect(() => {
    fetchAdminUser();
    fetchUsers(currentPage, limit);
    fetchTransactions(currentPage);
    fetchAdminBalance();
  }, [currentPage, limit]);

  const onSubmit = (data: AllocatePointsForm) => {
    const payload = {
      recipientId: data.recipientId,
      amount: data.amount,
    };
    console.log('Submitting points allocation:', payload);
    setLoadingState('submitting', true);
    axios
      .post(`${API_URL}/api/staff-points/allocate`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      .then(() => {
        toast.success('Points transferred successfully');
        reset();
        fetchUsers();
        fetchAdminBalance();
      })
      .catch((error) => {
        console.error('allocatePoints error:', error);
        handleAxiosError(error, 'Failed to allocate points');
      })
      .finally(() => setLoadingState('submitting', false));
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPaginationRange = () => {
    const maxPagesToShow = 5;
    const start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const end = Math.min(totalPages, start + maxPagesToShow - 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 font-sans"
    >
      <div className="container mx-auto px-4 py-8 md:py-12">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
            Welcome, {adminUser?.name || 'Admin'}!
          </h2>
          <p className="text-lg text-gray-600 mt-2">Manage your team's points with ease</p>
        </motion.div>

        {/* Balance Overview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <div className="bg-white shadow-lg rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Points Overview</h3>
            {loading.balance ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto" />
              </div>
            ) : balance ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Available Points', value: balance.availablePoints, color: 'text-green-600' },
                  { label: 'Allocated Points', value: balance.allocatedPoints, color: 'text-blue-600' },
                  {
                    label: 'Total Points',
                    value: balance.availablePoints + balance.allocatedPoints,
                    color: 'text-teal-600',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="bg-gray-50 p-4 rounded-lg text-center"
                  >
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className={`text-2xl font-bold ${item.color}`}>{item.value.toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
                Unable to load balance information
              </div>
            )}
          </div>
        </motion.div>

        {/* Allocate Points Form & Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Allocate Points</h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Recipient
                  </label>
                  <select
                    {...register('recipientId')}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.recipientId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-label="Select recipient"
                  >
                    <option value="">Select a recipient</option>
                    {Array.isArray(users) &&
                      users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))}
                  </select>
                  {errors.recipientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.recipientId.message}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Amount
                  </label>
                  <input
                    type="number"
                    {...register('amount')}
                    placeholder="Enter points to allocate"
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-label="Points amount"
                  />
                  {errors.amount && (
                    <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
                  disabled={loading.submitting}
                  aria-label={loading.submitting ? 'Submitting points transfer' : 'Transfer points'}
                >
                  {loading.submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2" />
                      Transferring...
                    </div>
                  ) : (
                    'Transfer Points'
                  )}
                </button>
              </form>
            </div>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="bg-white shadow-lg rounded-lg p-6 h-full">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Quick Stats</h3>
              {loading.users ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto" />
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { label: 'Total Users', value: Array.isArray(users) ? users.length : 0 },
                    { label: 'Recent Transactions', value: `${Array.isArray(transactions) ? transactions.length : 0} this page` },
                    {
                      label: 'Points Distributed',
                      value: Array.isArray(users)
                        ? `${users.reduce((sum, user) => sum + (user.staffPoints || 0), 0).toLocaleString()} total points`
                        : '0 total points',
                    },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      className="bg-gray-50 p-4 rounded-lg"
                    >
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <p className="text-xl font-semibold text-gray-800">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Initialize Admin Points Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <button
            onClick={initializeAdminPoints}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400"
            disabled={loading.submitting}
            aria-label={loading.submitting ? 'Initializing points' : 'Initialize 1B points for admins'}
          >
            {loading.submitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white mr-2" />
                Initializing...
              </div>
            ) : (
              'Initialize 1B Points for Admins'
            )}
          </button>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mb-8"
        >
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Users</h3>
              <span className="bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full">
                {Array.isArray(users) ? users.length : 0} records
              </span>
            </div>
            {loading.users ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 text-sm font-semibold text-gray-700">ID</th>
                      <th className="p-3 text-sm font-semibold text-gray-700">Name</th>
                      <th className="p-3 text-sm font-semibold text-gray-700">Email</th>
                      <th className="p-3 text-sm font-semibold text-gray-700">Role</th>
                      <th className="p-3 text-sm font-semibold text-gray-700 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(users) && users.length > 0 ? (
                      users.map((user) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3 text-sm text-gray-600">{user.id}</td>
                          <td className="p-3 text-sm text-gray-600">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2">
                                {user.name.charAt(0)}
                              </div>
                              {user.name}
                            </div>
                          </td>
                          <td className="p-3 text-sm text-gray-600">{user.email}</td>
                          <td className="p-3 text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                user.role === 'ADMIN'
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-gray-600 text-right font-semibold">
                            {(user.staffPoints || 0).toLocaleString()}
                          </td>
                        </motion.tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-gray-600">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Transaction History</h3>
              <span className="bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            {loading.transactions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 mx-auto" />
                <p className="mt-2 text-gray-600">Loading transactions...</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-gray-700">ID</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Sender</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Recipient</th>
                        <th className="p-3 text-sm font-semibold text-gray-700 text-right">Amount</th>
                        <th className="p-3 text-sm font-semibold text-gray-700">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(transactions) && transactions.length > 0 ? (
                        transactions.map((transaction) => {
                          const sender =
                            users.find((u) => u.id === transaction.senderId)?.name || 'System';
                          const recipient =
                            users.find((u) => u.id === transaction.recipientId)?.name || 'Unknown';
                          return (
                            <motion.tr
                              key={transaction.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="p-3 text-sm text-gray-600">{transaction.id}</td>
                              <td className="p-3 text-sm text-gray-600">{sender}</td>
                              <td className="p-3 text-sm text-gray-600">{recipient}</td>
                              <td className="p-3 text-sm text-right">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs ${
                                    transaction.amount > 0
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-red-100 text-red-600'
                                  }`}
                                >
                                  {transaction.amount > 0 ? '+' : ''}
                                  {transaction.amount.toLocaleString()}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-gray-600">
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
                          <td colSpan={5} className="p-3 text-center text-gray-600">
                            No transactions found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center mt-6">
                  <nav className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg text-sm bg-gray-200 text-gray-600 disabled:opacity-50"
                      aria-label="Previous page"
                    >
                      Prev
                    </button>
                    {getPaginationRange().map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                        aria-label={`Page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg text-sm bg-gray-200 text-gray-600 disabled:opacity-50"
                      aria-label="Next page"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}