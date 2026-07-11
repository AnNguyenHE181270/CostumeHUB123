import axiosClient from '../api/axiosClient';

const categoryService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    
    // Lấy token từ localStorage 
    // (Lưu ý: Nếu team bạn lưu tên biến là 'accessToken' hay 'userToken' thì bạn đổi lại chữ 'token' ở dưới cho khớp nhé)
    const token = localStorage.getItem('token'); 

    return axiosClient.get(`/api/categories${query ? `?${query}` : ''}`, {
      // Ép đính kèm Token vào Header của request này để vượt qua lớp bảo mật Backend
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },

  create: (data) => axiosClient.post('/api/categories', data),

  update: (id, data) => axiosClient.put(`/api/categories/${id}`, data),

  toggle: (id, isActive) => axiosClient.put(`/api/categories/${id}/toggle`, { isActive }),
};

export default categoryService;