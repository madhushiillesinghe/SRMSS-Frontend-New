// src/app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import Layout from '@/components/feature/Layout';
import api from '@/api/axios';
import { toast } from 'react-hot-toast';

// Types
interface DashboardStats {
    summary: {
        total_routes: number;
        active_routes: number;
        total_buses: number;
        available_buses: string;
        total_drivers: number;
        available_drivers: string;
        active_buses_tracking: number;
    };
    today: {
        total_schedules: number;
        completed: number;
        delayed: number;
        on_time: number;
        on_time_rate: string;
    };
    financial: {
        today_revenue: number;
        monthly_revenue: number;
        monthly_fuel_cost: string;
        monthly_maintenance_cost: string;
    };
    charts: {
        weekly_trips: Array<{
            day: string;
            day_order: number;
            total_trips: number;
            completed_trips: string;
        }>;
        vehicle_utilization: Array<{
            status: string;
            count: number;
            percentage: string;
        }>;
        revenue_trend: Array<{
            date: string;
            daily_revenue: string;
            ticket_count: number;
        }>;
    };
    upcoming_schedules: Array<{
        schedule_id: number;
        schedule_code: string;
        departure_time: string;
        driver_name: string | null;
    }>;
    recent_activities: {
        tickets: Array<any>;
        fuel_logs: Array<any>;
    };
}

interface RoutePerformance {
    route_id: number;
    route_name: string;
    route_code: string;
    total_trips: number;
    completed_trips: string;
    delayed_trips: string;
    avg_delay: string;
    total_passengers: string;
    total_revenue: string;
    avg_occupancy: string;
}

interface DriverPerformance {
    driver_id: number;
    driver_code: string;
    driver_name: string;
    rating: string;
    total_trips: number;
    completed_trips: string;
    delayed_trips: string;
    avg_delay: string;
    total_passengers: string;
    total_revenue: string;
}

interface BusUtilization {
    bus_id: number;
    registration_number: string;
    bus_model: string;
    capacity: number;
    total_trips: number;
    total_passengers: string;
    avg_occupancy: string;
    total_revenue: string;
    total_fuel_liters: string | null;
    total_fuel_cost: string | null;
    net_profit: string | null;
}

const PIE_COLORS = ['#60a5fa', '#34d399', '#c084fc', '#fb923c', '#059669', '#f87171'];

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [routePerformance, setRoutePerformance] = useState<RoutePerformance[]>([]);
    const [driverPerformance, setDriverPerformance] = useState<DriverPerformance[]>([]);
    const [busUtilization, setBusUtilization] = useState<BusUtilization[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'routes' | 'drivers' | 'buses'>('overview');

    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Fetch dashboard stats
    const fetchDashboardStats = async () => {
        try {
            const response = await api.get('/dashboard/stats');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            toast.error('Failed to load dashboard statistics');
        }
    };

    // Fetch route performance
    const fetchRoutePerformance = async () => {
        try {
            const response = await api.get('/dashboard/route-performance');
            if (response.data.success) {
                setRoutePerformance(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching route performance:", error);
        }
    };

    // Fetch driver performance
    const fetchDriverPerformance = async () => {
        try {
            const response = await api.get('/dashboard/driver-performance');
            if (response.data.success) {
                setDriverPerformance(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching driver performance:", error);
        }
    };

    // Fetch bus utilization
    const fetchBusUtilization = async () => {
        try {
            const response = await api.get('/dashboard/bus-utilization');
            if (response.data.success) {
                setBusUtilization(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching bus utilization:", error);
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            await Promise.all([
                fetchDashboardStats(),
                fetchRoutePerformance(),
                fetchDriverPerformance(),
                fetchBusUtilization()
            ]);
            setLoading(false);
        };
        fetchAllData();
    }, []);

    // Prepare chart data
    const tripStatusData = stats ? [
        { name: 'Scheduled', value: stats.today.total_schedules - stats.today.completed - stats.today.delayed, color: '#60a5fa' },
        { name: 'Completed', value: stats.today.completed, color: '#34d399' },
        { name: 'Delayed', value: stats.today.delayed, color: '#fb923c' },
    ] : [];

    // Weekly trips data for bar chart
    const weeklyTripsData = stats?.charts.weekly_trips.map(item => ({
        day: item.day,
        total: item.total_trips,
        completed: parseInt(item.completed_trips)
    })) || [];

    // Revenue trend data for line chart
    const revenueTrendData = stats?.charts.revenue_trend.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: parseFloat(item.daily_revenue),
        tickets: item.ticket_count
    })) || [];

    // Vehicle utilization data for pie chart
    const vehicleUtilizationData = stats?.charts.vehicle_utilization.map(item => ({
        name: item.status === 'available' ? 'Available' : item.status === 'on_route' ? 'On Route' : item.status,
        value: item.count,
        percentage: item.percentage
    })) || [];

    const formatCurrency = (amount: number | string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    <span className="ml-3 text-foreground-500">Loading dashboard...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Header */}
            <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">
                    Welcome back, Admin
                </h1>
                <p className="text-sm text-foreground-400 mt-1">{today}</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
                <div className="bg-white rounded-lg border border-background-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-foreground-400">Active Routes</p>
                            <p className="text-2xl font-bold text-foreground-900 font-heading mt-1">
                                {stats?.summary.active_routes || 0}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-accent-100 flex items-center justify-center">
                            <i className="ri-road-map-line text-accent-700 text-lg"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-background-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-foreground-400">Buses Available</p>
                            <p className="text-2xl font-bold text-foreground-900 font-heading mt-1">
                                {stats?.summary.available_buses || 0}
                            </p>
                            <p className="text-xs text-foreground-400 mt-1">
                                Total: {stats?.summary.total_buses || 0}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                            <i className="ri-bus-2-line text-primary-700 text-lg"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-background-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-foreground-400">Drivers Available</p>
                            <p className="text-2xl font-bold text-foreground-900 font-heading mt-1">
                                {stats?.summary.available_drivers || 0}
                            </p>
                            <p className="text-xs text-foreground-400 mt-1">
                                Total: {stats?.summary.total_drivers || 0}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center">
                            <i className="ri-user-star-line text-secondary-700 text-lg"></i>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg border border-background-200 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-foreground-400">Trips Today</p>
                            <p className="text-2xl font-bold text-foreground-900 font-heading mt-1">
                                {stats?.today.total_schedules || 0}
                            </p>
                            <p className="text-xs text-foreground-400 mt-1">
                                On-Time Rate: {stats?.today.on_time_rate || 0}%
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <i className="ri-route-line text-emerald-700 text-lg"></i>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 md:mb-8">
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-4 border border-primary-200">
                    <p className="text-xs text-primary-600">Today's Revenue</p>
                    <p className="text-xl font-bold text-primary-700">LKR {formatCurrency(stats?.financial.today_revenue || 0)}</p>
                </div>
                <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 rounded-lg p-4 border border-secondary-200">
                    <p className="text-xs text-secondary-600">Monthly Fuel Cost</p>
                    <p className="text-xl font-bold text-secondary-700">LKR {formatCurrency(stats?.financial.monthly_fuel_cost || 0)}</p>
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                    <p className="text-xs text-amber-600">Monthly Maintenance Cost</p>
                    <p className="text-xl font-bold text-amber-700">LKR {formatCurrency(stats?.financial.monthly_maintenance_cost || 0)}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-background-200">
                <div className="flex gap-2">
                    {['overview', 'routes', 'drivers', 'buses'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 text-sm font-semibold transition-all cursor-pointer ${
                                activeTab === tab
                                    ? 'text-primary-600 border-b-2 border-primary-500'
                                    : 'text-foreground-400 hover:text-foreground-600'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Trip Status Pie Chart */}
                    <div className="bg-white rounded-lg border border-background-200 p-5">
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading mb-4">Trip Status Today</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={tripStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {tripStatusData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Vehicle Utilization Pie Chart */}
                    <div className="bg-white rounded-lg border border-background-200 p-5">
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading mb-4">Vehicle Utilization</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={vehicleUtilizationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {vehicleUtilizationData.map((_entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Weekly Trips Bar Chart */}
                    <div className="bg-white rounded-lg border border-background-200 p-5 lg:col-span-2">
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading mb-4">Weekly Trips Overview</h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyTripsData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="day" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total" name="Total Trips" fill="#60a5fa" />
                                    <Bar dataKey="completed" name="Completed Trips" fill="#34d399" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Revenue Trend Line Chart */}
                    {revenueTrendData.length > 0 && (
                        <div className="bg-white rounded-lg border border-background-200 p-5 lg:col-span-2">
                            <h3 className="text-sm font-semibold text-foreground-900 font-heading mb-4">Revenue Trend</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `LKR ${value}`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" name="Daily Revenue" stroke="#f59e0b" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* Upcoming Schedules */}
                    <div className="bg-white rounded-lg border border-background-200 overflow-hidden lg:col-span-2">
                        <div className="px-5 py-3 border-b border-background-200">
                            <h3 className="text-sm font-semibold text-foreground-900 font-heading">Upcoming Schedules</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-background-100 bg-background-50/50">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Schedule Code</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Departure Time</th>
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Driver</th>
                                </tr>
                                </thead>
                                <tbody>
                                {stats?.upcoming_schedules.slice(0, 5).map((schedule) => (
                                    <tr key={schedule.schedule_id} className="border-b border-background-50">
                                        <td className="px-5 py-3 text-foreground-900 font-mono font-semibold text-xs">{schedule.schedule_code}</td>
                                        <td className="px-5 py-3 text-foreground-600 text-xs">{new Date(schedule.departure_time).toLocaleString()}</td>
                                        <td className="px-5 py-3 text-foreground-600">{schedule.driver_name || 'Not Assigned'}</td>
                                    </tr>
                                ))}
                                {(!stats?.upcoming_schedules || stats.upcoming_schedules.length === 0) && (
                                    <tr><td colSpan={3} className="px-5 py-8 text-center text-foreground-400">No upcoming schedules</td></tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Routes Tab */}
            {activeTab === 'routes' && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-background-100 bg-background-50/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Route Code</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Route Name</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Total Trips</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Completed</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Delayed</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Passengers</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Revenue</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Occupancy</th>
                            </tr>
                            </thead>
                            <tbody>
                            {routePerformance.map((route) => (
                                <tr key={route.route_id} className="border-b border-background-50">
                                    <td className="px-5 py-3 text-foreground-900 font-mono font-semibold text-xs">{route.route_code}</td>
                                    <td className="px-5 py-3 text-foreground-800 font-medium">{route.route_name}</td>
                                    <td className="px-5 py-3 text-foreground-600">{route.total_trips}</td>
                                    <td className="px-5 py-3 text-foreground-600">{route.completed_trips}</td>
                                    <td className="px-5 py-3 text-foreground-600">{route.delayed_trips}</td>
                                    <td className="px-5 py-3 text-foreground-600">{route.total_passengers}</td>
                                    <td className="px-5 py-3 text-foreground-800 font-semibold">LKR {formatCurrency(route.total_revenue)}</td>
                                    <td className="px-5 py-3 text-foreground-600">{route.avg_occupancy}%</td>
                                </tr>
                            ))}
                            {routePerformance.length === 0 && (
                                <tr><td colSpan={8} className="px-5 py-12 text-center text-foreground-400">No route data available</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-background-100 bg-background-50/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Driver Code</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Driver Name</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Rating</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Total Trips</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Completed</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Delayed</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Passengers</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Revenue</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Avg Delay</th>
                            </tr>
                            </thead>
                            <tbody>
                            {driverPerformance.map((driver) => (
                                <tr key={driver.driver_id} className="border-b border-background-50">
                                    <td className="px-5 py-3 text-foreground-900 font-mono font-semibold text-xs">{driver.driver_code}</td>
                                    <td className="px-5 py-3 text-foreground-800 font-medium">{driver.driver_name}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1">
                                            <i className={`ri-star-fill text-xs ${parseFloat(driver.rating) >= 4 ? 'text-amber-400' : 'text-gray-300'}`}></i>
                                            <span className="text-xs text-foreground-600">{driver.rating}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-foreground-600">{driver.total_trips}</td>
                                    <td className="px-5 py-3 text-foreground-600">{driver.completed_trips}</td>
                                    <td className="px-5 py-3 text-foreground-600">{driver.delayed_trips}</td>
                                    <td className="px-5 py-3 text-foreground-600">{driver.total_passengers}</td>
                                    <td className="px-5 py-3 text-foreground-800 font-semibold">LKR {formatCurrency(driver.total_revenue)}</td>
                                    <td className="px-5 py-3 text-foreground-600">{parseFloat(driver.avg_delay).toFixed(1)} min</td>
                                </tr>
                            ))}
                            {driverPerformance.length === 0 && (
                                <tr><td colSpan={9} className="px-5 py-12 text-center text-foreground-400">No driver data available</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Buses Tab */}
            {activeTab === 'buses' && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-background-100 bg-background-50/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Reg Number</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Model</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Capacity</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Total Trips</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Passengers</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Occupancy</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Revenue</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Net Profit</th>
                            </tr>
                            </thead>
                            <tbody>
                            {busUtilization.map((bus) => (
                                <tr key={bus.bus_id} className="border-b border-background-50">
                                    <td className="px-5 py-3 text-foreground-900 font-mono font-semibold text-xs">{bus.registration_number}</td>
                                    <td className="px-5 py-3 text-foreground-800 font-medium">{bus.bus_model}</td>
                                    <td className="px-5 py-3 text-foreground-600">{bus.capacity}</td>
                                    <td className="px-5 py-3 text-foreground-600">{bus.total_trips}</td>
                                    <td className="px-5 py-3 text-foreground-600">{bus.total_passengers}</td>
                                    <td className="px-5 py-3 text-foreground-600">{bus.avg_occupancy}%</td>
                                    <td className="px-5 py-3 text-foreground-800 font-semibold">LKR {formatCurrency(bus.total_revenue)}</td>
                                    <td className={`px-5 py-3 font-semibold ${bus.net_profit && parseFloat(bus.net_profit) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {bus.net_profit ? `LKR ${formatCurrency(bus.net_profit)}` : '—'}
                                    </td>
                                </tr>
                            ))}
                            {busUtilization.length === 0 && (
                                <tr><td colSpan={8} className="px-5 py-12 text-center text-foreground-400">No bus utilization data available</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
}