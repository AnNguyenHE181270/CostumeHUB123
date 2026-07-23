import axiosClient from '../api/axiosClient';

const paymentService = {
  createPaymentUrl: (data) =>
    axiosClient.post('/api/vnpay/create-payment-url', data),
};

export default paymentService;
