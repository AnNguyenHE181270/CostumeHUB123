import axiosClient from '../api/axiosClient';

const rentalService = {
  getHistory: () => axiosClient.get('/api/rentals/rental-history'),

  getDetail: (orderId) => axiosClient.get(`/api/rentals/order-detail/${orderId}`),

  createOrder: (orderData) => axiosClient.post('/api/rentals/create', orderData),

  createOfflineOrder: (orderData) => axiosClient.post('/api/rentals/create-offline', orderData),

  cancelOrder: (orderId, cancelReason) =>
    axiosClient.put(`/api/rentals/${orderId}/cancel`, { cancelReason }),

  confirmReceipt: (orderId) => axiosClient.put(`/api/rentals/${orderId}/confirm-receipt`),

  requestReturn: (orderId) => axiosClient.put(`/api/rentals/${orderId}/request-return`),

  extendRental: (orderId, newEndDate) =>
    axiosClient.put(`/api/rentals/${orderId}/extend`, { newEndDate }),

  checkAvailability: (data) => axiosClient.post('/api/rentals/check', data),

  getTopRented: (limit = 3) => axiosClient.get(`/api/rentals/top-rented?limit=${limit}`),

  estimateDelivery: (districtId, wardCode) =>
    axiosClient.post('/api/rentals/estimate-delivery', { districtId, wardCode }),

  // Staff / Owner
  getAllOrders: () => axiosClient.get('/api/rentals'),

  updateStatus: (orderId, status) =>
    axiosClient.put(`/api/rentals/${orderId}/status`, { status }),

  confirmPreparation: (orderId) =>
    axiosClient.put(`/api/rentals/${orderId}/confirm`),

  inspectReturn: (orderId, formData) =>
    axiosClient.put(`/api/rentals/${orderId}/inspect-return`, formData),

  // Dashboard
  getTotalRevenue: () => axiosClient.get('/api/rentals/dashboard/revenue'),

  getActiveRentals: () => axiosClient.get('/api/rentals/dashboard/active-rentals'),

  getInventoryUtilization: () => axiosClient.get('/api/rentals/dashboard/inventory-utilization'),

  updateRentalDates: async (orderId, { startDate, endDate }) => {
    const response = await axiosClient.put(`/api/rentals/${orderId}/update-dates`, { startDate, endDate });
    return response.data;
  },
};

export default rentalService;
