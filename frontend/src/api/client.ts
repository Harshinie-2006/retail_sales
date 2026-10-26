// API Client with automatic CSRF token and HttpOnly cookie transmission

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api';

function getCsrfToken(): string | null {
  const match = document.cookie.match(new RegExp('(^| )shelf_csrf_token=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Inject Bearer token if present in localStorage
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('shelf_access_token') : null;
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Inject CSRF token on mutating requests
  const csrf = getCsrfToken();
  if (csrf && options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    headers.set('X-CSRF-Token', csrf);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Send and receive HttpOnly cookies
  });

  if (!response.ok) {
    if (response.status === 401 && typeof localStorage !== 'undefined') {
      localStorage.removeItem('shelf_access_token');
    }
    let errorDetail = 'Network request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = `${response.status} ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    return response.json();
  }
  return response as unknown as T;
}

export const api = {
  // Auth
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiRequest<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res?.access_token && typeof localStorage !== 'undefined') {
      localStorage.setItem('shelf_access_token', res.access_token);
    }
    return res;
  },
  register: (payload: { email: string; password: string; role?: string }) =>
    apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: async () => {
    try {
      await apiRequest<any>('/auth/logout', { method: 'POST' });
    } finally {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('shelf_access_token');
      }
    }
  },
  getMe: () =>
    apiRequest<{ user: any }>('/auth/me'),

  // Dataset
  validateFile: (formData: FormData) =>
    apiRequest<any>('/dataset/validate', { method: 'POST', body: formData }),
  uploadFile: (formData: FormData) =>
    apiRequest<any>('/dataset/upload', { method: 'POST', body: formData }),
  loadDefaultDataset: () =>
    apiRequest<any>('/dataset/load-default', { method: 'POST' }),
  getCurrentDataset: () =>
    apiRequest<any>('/dataset/current'),

  // Analytics
  getOverview: () =>
    apiRequest<any>('/analytics/overview'),

  // Forecast
  startForecast: (payload: { dataset_id?: string; sample_mode?: boolean }) =>
    apiRequest<any>('/forecast/start', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getForecastStatus: () =>
    apiRequest<any>('/forecast/status'),
  getForecastResults: () =>
    apiRequest<any>('/forecast/results'),

  // Promotions
  getPromotionsImpact: () =>
    apiRequest<any>('/promotions/impact'),

  // Elasticity
  getElasticityEstimates: () =>
    apiRequest<any>('/elasticity/estimates'),
  simulatePriceChange: (payload: { category: string; price_change_pct: number }) =>
    apiRequest<any>('/elasticity/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Export URLs
  getPredictionsCsvUrl: () => `${BASE_URL}/export/predictions-csv`,
  getSummaryPdfUrl: () => `${BASE_URL}/export/summary-pdf`,

  // Audit
  getAuditLogs: (params: { limit?: number; action?: string; user_email?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.limit) q.set('limit', String(params.limit));
    if (params.action) q.set('action', params.action);
    if (params.user_email) q.set('user_email', params.user_email);
    return apiRequest<any[]>(`/audit/logs?${q.toString()}`);
  },
};
