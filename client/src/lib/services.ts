import { fetchApi } from './api';

export const authApi = {
  login: (email: string, password: string) =>
    fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => fetchApi('/auth/me'),
};

export const dashboardApi = {
  getStats: () => fetchApi('/dashboard/stats'),
  getCharts: () => fetchApi('/dashboard/charts'),
};

export const notificationsApi = {
  getAll: () => fetchApi('/notifications'),
  markAsRead: (id: string) => fetchApi(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllAsRead: () => fetchApi('/notifications/read-all', { method: 'PATCH' }),
};

export const patientsApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi(`/patients${qs}`);
  },
  getOne: (id: string) => fetchApi(`/patients/${id}`),
  create: (data: any) => fetchApi('/patients', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchApi(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const doctorsApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi(`/doctors${qs}`);
  },
  getOne: (id: string) => fetchApi(`/doctors/${id}`),
  getSchedule: (id: string, date: string) => fetchApi(`/doctors/${id}/schedule?date=${date}`),
};

export const departmentsApi = {
  getAll: () => fetchApi('/departments'),
  create: (data: any) => fetchApi('/departments', { method: 'POST', body: JSON.stringify(data) }),
};

export const appointmentsApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi(`/appointments${qs}`);
  },
  create: (data: any) => fetchApi('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    fetchApi(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  reschedule: (id: string, appointmentDate: string) =>
    fetchApi(`/appointments/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ appointmentDate }) }),
};

export const consultationsApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi(`/consultations${qs}`);
  },
  getOne: (id: string) => fetchApi(`/consultations/${id}`),
  create: (data: any) => fetchApi('/consultations', { method: 'POST', body: JSON.stringify(data) }),
};

export const pharmacyApi = {
  getMedicines: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi(`/pharmacy/medicines${qs}`);
  },
  createMedicine: (data: any) => fetchApi('/pharmacy/medicines', { method: 'POST', body: JSON.stringify(data) }),
  addBatch: (data: any) => fetchApi('/pharmacy/batches', { method: 'POST', body: JSON.stringify(data) }),
  getSuppliers: () => fetchApi('/pharmacy/suppliers'),
  createSupplier: (data: any) => fetchApi('/pharmacy/suppliers', { method: 'POST', body: JSON.stringify(data) }),
};

export const labApi = {
  getTests: () => fetchApi('/lab/tests'),
  createTest: (data: any) => fetchApi('/lab/tests', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi(`/lab/orders${qs}`);
  },
  createOrder: (data: any) => fetchApi('/lab/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id: string, status: string) =>
    fetchApi(`/lab/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  enterResult: (data: any) => fetchApi('/lab/results', { method: 'POST', body: JSON.stringify(data) }),
};

export const billingApi = {
  getInvoices: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi(`/billing/invoices${qs}`);
  },
  getOne: (id: string) => fetchApi(`/billing/invoices/${id}`),
  create: (data: any) => fetchApi('/billing/invoices', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (data: any) => fetchApi('/billing/payments', { method: 'POST', body: JSON.stringify(data) }),
};

export const wardsApi = {
  getAll: () => fetchApi('/wards'),
  getAdmissions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi(`/admissions${qs}`);
  },
  admit: (data: any) => fetchApi('/admissions', { method: 'POST', body: JSON.stringify(data) }),
  discharge: (id: string, data: any) =>
    fetchApi(`/admissions/${id}/discharge`, { method: 'PATCH', body: JSON.stringify(data) }),
};
