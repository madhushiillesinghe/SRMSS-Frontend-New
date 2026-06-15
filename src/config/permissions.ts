// src/config/permissions.ts
import type { UserRole } from "../types/auth";

export const rolePermissions: Record<UserRole, string[]> = {
    super_admin: [
        'dashboard', 'routes', 'buses', 'drivers', 'schedules',
        'tracker', 'tickets', 'fuel-logs', 'maintenance-logs',
        'reports', 'admin-users','settings','lo'
    ],
    depot_manager: [
        'dashboard', 'routes', 'buses', 'drivers',
        'schedules', 'tracker', 'reports','settings'
    ],
    scheduler: [
        'dashboard', 'routes', 'schedules', 'tracker',
        'buses', 'drivers', 'reports','settings'
    ],
    ticket_officer: [
        'dashboard', 'tickets', 'routes', 'schedules', 'tracker','settings'
    ],
    viewer: [
        'dashboard', 'routes', 'schedules', 'tracker', 'reports','settings'
    ],

};

// Helper — check if a role can access a module
export const canAccess = (role: UserRole, module: string): boolean => {
    return rolePermissions[role]?.includes(module) ?? false;
};

// Get all available modules for a role
export const getAvailableModules = (role: UserRole): string[] => {
    return rolePermissions[role] || [];
};

// Check if user has multiple permissions
export const hasAllPermissions = (role: UserRole, modules: string[]): boolean => {
    return modules.every(module => canAccess(role, module));
};

// Check if user has any of the permissions
export const hasAnyPermission = (role: UserRole, modules: string[]): boolean => {
    return modules.some(module => canAccess(role, module));
};