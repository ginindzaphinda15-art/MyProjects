import axios from 'axios';

// Base URL includes the `/api` prefix so endpoint paths below can stay short
// (e.g. `/auth/register` → https://.../api/auth/register).
// Local dev falls back to localhost if .env isn't set.
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// Attach the JWT to every request once the user is logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('esebelink_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is rejected, clear it so the app falls back to the logged-out state.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('esebelink_token');
      localStorage.removeItem('esebelink_user');
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  me: () => api.get('/auth/me'),
};

export const vendorApi = {
  list: (params) => api.get('/vendors', { params }),
  get: (id) => api.get(`/vendors/${id}`),
  getMine: () => api.get('/vendors/me'),
  saveMine: (payload) => api.put('/vendors/me', payload),
};

export const serviceApi = {
  listMine: () => api.get('/services/mine'),
  create: (payload) => api.post('/services', payload),
  update: (id, payload) => api.put(`/services/${id}`, payload),
  remove: (id) => api.delete(`/services/${id}`),
};

export const bookingApi = {
  create: (payload) => api.post('/bookings', payload),
  listMine: () => api.get('/bookings/mine'),
  listForVendor: (params) => api.get('/bookings/vendor', { params }),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
  availability: (params) => api.get('/bookings/availability', { params }),
};

export const orderApi = {
  create: (payload) => api.post('/orders', payload),
  listMine: () => api.get('/orders/mine'),
  listForVendor: (params) => api.get('/orders/vendor', { params }),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export const uploadApi = {
  image: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api.post('/uploads/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;