import axiosClient from '../api/axiosClient';

const issueService = {
  create: (formData) =>
    axiosClient.post('/api/issues/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getByRentalId: (rentalId) => axiosClient.get(`/api/issues/rental/${rentalId}`),

  cancel: (issueId) => axiosClient.put(`/api/issues/${issueId}/cancel`),

  // Staff / Owner
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return axiosClient.get(`/api/issues${query ? '?' + query : ''}`);
  },

  handle: (issueId, formData) =>
    axiosClient.put(`/api/issues/${issueId}/handle`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default issueService;
