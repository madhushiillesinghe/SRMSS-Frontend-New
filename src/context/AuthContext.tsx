// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SessionManager from '../utils/sessionManager';

export interface User {
    admin_id?: number;
    id?: number;
    username?: string;
    email?: string;
    full_name?: string;
    name?: string;
    role?: string;
    permissions?: string[];
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    login: (data: any) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = () => {
            try {
                const storedUser = SessionManager.getUser();
                if (storedUser) {
                    setUser(storedUser);
                }
            } catch (error) {
                console.error('Failed to load user:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = (data: any) => {
        try {
            console.log("Login data received:", data);

            // Handle your API response structure
            let userData = null;
            let accessToken = null;
            let refreshToken = null;

            // Extract user data from response
            if (data.data && data.data.admin) {
                // Your API structure: { success, message, data: { admin, accessToken, refreshToken } }
                userData = data.data.admin;
                accessToken = data.data.accessToken;
                refreshToken = data.data.refreshToken;
            } else if (data.data && data.data.user) {
                userData = data.data.user;
                accessToken = data.data.accessToken;
                refreshToken = data.data.refreshToken;
            } else if (data.user) {
                userData = data.user;
                accessToken = data.accessToken;
                refreshToken = data.refreshToken;
            } else if (data.admin) {
                userData = data.admin;
                accessToken = data.accessToken;
                refreshToken = data.refreshToken;
            } else {
                userData = data;
            }

            // Normalize user data
            if (userData) {
                // Map admin object fields to expected format
                const normalizedUser = {
                    id: userData.admin_id || userData.id,
                    username: userData.username,
                    email: userData.email,
                    name: userData.full_name || userData.name,
                    role: userData.role,
                    ...userData
                };

                setUser(normalizedUser);
                SessionManager.setUser(normalizedUser);
                console.log("User set:", normalizedUser);
            }

            // Store tokens
            if (accessToken) {
                SessionManager.setAccessToken(accessToken);
            }
            if (refreshToken) {
                SessionManager.setRefreshToken(refreshToken);
            }

        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const logout = () => {
        try {
            setUser(null);
            SessionManager.clearSession();
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            const updatedUser = { ...user, ...userData };
            setUser(updatedUser);
            SessionManager.setUser(updatedUser);
        }
    };

    const isAuthenticated = !!user && SessionManager.isLoggedIn();

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated,
                loading,
                updateUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}