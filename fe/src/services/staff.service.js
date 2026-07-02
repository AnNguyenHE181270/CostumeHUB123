import axiosClient from '../api/axiosClient';

const staffService = {
  getDashboard: () => axiosClient.get('/api/staff/dashboard'),
};

export default staffService;
