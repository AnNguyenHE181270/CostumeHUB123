import axiosClient from '../api/axiosClient';

const userService = {
  register: (data) => axiosClient.post('/api/users/register', data),

  verifyOtp: (email, otp) => axiosClient.post(`/api/users/verify-otp/${email}`, { otp }),

  resendOtp: (email) => axiosClient.post(`/api/users/resend-otp/${email}`),

  login: (email, password) => axiosClient.post('/api/users/login', { email, password }),

  getMyProfile: () => axiosClient.get('/api/users/my-profile'),

  updateMyProfile: (formData) => axiosClient.put('/api/users/update-my-profile', formData),

  forgotPassword: (email) => axiosClient.post('/api/users/forgot-password', { email }),

  resetPassword: (token, password) =>
    axiosClient.post(`/api/users/reset-password/${token}`, { password }),

  // Addresses
  getAddresses: () => axiosClient.get('/api/users/addresses'),

  getAddressById: (id) => axiosClient.get(`/api/users/address/${id}`),

  createAddress: (data) => axiosClient.post('/api/users/create-address', data),

  updateAddress: (id, data) => axiosClient.put(`/api/users/update-address/${id}`, data),

  deleteAddress: (id) => axiosClient.delete(`/api/users/delete-address/${id}`),

  // Owner / Admin
  getAllUsers: () => axiosClient.get('/api/users/get-users'),

  getUserById: (id) => axiosClient.get(`/api/users/user/${id}`),

  updateUser: (id, formData) => axiosClient.put(`/api/users/update-user/${id}`, formData),
};

export default userService;
