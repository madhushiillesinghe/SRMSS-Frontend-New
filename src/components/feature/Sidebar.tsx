import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '@/config/permissions.ts';
import {UserRole} from "@/types/auth.ts";

interface NavItem {
    path: string;
    icon: string;
    label: string;
    module: string;
}

const navItems: NavItem[] = [
    { path: '/dashboard',        icon: 'ri-dashboard-3-line',      label: 'Dashboard',       module: 'dashboard' },
    { path: '/routes',           icon: 'ri-road-map-line',         label: 'Routes',          module: 'routes' },
    { path: '/buses',            icon: 'ri-bus-2-line',            label: 'Buses',           module: 'buses' },
    { path: '/drivers',          icon: 'ri-user-star-line',        label: 'Drivers',         module: 'drivers' },
    { path: '/schedules',        icon: 'ri-calendar-schedule-line',label: 'Schedules',       module: 'schedules' },
    { path: '/tracker',          icon: 'ri-radar-line',            label: 'Live Tracker',    module: 'tracker' },
    { path: '/tickets',          icon: 'ri-coupon-3-line',         label: 'Tickets',         module: 'tickets' },
    { path: '/fuel-logs',        icon: 'ri-oil-line',              label: 'Fuel Logs',       module: 'fuel-logs' },
    { path: '/maintenance-logs', icon: 'ri-tools-line',            label: 'Maintenance',     module: 'maintenance-logs' },
    { path: '/reports',          icon: 'ri-file-chart-2-line',     label: 'Reports',         module: 'reports' },
    { path: '/admin-users',      icon: 'ri-shield-user-line',      label: 'Admin Users',     module: 'admin-users' },
    { path: '/settings',         icon: 'ri-settings-line',         label: 'Settings',        module: 'settings' },
];

const roleBadgeStyles: Record<string, string> = {
    super_admin:        'bg-purple-100 text-purple-600',
    admin:              'bg-red-100 text-red-600',
    depot_manager:      'bg-blue-100 text-blue-600',
    logistics_officer:  'bg-green-100 text-green-600',
    depot_clerk:        'bg-yellow-100 text-yellow-600',
};

const roleLabels: Record<string, string> = {
    super_admin:        'Super Admin',
    admin:              'Admin',
    depot_manager:      'Depot Manager',
    logistics_officer:  'Logistics Officer',
    depot_clerk:        'Depot Clerk',
};

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();

    const visibleNavItems = navItems.filter(
        (item) => user && canAccess(user.role as UserRole, item.module)
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-md bg-primary-500 text-white flex items-center justify-center shadow-lg cursor-pointer"
            >
                <i className={`ri-${collapsed ? 'menu-line' : 'close-line'} text-lg`}></i>
            </button>

            {/* Overlay for mobile */}
            {!collapsed && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    onClick={() => setCollapsed(true)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full z-40 bg-white border-r border-background-200 flex flex-col transition-transform duration-300 ${
                    collapsed ? '-translate-x-full' : 'translate-x-0'
                } md:translate-x-0 w-64 md:w-64`}
            >
                {/* Logo - now clickable to /settings */}
                <div
                    className="h-16 flex items-center gap-3 px-5 border-b border-background-200 flex-shrink-0 cursor-pointer hover:bg-background-50 transition-colors"
                    onClick={() => navigate('/settings')}
                >
                    <div className="w-9 h-9 rounded-md bg-primary-500 flex items-center justify-center">
                        <i className="ri-bus-wifi-line text-white text-lg"></i>
                    </div>
                    <div className="overflow-hidden">
                        <h1 className="text-sm font-bold text-foreground-900 font-heading whitespace-nowrap">SRMSS</h1>
                        <p className="text-[10px] text-foreground-400 whitespace-nowrap">Route Management</p>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex-1 overflow-y-auto py-3 px-3">
                    <p className="text-[11px] font-semibold text-foreground-400 uppercase tracking-wider px-2 mb-2">Main Menu</p>
                    {visibleNavItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <button
                                key={item.path}
                                onClick={() => {
                                    navigate(item.path);
                                    setCollapsed(true);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium mb-1 transition-all duration-150 cursor-pointer whitespace-nowrap ${
                                    isActive
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-foreground-600 hover:bg-background-100 hover:text-foreground-900'
                                }`}
                            >
                                <i className={`${item.icon} text-lg ${isActive ? 'text-primary-500' : 'text-foreground-400'}`}></i>
                                <span>{item.label}</span>
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User & Logout */}
                <div className="p-4 border-t border-background-200">
                    {user && (
                        <div
                            className="flex items-center gap-3 px-2 mb-3 cursor-pointer hover:bg-background-50 rounded-md transition-colors"
                            onClick={() => navigate('/settings')}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                <i className="ri-user-line text-primary-600 text-sm"></i>
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium text-foreground-800 truncate">
                                    {user.name || user.full_name || user.username}
                                </p>
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${roleBadgeStyles[user.role]}`}>
                                    {roleLabels[user.role] || user.role}
                                </span>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground-500 hover:bg-background-100 hover:text-red-500 transition-colors cursor-pointer whitespace-nowrap"
                    >
                        <i className="ri-logout-box-r-line"></i>
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>
        </>
    );
}