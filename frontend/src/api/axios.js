import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log('🌐 [axios] API base URL:', API_BASE);

const api = axios.create({
    baseURL: API_BASE,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Attach a Clerk session token to a single request.
 * Usage: api.get('/users/me', withToken(token))
 */
export const withToken = (token) => ({
    headers: { Authorization: `Bearer ${token}` },
});

// Request interceptor — log every outgoing request
api.interceptors.request.use(
    (config) => {
        console.log(`➡️  [API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ [API] Request error:', error.message);
        return Promise.reject(error);
    }
);

// Response interceptor — log responses and handle 401
api.interceptors.response.use(
    (response) => {
        console.log(`✅ [API] ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url;
        console.error(`❌ [API] ${status ?? 'Network Error'} ${url} —`, error.message);

        if (status === 401) {
            console.warn('⚠️  [API] 401 Unauthorized — token may be expired or missing');
        }
        if (status === 403) {
            console.warn('⚠️  [API] 403 Forbidden — insufficient role permissions');
        }

        return Promise.reject(error);
    }
);

export default api;
