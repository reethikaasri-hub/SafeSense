const API_BASE = 'http://localhost:5000/api';

function getHeaders() {
  const token = localStorage.getItem('safesense_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: getHeaders(),
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data;
}

// Auth API
export const authAPI = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  signup: (name, email, password) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    }),

  getMe: () => request('/auth/me')
};

// Dashboard API
export const dashboardAPI = {
  getSummary: () => request('/dashboard')
};

// Sensor API
export const sensorAPI = {
  getLatest: () => request('/sensors/latest'),
  getHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/sensors/history?${qs}`);
  },
  getChart: (points = 50) => request(`/sensors/chart?points=${points}`),
  getStats: () => request('/sensors/stats')
};

// Alert API
export const alertAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/alerts?${qs}`);
  },
  getSummary: () => request('/alerts/summary'),
  resolve: (id) => request(`/alerts/${id}/resolve`, { method: 'PUT' }),
  resolveAll: () => request('/alerts/resolve-all', { method: 'PUT' })
};

// Device API
export const deviceAPI = {
  getAll: () => request('/devices'),
  getById: (id) => request(`/devices/${id}`)
};

// AI API
export const aiAPI = {
  getPredict: () => request('/ai/predict'),
  analyze: (gas_value, temperature, humidity) =>
    request('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ gas_value, temperature, humidity })
    }),
  getStats: () => request('/ai/stats')
};

// Settings API
export const settingsAPI = {
  get: () => request('/settings'),
  update: (settings) =>
    request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    }),
  updateProfile: (profile) =>
    request('/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(profile)
    })
};

// Health API
export const healthAPI = {
  check: () => request('/health')
};
