import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:9999',
  headers: { 'Content-Type': 'application/json' },
});

// Tự động gắn token vào mọi request
axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Content-Type mặc định của instance là 'application/json'. Khi body là FormData (upload
  // avatar/ảnh...), header này phải được gỡ bỏ để trình duyệt tự set 'multipart/form-data;
  // boundary=...'. Nếu không, axios sẽ nghĩ đây là request JSON và âm thầm JSON.stringify()
  // FormData thành object rỗng, khiến file không bao giờ được gửi lên server (mất dữ liệu file,
  // đôi khi kéo theo lỗi 400 bị FE hiển thị nhầm thành "Lỗi kết nối mạng").
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type');
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
