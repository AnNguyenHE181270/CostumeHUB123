import axiosClient from '../api/axiosClient';

const cartService = {
  getCart: () => axiosClient.get('/api/carts'),

  addItem: (data) => axiosClient.post('/api/carts', data),

  updateItem: (costumeId, data) => axiosClient.put(`/api/carts/${costumeId}`, data),

  removeItem: (data) => axiosClient.delete('/api/carts/item', { data }),

  clearCart: () => axiosClient.delete('/api/carts'),
};

export default cartService;
