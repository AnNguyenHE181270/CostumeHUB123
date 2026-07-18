import axiosClient from '../api/axiosClient';

const stockTransactionService = {
  create: (data) => axiosClient.post('/api/stock-transactions', data),

  getHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/api/stock-transactions${query ? `?${query}` : ''}`);
  },

  getSummary: () => axiosClient.get('/api/stock-transactions/summary'),
};

export default stockTransactionService;
