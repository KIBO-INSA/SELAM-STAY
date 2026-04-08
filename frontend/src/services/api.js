import axios from 'axios';

/** Host root (no path). Empty → relative `/api` and Vite dev proxy. */
const apiRoot = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');
export const API_PREFIX = apiRoot ? `${apiRoot}/api` : '/api';

const api = axios.create({ baseURL: API_PREFIX });

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('selam_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data)  => api.post('/auth/register', data),
  login:    (data)  => api.post('/auth/login', data),
  me:       (token) => api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
};

export const conciergeAPI = {
  chat:      (guest_id, message, mode= 'service') => api.post('/concierge/chat', { guest_id, message, mode }),
  reset:     (guest_id)          => api.post('/concierge/reset', { guest_id }),
  proactive: (guest_id)          => api.get(`/concierge/proactive/${guest_id}`),
  history:   (guest_id, limit = 30) => api.get(`/concierge/history/${guest_id}`, { params: { limit } }),
};

export const sentimentAPI = {
  analyze:  (guest_id, room_number, message) =>
    api.post('/sentiment/analyze', { guest_id, room_number, message }),
  alerts:   ()              => api.get('/sentiment/alerts'),
  all:      ()              => api.get('/sentiment/all'),
  resolve:  (id)            => api.post(`/sentiment/resolve/${id}`),
};

export const inventoryAPI = {
  getStatus: () => api.get('/inventory/'),
  getOptimization: () => api.get('/inventory/optimization'),
  updateStock: (id, current_stock) => api.post(`/inventory/${id}/update`, { current_stock }),
};

export const pricingAPI = {
  simulate: ()              => api.get('/pricing/simulate'),
  recommend: (params)       => api.get('/pricing/recommend', { params }),
};

export const maintenanceAPI = {
  all:      ()              => api.get('/maintenance/all'),
  critical: ()              => api.get('/maintenance/critical'),
};

export const schedulerAPI = {
  week:  ()                 => api.get('/scheduler/week'),
  staff: ()                 => api.get('/scheduler/staff'),
};

export const dashboardAPI = {
  summary: (property = '') => api.get(`/dashboard/summary${property ? `?property=${encodeURIComponent(property)}` : ''}`),
  tasks: ()                 => api.get('/dashboard/tasks'),
};

export const roomControlsAPI = {
  get:    (roomId)         => api.get(`/room-controls/${roomId}`),
  update: (roomId, data)   => api.post(`/room-controls/${roomId}`, data),
};

export const serviceAPI = {
  create:  (data)          => api.post('/services/request', data),
  getByGuest: (guestId)    => api.get(`/services/guest/${guestId}`),
  updateStatus: (id, status) => api.post(`/services/${id}/status`, { status }),
};

export const guestAPI = {
  updatePreferences: (data) => api.post('/guest/preferences', data),
  getProfile: (guestId)     => api.get(`/guest/${guestId}`),
};

