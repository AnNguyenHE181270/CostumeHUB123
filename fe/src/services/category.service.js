import axiosClient from '../api/axiosClient';

const categoryService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/api/categories${query ? `?${query}` : ''}`);
  },

  create: (data) => axiosClient.post('/api/categories', data),

  update: (id, data) => axiosClient.put(`/api/categories/${id}`, data),

  toggle: (id, isActive) => axiosClient.put(`/api/categories/${id}/toggle`, { isActive }),
};

export default categoryService;
