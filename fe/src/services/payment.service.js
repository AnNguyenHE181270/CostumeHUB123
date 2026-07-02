import axiosClient from '../api/axiosClient';

const paymentService = {
  createPaymentUrl: (amount) =>
    axiosClient.post('/api/vnpays/create-payment-url', { amount }),
};

export default paymentService;
