import axios from 'axios';

/**
 * Format and normalize the API Base URL to handle all deployment environments:
 * - Render blueprint service names: "blockproxy-api-fc6y" -> "https://blockproxy-api-fc6y.onrender.com/api"
 * - Bare hostnames from Render blueprints: "blockproxy-api.onrender.com" -> "https://blockproxy-api.onrender.com/api"
 * - Full URLs without /api: "https://blockproxy-api-fc6y.onrender.com" -> "https://blockproxy-api-fc6y.onrender.com/api"
 * - Full URLs with /api: "https://blockproxy-api-fc6y.onrender.com/api" -> "https://blockproxy-api-fc6y.onrender.com/api"
 * - Local development: "http://localhost:5000/api" -> "http://localhost:5000/api"
 */
export const formatApiUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) return 'http://localhost:5000/api';
  let formatted = url.trim();

  // Strip trailing slashes first
  formatted = formatted.replace(/\/+$/, '');

  // Strip trailing /api if present so we can work with the pure domain/host
  if (formatted.endsWith('/api')) {
    formatted = formatted.slice(0, -4);
  }

  // Remove leading protocol for hostname analysis
  const hasHttp = formatted.startsWith('http://');
  const hasHttps = formatted.startsWith('https://');
  let rawHost = formatted;
  if (hasHttp) rawHost = formatted.replace(/^http:\/\//, '');
  if (hasHttps) rawHost = formatted.replace(/^https:\/\//, '');

  // Strip any accidental trailing slashes from rawHost
  rawHost = rawHost.replace(/\/+$/, '');

  const isLocal = rawHost.startsWith('localhost') || rawHost.startsWith('127.0.0.1');

  // If not local and does not contain any dot (e.g. "blockproxy-api-fc6y" or "blockproxy-api"),
  // it is a Render blueprint internal service identifier that must be suffixed with .onrender.com
  if (!isLocal && !rawHost.includes('.')) {
    rawHost = `${rawHost}.onrender.com`;
  }

  // Determine protocol
  const protocol = isLocal && (hasHttp || !hasHttps) ? 'http://' : 'https://';

  return `${protocol}${rawHost}/api`;
};

export const getApiBaseUrl = () => {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('blockproxy_custom_api_url') : null;
  const envUrl = import.meta.env.VITE_API_URL;
  const effectiveUrl = formatApiUrl(customUrl || envUrl);

  // If the custom URL in localStorage was formatted/repaired, keep it synced
  if (customUrl && typeof window !== 'undefined' && customUrl !== effectiveUrl) {
    localStorage.setItem('blockproxy_custom_api_url', effectiveUrl);
  }

  return effectiveUrl;
};

export const setCustomApiUrl = (url) => {
  if (!url || !url.trim()) {
    localStorage.removeItem('blockproxy_custom_api_url');
  } else {
    const formatted = formatApiUrl(url);
    localStorage.setItem('blockproxy_custom_api_url', formatted);
  }
};

export const resetCustomApiUrl = () => {
  localStorage.removeItem('blockproxy_custom_api_url');
};

export const pingBackendHealth = async (customUrl = null) => {
  const targetBaseUrl = customUrl ? formatApiUrl(customUrl) : getApiBaseUrl();
  const healthUrl = `${targetBaseUrl}/health`;
  const response = await axios.get(healthUrl, { timeout: 15000 });
  return response.data;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach Access Token and dynamic Base URL
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();
    const token = localStorage.getItem('blockproxy_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration and Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 due to token expiry and hasn't already been retried
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('blockproxy_refresh_token');

      if (refreshToken) {
        try {
          const currentBase = getApiBaseUrl();
          const res = await axios.post(`${currentBase}/auth/refresh`, { refreshToken });
          const newAccessToken = res.data.data.accessToken;

          localStorage.setItem('blockproxy_access_token', newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch (refreshErr) {
          // If refresh token fails, purge local tokens and redirect to login
          localStorage.removeItem('blockproxy_access_token');
          localStorage.removeItem('blockproxy_refresh_token');
          localStorage.removeItem('blockproxy_user');
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
