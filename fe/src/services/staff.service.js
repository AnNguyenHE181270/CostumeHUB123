import axiosClient from '../api/axiosClient';

const staffService = {
  getDashboard: (params) => axiosClient.get('/api/staff/dashboard', { params }),
};

export default staffService;
