// src/types/auth.ts
export type UserRole = 'super_admin' | 'depot_manager' | 'scheduler' | 'ticket_officer' | 'viewer';

export interface User {
    id?: number;
    admin_id?: number;
    username?: string;
    email?: string;
    full_name?: string;
    name?: string;
    role: UserRole;
    phone?: string;
    status?: string;
    permissions?: string[];
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        admin: {
            admin_id: number;
            username: string;
            email: string;
            full_name: string;
            role: UserRole;
            phone?: string;
            status?: string;
        };
        accessToken: string;
        refreshToken: string;
    };
}