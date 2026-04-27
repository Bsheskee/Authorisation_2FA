import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  tempToken?: string;
  requires2FA: boolean;
}

export interface DashboardData {
  id: number;
  email: string;
  is2faEnabled: boolean;
  createdAt: string;
}

export interface AuditLog {
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: object | null;
  createdAt: string;
}

export const authApi = {
  register: (data: RegisterData) => api.post('/auth/register', data),
  login: (data: LoginData) => api.post<LoginResponse>('/auth/login', data),
  setupTotp: (token: string) =>
    api.post<{ qrCode: string }>('/auth/setup-totp', {}, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  confirmTotp: (code: string, token: string) =>
    api.post('/auth/confirm-totp', { code }, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  verifyTotp: (code: string, tempToken: string) =>
    api.post<{ token: string }>('/auth/verify-totp', { code }, {
      headers: { Authorization: `Bearer ${tempToken}` },
    }),
  logout: () => api.post('/auth/logout'),
};

export const userApi = {
  getDashboard: () => api.get<DashboardData>('/user/dashboard'),
  getAuditLog: () => api.get<{ logs: AuditLog[] }>('/user/audit-log'),
};

export default api;
