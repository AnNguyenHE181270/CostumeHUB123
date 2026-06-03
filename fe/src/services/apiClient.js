import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:9999',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor cho request để đính kèm token (nếu có)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor cho response để xử lý lỗi chung (VD: 401, 403)
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Có thể xử lý logout ở đây nếu token hết hạn (401)
      if (error.response.status === 401) {
        console.warn('Unauthorized, token may be expired.');
        // Có thể redirect về trang login hoặc xóa token
        // localStorage.removeItem('token');
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
