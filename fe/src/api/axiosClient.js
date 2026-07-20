import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:9999',
  headers: { 'Content-Type': 'application/json' },
});

// Tự động gắn token vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Chuẩn hóa lỗi trả về từ server
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Lỗi không xác định';
    const normalizedError = new Error(message);
    normalizedError.extra = error.response?.data?.extra;
    return Promise.reject(normalizedError);
  }
);

export default axiosClient;
