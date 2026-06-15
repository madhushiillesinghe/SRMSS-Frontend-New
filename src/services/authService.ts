// src/services/authService.js
import api from '../api/axios.js';

export const authService = {
    login: async (username, password) => {
        try {
            const response = await api.post('/auth/login', {
                username,
                password,
            });

            console.log("Raw API response:", response);

            // Check if login was unsuccessful
            if (!response.data || response.data.success === false) {
                const errorMsg = response.data?.message || 'Invalid username or password';
                throw new Error(errorMsg);
            }

            // Validate response has required data
            if (!response.data?.data?.accessToken) {
                throw new Error('Invalid username or password');
            }

            // Only store tokens on successful login
            const accessToken = response.data.data.accessToken;
            const refreshToken = response.data.data.refreshToken;

            // Import SessionManager only on success
            const SessionManager = await import('../utils/sessionManager').then(m => m.default);

            // Store tokens
            if (accessToken && typeof accessToken === 'string' && accessToken.length > 0) {
                SessionManager.setAccessToken(accessToken);
            }

            if (refreshToken && typeof refreshToken === 'string' && refreshToken.length > 0) {
                SessionManager.setRefreshToken(refreshToken);
            }

            // Store user data
            const userData = response.data.data.admin || response.data.data.user;
            if (userData) {
                SessionManager.setUser(userData);
            }

            return response.data;

        } catch (error) {
            console.error("Login service error:", error);

            // DON'T clear storage here - just return error
            // Remove any SessionManager.clearSession() calls

            // Return a clean error message
            throw new Error('Invalid username or password');
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            // Only clear on explicit logout
            try {
                const SessionManager = await import('../utils/sessionManager').then(m => m.default);
                SessionManager.clearSession();
            } catch (e) {
                console.error("Error clearing session:", e);
            }
        }
    },
};