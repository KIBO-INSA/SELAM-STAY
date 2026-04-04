import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const conciergeAPI = {
  chat:      (guest_id, message) => api.post('/concierge/chat', { guest_id, message }),
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
