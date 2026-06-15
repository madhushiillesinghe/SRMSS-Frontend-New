'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/feature/Layout';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';

interface MaintenanceLog {
    log_id: number;
    bus_id: number;
    maintenance_date: string;
    maintenance_type: 'routine' | 'corrective' | 'emergency' | 'preventive';
    maintenance_category: 'engine' | 'brake' | 'tire' | 'electrical' | 'body' | 'AC' | 'other';
    description: string;
    odometer_at_service: number;
    cost: number;
    vendor_name: string;
    invoice_number: string;
    next_due_date: string | null;
    next_due_odometer: number | null;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    completed_by: string;
    remarks: string;
    performed_by: number;
    created_at: string;
    updated_at: string;
    Bus?: {
        bus_id: number;
        registration_number: string;
        bus_model: string;
    };
}

interface Bus {
    bus_id: number;
    registration_number: string;
    bus_model: string;
}

interface MaintenanceStatistics {
    total_maintenance: number;
    routine_count: number;
    corrective_count: number;
    emergency_count: number;
    preventive_count: number;
    total_cost: string;
    avg_cost: string;
    engine_cost: string;
    brake_cost: string;
    tire_cost: string;
    electrical_cost: string;
    ac_cost: string;
}

const statusBadge: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
};

const typeBadge: Record<string, string> = {
    routine: 'bg-secondary-100 text-secondary-700',
    corrective: 'bg-amber-100 text-amber-700',
    emergency: 'bg-red-100 text-red-700',
    preventive: 'bg-accent-100 text-accent-700',
};

const categoryBadge: Record<string, string> = {
    engine: 'bg-purple-100 text-purple-700',
    brake: 'bg-blue-100 text-blue-700',
    tire: 'bg-emerald-100 text-emerald-700',
    electrical: 'bg-yellow-100 text-yellow-700',
    body: 'bg-pink-100 text-pink-700',
    AC: 'bg-cyan-100 text-cyan-700',
    other: 'bg-gray-100 text-gray-600',
};

// Helper function to safely convert to number
const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
};

const formatCurrency = (value: any): string => {
    const num = toNumber(value);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function MaintenanceLogsPage() {
    const [logs, setLogs] = useState<MaintenanceLog[]>([]);
    const [buses, setBuses] = useState<Bus[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
    const [statistics, setStatistics] = useState<MaintenanceStatistics | null>(null);
    const [upcomingMaintenance, setUpcomingMaintenance] = useState<MaintenanceLog[]>([]);
    const [form, setForm] = useState({
        bus_id: '',
        maintenance_date: new Date().toISOString().slice(0, 10),
        maintenance_type: 'routine',
        maintenance_category: 'engine',
        description: '',
        odometer_at_service: 0,
        cost: 0,
        vendor_name: '',
        invoice_number: '',
        next_due_date: '',
        next_due_odometer: 0,
        status: 'scheduled',
        completed_by: '',
        remarks: '',
    });
    const [deleteConfirm, setDeleteConfirm] = useState<MaintenanceLog | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    // Fetch all maintenance logs
    const fetchMaintenanceLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/maintenance');
            if (response.data.success) {
                setLogs(response.data.data);
            } else {
                toast.error('Failed to load maintenance logs');
            }
        } catch (error: any) {
            console.error("Error fetching maintenance logs:", error);
            toast.error(error.response?.data?.message || 'Failed to load maintenance logs');
        } finally {
            setLoading(false);
        }
    };

    // Fetch buses for dropdown
    const fetchBuses = async () => {
        try {
            const response = await api.get('/buses');
            if (response.data.success) {
                setBuses(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching buses:", error);
        }
    };

    // Fetch maintenance statistics
    const fetchStatistics = async () => {
        try {
            const response = await api.get('/maintenance/statistics?days=90');
            if (response.data.success) {
                setStatistics(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching statistics:", error);
        }
    };

    // Fetch upcoming maintenance
    const fetchUpcomingMaintenance = async () => {
        try {
            const response = await api.get('/maintenance/upcoming?days=30');
            if (response.data.success) {
                setUpcomingMaintenance(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching upcoming maintenance:", error);
        }
    };

    useEffect(() => {
        fetchMaintenanceLogs();
        fetchBuses();
        fetchStatistics();
        fetchUpcomingMaintenance();
    }, []);

    const filteredLogs = logs.filter((log) =>
        log.Bus?.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
        log.maintenance_type?.toLowerCase().includes(search.toLowerCase()) ||
        log.maintenance_category?.toLowerCase().includes(search.toLowerCase()) ||
        log.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.invoice_number?.toLowerCase().includes(search.toLowerCase())
    );

    // Calculate total cost
    const totalCost = logs.filter(l => l.status === 'completed').reduce((sum, l) => sum + toNumber(l.cost), 0);

    // Create new maintenance log
    const handleCreate = async () => {
        if (!form.bus_id || !form.maintenance_date || !form.description) {
            toast.error('Please fill all required fields');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                bus_id: parseInt(form.bus_id),
                maintenance_date: form.maintenance_date,
                maintenance_type: form.maintenance_type,
                maintenance_category: form.maintenance_category,
                description: form.description,
                odometer_at_service: form.odometer_at_service,
                cost: form.cost,
                vendor_name: form.vendor_name || null,
                invoice_number: form.invoice_number || null,
                next_due_date: form.next_due_date || null,
                next_due_odometer: form.next_due_odometer || null,
                status: form.status,
                completed_by: form.completed_by || null,
                remarks: form.remarks || null,
            };

            const response = await api.post('/maintenance', payload);
            if (response.data.success) {
                toast.success('Maintenance log created successfully');
                fetchMaintenanceLogs();
                fetchStatistics();
                fetchUpcomingMaintenance();
                setShowAddModal(false);
                resetForm();
            } else {
                toast.error(response.data.message || 'Failed to create maintenance log');
            }
        } catch (error: any) {
            console.error("Create error:", error);
            toast.error(error.response?.data?.message || 'Failed to create maintenance log');
        } finally {
            setFormLoading(false);
        }
    };

    // Update maintenance log
    const handleUpdate = async () => {
        if (!selectedLog) return;
        if (!form.bus_id || !form.maintenance_date || !form.description) {
            toast.error('Please fill all required fields');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                bus_id: parseInt(form.bus_id),
                maintenance_date: form.maintenance_date,
                maintenance_type: form.maintenance_type,
                maintenance_category: form.maintenance_category,
                description: form.description,
                odometer_at_service: form.odometer_at_service,
                cost: form.cost,
                vendor_name: form.vendor_name || null,
                invoice_number: form.invoice_number || null,
                next_due_date: form.next_due_date || null,
                next_due_odometer: form.next_due_odometer || null,
                status: form.status,
                completed_by: form.completed_by || null,
                remarks: form.remarks || null,
            };

            const response = await api.put(`/maintenance/${selectedLog.log_id}`, payload);
            if (response.data.success) {
                toast.success('Maintenance log updated successfully');
                fetchMaintenanceLogs();
                fetchStatistics();
                fetchUpcomingMaintenance();
                setShowEditModal(false);
                setSelectedLog(null);
                resetForm();
            } else {
                toast.error(response.data.message || 'Failed to update maintenance log');
            }
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || 'Failed to update maintenance log');
        } finally {
            setFormLoading(false);
        }
    };

    // Complete maintenance
    const handleCompleteMaintenance = async (logId: number, log: MaintenanceLog) => {
        try {
            const response = await api.put(`/maintenance/${logId}/complete`);
            if (response.data.success) {
                toast.success('Maintenance marked as completed');
                fetchMaintenanceLogs();
                fetchStatistics();
                fetchUpcomingMaintenance();
            } else {
                toast.error(response.data.message || 'Failed to complete maintenance');
            }
        } catch (error: any) {
            console.error("Complete error:", error);
            toast.error(error.response?.data?.message || 'Failed to complete maintenance');
        }
    };

    // Delete maintenance log
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const response = await api.delete(`/maintenance/${deleteConfirm.log_id}`);
            if (response.data.success) {
                toast.success('Maintenance log deleted successfully');
                fetchMaintenanceLogs();
                fetchStatistics();
                fetchUpcomingMaintenance();
                setDeleteConfirm(null);
                setShowDeleteModal(false);
            } else {
                toast.error(response.data.message || 'Failed to delete maintenance log');
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || 'Failed to delete maintenance log');
        }
    };

    const resetForm = () => {
        setForm({
            bus_id: '',
            maintenance_date: new Date().toISOString().slice(0, 10),
            maintenance_type: 'routine',
            maintenance_category: 'engine',
            description: '',
            odometer_at_service: 0,
            cost: 0,
            vendor_name: '',
            invoice_number: '',
            next_due_date: '',
            next_due_odometer: 0,
            status: 'scheduled',
            completed_by: '',
            remarks: '',
        });
    };

    const openEditModal = (log: MaintenanceLog) => {
        setSelectedLog(log);
        setForm({
            bus_id: log.bus_id.toString(),
            maintenance_date: log.maintenance_date,
            maintenance_type: log.maintenance_type,
            maintenance_category: log.maintenance_category,
            description: log.description,
            odometer_at_service: toNumber(log.odometer_at_service),
            cost: toNumber(log.cost),
            vendor_name: log.vendor_name || '',
            invoice_number: log.invoice_number || '',
            next_due_date: log.next_due_date || '',
            next_due_odometer: toNumber(log.next_due_odometer || 0),
            status: log.status,
            completed_by: log.completed_by || '',
            remarks: log.remarks || '',
        });
        setShowEditModal(true);
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Maintenance Logs</h1>
                    <p className="text-sm text-foreground-400 mt-1">Track all fleet maintenance and repair records</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20"
                >
                    <i className="ri-add-line"></i>
                    <span>Add Maintenance Log</span>
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg border border-background-200 p-5">
                    <p className="text-xs text-foreground-400">Total Maintenance Jobs</p>
                    <p className="text-2xl font-bold text-foreground-900 font-heading mt-1">
                        {statistics?.total_maintenance || logs.length}
                    </p>
                </div>
                <div className="bg-white rounded-lg border border-background-200 p-5">
                    <p className="text-xs text-foreground-400">Completed Services</p>
                    <p className="text-2xl font-bold text-emerald-600 font-heading mt-1">
                        {logs.filter(l => l.status === 'completed').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg border border-background-200 p-5">
                    <p className="text-xs text-foreground-400">Total Maintenance Cost</p>
                    <p className="text-2xl font-bold text-primary-600 font-heading mt-1">
                        LKR {formatCurrency(statistics?.total_cost || totalCost)}
                    </p>
                </div>
                <div className="bg-white rounded-lg border border-background-200 p-5">
                    <p className="text-xs text-foreground-400">Upcoming Maintenance</p>
                    <p className="text-2xl font-bold text-amber-600 font-heading mt-1">
                        {upcomingMaintenance.length}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by bus, type, category, vendor or invoice..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <span className="ml-2 text-foreground-500">Loading maintenance logs...</span>
                </div>
            )}

            {/* Table */}
            {!loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-background-100 bg-background-50/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Bus</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Date</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Type</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Category</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Description</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Cost</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Vendor</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Next Due</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.log_id} className="border-b border-background-50 hover:bg-background-50/50 transition-colors">
                                    <td className="px-4 py-3 text-foreground-900 font-mono font-semibold text-xs whitespace-nowrap">
                                        {log.Bus?.registration_number || '-'}
                                        <span className="text-foreground-400 text-xs ml-1">({log.Bus?.bus_model || '-'})</span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap text-xs">{log.maintenance_date}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${typeBadge[log.maintenance_type]}`}>
                                                {log.maintenance_type}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${categoryBadge[log.maintenance_category]}`}>
                                                {log.maintenance_category}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground-700 text-xs max-w-[250px] truncate">
                                        {log.description}
                                    </td>
                                    <td className="px-4 py-3 text-foreground-900 font-semibold whitespace-nowrap">
                                        {log.cost > 0 ? `LKR ${formatCurrency(log.cost)}` : <span className="text-foreground-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap text-xs">{log.vendor_name || '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusBadge[log.status]}`}>
                                                {log.status.replace('_', ' ')}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap text-xs">{log.next_due_date || '—'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openEditModal(log)}
                                                className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                                            >
                                                <i className="ri-edit-line text-sm"></i>
                                            </button>
                                            {log.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleCompleteMaintenance(log.log_id, log)}
                                                    className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                                                >
                                                    <i className="ri-checkbox-circle-line text-sm"></i>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => { setDeleteConfirm(log); setShowDeleteModal(true); }}
                                                className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                            >
                                                <i className="ri-delete-bin-line text-sm"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="px-5 py-12 text-center text-foreground-400">No maintenance logs found</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Maintenance Log Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto bg-black/50">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-foreground-900">Add Maintenance Log</h2>
                            <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-md hover:bg-gray-100">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Bus *</label>
                                    <select
                                        value={form.bus_id}
                                        onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    >
                                        <option value="">Select bus...</option>
                                        {buses.map((b) => (
                                            <option key={b.bus_id} value={b.bus_id}>
                                                {b.registration_number} - {b.bus_model}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Maintenance Date *</label>
                                    <input
                                        type="date"
                                        value={form.maintenance_date}
                                        onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Maintenance Type</label>
                                    <select
                                        value={form.maintenance_type}
                                        onChange={(e) => setForm({ ...form, maintenance_type: e.target.value as any })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    >
                                        <option value="routine">Routine</option>
                                        <option value="corrective">Corrective</option>
                                        <option value="emergency">Emergency</option>
                                        <option value="preventive">Preventive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Maintenance Category</label>
                                    <select
                                        value={form.maintenance_category}
                                        onChange={(e) => setForm({ ...form, maintenance_category: e.target.value as any })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    >
                                        <option value="engine">Engine</option>
                                        <option value="brake">Brake</option>
                                        <option value="tire">Tire</option>
                                        <option value="electrical">Electrical</option>
                                        <option value="body">Body</option>
                                        <option value="AC">AC</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Description *</label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400 resize-none"
                                        placeholder="Detailed description of the maintenance work..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Odometer at Service (km)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.odometer_at_service}
                                        onChange={(e) => setForm({ ...form, odometer_at_service: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Cost (LKR)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.cost}
                                        onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Vendor Name</label>
                                    <input
                                        type="text"
                                        value={form.vendor_name}
                                        onChange={(e) => setForm({ ...form, vendor_name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Invoice Number</label>
                                    <input
                                        type="text"
                                        value={form.invoice_number}
                                        onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Next Due Date</label>
                                    <input
                                        type="date"
                                        value={form.next_due_date}
                                        onChange={(e) => setForm({ ...form, next_due_date: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Next Due Odometer (km)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={form.next_due_odometer}
                                        onChange={(e) => setForm({ ...form, next_due_odometer: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    >
                                        <option value="scheduled">Scheduled</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Completed By</label>
                                    <input
                                        type="text"
                                        value={form.completed_by}
                                        onChange={(e) => setForm({ ...form, completed_by: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground-500 mb-1">Remarks</label>
                                <textarea
                                    value={form.remarks}
                                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm focus:outline-none focus:border-primary-400 resize-none"
                                    placeholder="Additional remarks..."
                                />
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-gray-100">
                                Cancel
                            </button>
                            <button onClick={handleCreate} disabled={formLoading} className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
                                {formLoading ? 'Saving...' : 'Save Log'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Maintenance Log Modal */}
            {showEditModal && selectedLog && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto bg-black/50">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-foreground-900">Edit Maintenance Log</h2>
                            <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-md hover:bg-gray-100">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                                <p className="text-xs text-foreground-500">
                                    Editing log for: <span className="font-semibold">{selectedLog.Bus?.registration_number}</span> - {selectedLog.maintenance_date}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Bus *</label>
                                    <select value={form.bus_id} onChange={(e) => setForm({ ...form, bus_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border">
                                        {buses.map((b) => (<option key={b.bus_id} value={b.bus_id}>{b.registration_number}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Maintenance Date *</label>
                                    <input type="date" value={form.maintenance_date} onChange={(e) => setForm({ ...form, maintenance_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Maintenance Type</label>
                                    <select value={form.maintenance_type} onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border">
                                        <option value="routine">Routine</option><option value="corrective">Corrective</option><option value="emergency">Emergency</option><option value="preventive">Preventive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1">Maintenance Category</label>
                                    <select value={form.maintenance_category} onChange={(e) => setForm({ ...form, maintenance_category: e.target.value })} className="w-full px-3 py-2 rounded-lg border">
                                        <option value="engine">Engine</option><option value="brake">Brake</option><option value="tire">Tire</option><option value="electrical">Electrical</option><option value="body">Body</option><option value="AC">AC</option><option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold mb-1">Description *</label>
                                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border resize-none" />
                                </div>
                                <div><label className="block text-xs font-semibold mb-1">Odometer (km)</label><input type="number" step="0.01" value={form.odometer_at_service} onChange={(e) => setForm({ ...form, odometer_at_service: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Cost (LKR)</label><input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Vendor Name</label><input type="text" value={form.vendor_name} onChange={(e) => setForm({ ...form, vendor_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Invoice Number</label><input type="text" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Next Due Date</label><input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Next Due Odometer</label><input type="number" step="0.01" value={form.next_due_odometer} onChange={(e) => setForm({ ...form, next_due_odometer: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Status</label><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 rounded-lg border"><option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                                <div><label className="block text-xs font-semibold mb-1">Completed By</label><input type="text" value={form.completed_by} onChange={(e) => setForm({ ...form, completed_by: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                            </div>
                            <div className="mt-4"><label className="block text-xs font-semibold mb-1">Remarks</label><textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border resize-none" /></div>
                        </div>
                        <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
                            <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-lg">Cancel</button>
                            <button onClick={handleUpdate} disabled={formLoading} className="px-5 py-2 rounded-lg bg-primary-500 text-white">{formLoading ? 'Updating...' : 'Update Log'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <i className="ri-delete-bin-line text-red-500 text-xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-center">Delete Maintenance Log?</h3>
                        <p className="text-sm text-gray-500 text-center mt-2">
                            Delete maintenance log for <strong>{deleteConfirm.Bus?.registration_number}</strong> on <strong>{deleteConfirm.maintenance_date}</strong>?
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium text-gray-600 hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}