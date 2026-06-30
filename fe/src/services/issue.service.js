import axiosClient from '../api/axiosClient';

const issueService = {
  create: (formData) => axiosClient.post('/api/issues/create', formData),

  getByRentalId: (rentalId) => axiosClient.get(`/api/issues/rental/${rentalId}`),

  cancel: (issueId) => axiosClient.put(`/api/issues/${issueId}/cancel`),
};

export default issueService;
