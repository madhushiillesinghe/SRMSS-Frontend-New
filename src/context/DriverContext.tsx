// src/context/DriverContext.tsx
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { DriverUser } from '../types';

interface DriverContextType {
    driver: DriverUser | null;
    loginDriver: (user: DriverUser, token: string) => void;
    logoutDriver: () => void;
    token: string | null;
}

const DriverContext = createContext<DriverContextType | null>(null);

export const DriverProvider = ({ children }: { children: ReactNode }) => {
    const [driver, setDriver] = useState<DriverUser | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Load from localStorage on app start
        const storedToken = localStorage.getItem('driverToken');
        const storedDriver = localStorage.getItem('driver');
        if (storedToken && storedDriver) {
            setToken(storedToken);
            setDriver(JSON.parse(storedDriver));
        }
    }, []);

    const loginDriver = useCallback((user: DriverUser, authToken: string) => {
        setDriver(user);
        setToken(authToken);
        localStorage.setItem('driverToken', authToken);
        localStorage.setItem('driver', JSON.stringify(user));
    }, []);

    const logoutDriver = useCallback(() => {
        setDriver(null);
        setToken(null);
        localStorage.removeItem('driverToken');
        localStorage.removeItem('driver');
    }, []);

    return (
        <DriverContext.Provider value={{ driver, loginDriver, logoutDriver, token }}>
            {children}
        </DriverContext.Provider>
    );
};

export const useDriver = () => {
    const ctx = useContext(DriverContext);
    if (!ctx) throw new Error('useDriver must be used inside DriverProvider');
    return ctx;
};