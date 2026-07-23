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

  // Kho hàng cho trang quản trị: đủ mọi sản phẩm (kể cả đang ẩn), không bị giới hạn 50 bản ghi như getAll
  getInventory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/api/costumes/inventory/list${query ? `?${query}` : ''}`);
  },

  getMaintenanceList: () => axiosClient.get('/api/costumes/maintenance/list'),

  completeMaintenance: (id, size, unitCode) =>
    axiosClient.put(`/api/costumes/${id}/complete-maintenance`, { size, unitCode }),
};

export default costumeService;
