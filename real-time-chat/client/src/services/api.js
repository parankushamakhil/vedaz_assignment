import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(message));
  }
);

/**
 * Fetch chat history
 */
export const getMessages = async (username, withUser, limit = 50, page = 1) => {
  const response = await api.get('/messages', {
    params: { username, withUser, limit, page },
  });
  return response;
};

/**
 * Fetch latest messages (for initial load)
 */
export const getLatestMessages = async (username, withUser, limit = 50) => {
  const response = await api.get('/messages', {
    params: { latest: true, username, withUser, limit },
  });
  return response;
};

/**
 * Send a message via REST (fallback)
 */
export const sendMessageREST = async (username, receiver, content) => {
  const response = await api.post('/messages', { username, receiver, content });
  return response;
};

/**
 * Health check
 */
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response;
};

/**
 * Fetch contacts
 */
export const getContacts = async (username) => {
  const response = await api.get('/users/contacts', {
    params: { username }
  });
  return response;
};

export default api;
