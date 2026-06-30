import axiosClient from '../api/axiosClient';

const costumeService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/api/costumes${query ? `?${query}` : ''}`);
  },

  getById: (id) => axiosClient.get(`/api/costumes/${id}`),

  create: (data) => axiosClient.post('/api/costumes', data),

  update: (id, data) => axiosClient.put(`/api/costumes/${id}`, data),

  delete: (id) => axiosClient.delete(`/api/costumes/${id}`),
};

export default costumeService;
