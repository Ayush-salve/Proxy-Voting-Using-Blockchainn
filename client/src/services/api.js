import axios from 'axios';

/**
 * Format and normalize the API Base URL to handle all deployment environments:
 * - Bare hostnames from Render blueprints: "blockproxy-api.onrender.com" -> "https://blockproxy-api.onrender.com/api"
 * - Full URLs without /api: "https://blockproxy-api.onrender.com" -> "https://blockproxy-api.onrender.com/api"
 * - Full URLs with /api: "https://blockproxy-api.onrender.com/api" -> "https://blockproxy-api.onrender.com/api"
 * - Local development: "http://localhost:5000/api" -> "http://localhost:5000/api"
 */
const formatApiUrl = (url) => {
  if (!url || typeof url !== 'string') return 'http://localhost:5000/api';
  let formatted = url.trim();

  // If no protocol is provided and it is not a relative path, default to https://
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://') && !formatted.startsWith('/')) {
    formatted = `https://${formatted}`;
  }

  // Remove trailing slashes
  formatted = formatted.replace(/\/+$/, '');

  // Append /api if not already present
  if (!formatted.endsWith('/api')) {
    formatted = `${formatted}/api`;
  }

  return formatted;
};

const API_BASE_URL = formatApiUrl(import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token to all outgoing API requests
api.interceptors.request.use(
  (config) => {
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
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
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
