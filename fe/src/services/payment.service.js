import axiosClient from '../api/axiosClient';

const paymentService = {
  createPaymentUrl: (amount) =>
    axiosClient.post('/api/payos/create-payment-link', { amount }),
  syncTransaction: (orderCode) =>
    axiosClient.post('/api/payos/sync-transaction', { orderCode }),
  requestWithdraw: (data) =>
    axiosClient.post('/api/payos/withdraw', data),
  sendWithdrawOtp: (password) =>
    axiosClient.post('/api/payos/withdraw/send-otp', { password }),
  getAllTransactions: () =>
    axiosClient.get('/api/payos/admin/transactions'),
  updateWithdrawStatus: (transactionId, status) =>
    axiosClient.put(`/api/payos/admin/withdraw/${transactionId}/status`, { status }),
};

export default paymentService;
