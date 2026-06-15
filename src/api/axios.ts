// src/api/axios.js
import axios from 'axios';
import SessionManager from '../utils/sessionManager';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: { 'Content-Type': 'application/json' },
});

// ✅ Corrected request interceptor
api.interceptors.request.use(
    (config) => {
        // Determine if this is a driver endpoint
        const isDriverEndpoint = config.url?.includes('/drivers/me/schedule') ||
            config.url?.includes('/drivers/login') ||
            (config.url?.includes('/schedules/') && config.url?.includes('/arrive'));

        if (isDriverEndpoint) {
            const driverToken = localStorage.getItem('driverToken');
            if (driverToken) {
                config.headers.Authorization = `Bearer ${driverToken}`;
            }
        } else {
            // Admin routes (including /schedules, /routes, /buses, etc.)
            const token = SessionManager.getAccessToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ✅ Response interceptor – only refresh admin tokens
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        // Only driver endpoints should not trigger refresh
        const isDriverRequest = originalRequest.url?.includes('/drivers/me/schedule') ||
            (originalRequest.url?.includes('/schedules/') && originalRequest.url?.includes('/arrive'));

        if (isDriverRequest) {
            return Promise.reject(error);
        }

        // Admin token refresh logic
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const refreshToken = SessionManager.getRefreshToken();
                if (!refreshToken) throw new Error('No refresh token');
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/refresh`,
                    { refreshToken }
                );
                const accessToken = response.data.data.accessToken;
                SessionManager.setAccessToken(accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (err) {
                SessionManager.clearSession();
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export default api;