import api from './axios';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  platformLogin:   (d)          => api.post('/auth/platform/login', d),
  registerCompany: (d)          => api.post('/auth/register/company', d),
  companyLogin:    (slug, d)    => api.post(`/auth/${slug}/login`, d),
  userRegister:    (slug, d)    => api.post(`/auth/${slug}/user/register`, d),
  userLogin:       (slug, d)    => api.post(`/auth/${slug}/user/login`, d),
  getMe:           ()           => api.get('/auth/me'),
  updateProfile:   (d)          => api.put('/auth/profile', d),
  changePassword:  (d)          => api.put('/auth/change-password', d),
  uploadAvatar:    (formData)   => api.post('/auth/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  removeAvatar:    ()           => api.delete('/auth/avatar'),
  forgotPassword:  (d)          => api.post('/auth/forgot-password', d),
  forgotPasswordCompany: (slug, d) => api.post(`/auth/${slug}/forgot-password`, d),
  resetPassword:   (token, d)   => api.post(`/auth/reset-password/${token}`, d),
};

// ── Platform ──────────────────────────────────────────────────────────────────
export const platformAPI = {
  getDashboard:       ()            => api.get('/platform/dashboard'),
  getCompanies:       (p)           => api.get('/platform/companies', { params: p }),
  getCompany:         (id)          => api.get(`/platform/companies/${id}`),
  approveCompany:     (id)          => api.put(`/platform/companies/${id}/approve`),
  rejectCompany:      (id, d)       => api.put(`/platform/companies/${id}/reject`, d),
  toggleSuspend:      (id)          => api.put(`/platform/companies/${id}/toggle-suspend`),
  updateCompany:      (id, d)       => api.put(`/platform/companies/${id}`, d),
  getTickets:         (p)           => api.get('/platform/tickets', { params: p }),
  getPlans:           ()            => api.get('/platform/subscriptions'),
  createPlan:         (d)           => api.post('/platform/subscriptions', d),
  updatePlan:         (id, d)       => api.put(`/platform/subscriptions/${id}`, d),
  deletePlan:         (id)          => api.delete(`/platform/subscriptions/${id}`),
  getAnalytics:       ()            => api.get('/platform/analytics'),
  getSettings:        ()            => api.get('/platform/settings'),
  updateSettings:     (d)           => api.put('/platform/settings', d),
};

// ── Subscriptions (public) ────────────────────────────────────────────────────
export const subscriptionAPI = {
  getPlans: () => api.get('/subscriptions'),
  getAllSubscriptions: (p) => api.get('/subscriptions/all', { params: p }),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  getKey:             ()           => api.get('/payments/key'),
  createOrder:        (slug, d)    => api.post(`/payments/${slug}/create-order`, d),
  verify:             (slug, d)    => api.post(`/payments/${slug}/verify`, d),
  getStatus:          (slug)       => api.get(`/payments/${slug}/status`),
  getHistory:         (slug)       => api.get(`/payments/${slug}/history`),
  calculateProration: (slug, d)    => api.post(`/payments/${slug}/proration`, d),
  overrideFeature:    (d)          => api.post('/payments/admin/override-feature', d),
  getAllTransactions:  (p)          => api.get('/payments/admin/transactions', { params: p }),
  getAllSubscriptions: (p)          => api.get('/payments/admin/subscriptions', { params: p }),
};

// ── Company ───────────────────────────────────────────────────────────────────
export const companyAPI = {
  getPublicInfo:       (slug)        => api.get(`/companies/${slug}/public`),
  getDashboard:        (slug)        => api.get(`/companies/${slug}/dashboard`),
  updateSettings:      (slug, d)     => api.put(`/companies/${slug}/settings`, d),
  uploadLogo:          (slug, fd)    => api.post(`/companies/${slug}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStaff:            (slug, p)     => api.get(`/companies/${slug}/staff`, { params: p }),
  createStaff:         (slug, d)     => api.post(`/companies/${slug}/staff`, d),
  updateStaff:         (slug, id, d) => api.put(`/companies/${slug}/staff/${id}`, d),
  deleteStaff:         (slug, id)    => api.delete(`/companies/${slug}/staff/${id}`),
  getAgentPerformance: (slug)        => api.get(`/companies/${slug}/agents/performance`),
};

// ── Services ──────────────────────────────────────────────────────────────────
export const serviceAPI = {
  getPublic:  (slug)           => api.get(`/companies/${slug}/services/public`),
  getServices:(slug)           => api.get(`/companies/${slug}/services`),
  create:     (slug, d)        => api.post(`/companies/${slug}/services`, d),
  update:     (slug, id, d)    => api.put(`/companies/${slug}/services/${id}`, d),
  delete:     (slug, id)       => api.delete(`/companies/${slug}/services/${id}`),
};

// ── Tickets ───────────────────────────────────────────────────────────────────
export const ticketAPI = {
  getTickets:   (slug, p)       => api.get(`/tickets/${slug}/tickets`, { params: p }),
  getTicket:    (slug, id)      => api.get(`/tickets/${slug}/tickets/${id}`),
  createTicket: (slug, d)       => api.post(`/tickets/${slug}/tickets`, d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateTicket: (slug, id, d)   => api.put(`/tickets/${slug}/tickets/${id}`, d),
  deleteTicket: (slug, id)      => api.delete(`/tickets/${slug}/tickets/${id}`),
  assignTicket: (slug, id, d)   => api.put(`/tickets/${slug}/tickets/${id}/assign`, d),
  updateStatus: (slug, id, d)   => api.put(`/tickets/${slug}/tickets/${id}/status`, d),
  addNote:      (slug, id, d)   => api.post(`/tickets/${slug}/tickets/${id}/notes`, d),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messageAPI = {
  getMessages: (slug, tid)    => api.get(`/messages/${slug}/tickets/${tid}/messages`),
  sendMessage: (slug, tid, d) => api.post(`/messages/${slug}/tickets/${tid}/messages`, d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  markRead:    (slug, tid)    => api.put(`/messages/${slug}/tickets/${tid}/messages/read`),
};

// ── Ratings ───────────────────────────────────────────────────────────────────
export const ratingAPI = {
  createRating:      (slug, tid, d) => api.post(`/ratings/${slug}/tickets/${tid}/rate`, d),
  getCompanyRatings: (slug, p)      => api.get(`/ratings/${slug}/ratings`, { params: p }),
  getAgentRatings:   (slug, aid)    => api.get(`/ratings/${slug}/agents/${aid}/ratings`),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getUserDashboard: (slug)      => api.get(`/users/${slug}/users/dashboard`),
  getUsers:         (slug, p)   => api.get(`/users/${slug}/users`, { params: p }),
  getUser:          (slug, id)  => api.get(`/users/${slug}/users/${id}`),
  toggleUserStatus: (slug, id)  => api.put(`/users/${slug}/users/${id}/toggle`),
};
