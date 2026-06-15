// src/app/fuel-logs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/feature/Layout';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';

interface FuelLog {
    log_id: number;
    bus_id: number;
    schedule_id: number | null;
    fuel_date: string;
    fuel_amount: number | string;
    cost_per_liter: number | string;
    total_cost: number | string;
    odometer_reading: number | string;
    fuel_type: 'Diesel' | 'Petrol' | 'Electric' | 'CNG';
    refueling_location: string;
    receipt_number: string;
    remarks: string;
    recorded_by: number;
    created_at: string;
    Bus?: {
        bus_id: number;
        registration_number: string;
        bus_model: string;
    };
    Schedule?: {
        schedule_id: number;
        schedule_code: string;
    };
}

interface Bus {
    bus_id: number;
    registration_number: string;
    bus_model: string;
    fuel_type: string;
}

interface Schedule {
    schedule_id: number;
    schedule_code: string;
}

interface FuelStatistics {
    total_fuel_liters: string;
    total_cost: string;
    avg_cost_per_liter: string;
    refuel_count: number;
    avg_fuel_per_refuel: string;
    max_fuel: string;
    min_fuel: string;
    effective_rate: string;
}

const fuelTypeColors: Record<string, string> = {
    Diesel: 'bg-amber-100 text-amber-700',
    Petrol: 'bg-sky-100 text-sky-700',
    Electric: 'bg-emerald-100 text-emerald-700',
    CNG: 'bg-purple-100 text-purple-700',
};

const toNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
};

const formatCurrency = (value: any): string => {
    const num = toNumber(value);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function FuelLogsPage() {
    const [logs, setLogs] = useState<FuelLog[]>([]);
    const [buses, setBuses] = useState<Bus[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedLog, setSelectedLog] = useState<FuelLog | null>(null);
    const [statistics, setStatistics] = useState<FuelStatistics | null>(null);
    const [form, setForm] = useState({
        bus_id: '',
        schedule_id: '',
        fuel_date: new Date().toISOString().slice(0, 10),
        fuel_amount: 0,
        cost_per_liter: 0,
        total_cost: 0,
        odometer_reading: 0,
        fuel_type: 'Diesel',
        refueling_location: '',
        receipt_number: '',
        remarks: '',
    });
    const [deleteConfirm, setDeleteConfirm] = useState<FuelLog | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const fetchFuelLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/fuel-logs');
            if (response.data.success) {
                setLogs(response.data.data);
            } else {
                toast.error('Failed to load fuel logs');
            }
        } catch (error: any) {
            console.error("Error fetching fuel logs:", error);
            toast.error(error.response?.data?.message || 'Failed to load fuel logs');
        } finally {
            setLoading(false);
        }
    };

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

    const fetchSchedules = async () => {
        try {
            const response = await api.get('/schedules');
            if (response.data && response.data.success) {
                setSchedules(response.data.data || []);
            } else {
                setSchedules([]);
            }
        } catch (error) {
            console.error("Error fetching schedules:", error);
            setSchedules([]);
        }
    };

    const fetchStatistics = async () => {
        try {
            const response = await api.get('/fuel-logs/statistics?days=30');
            if (response.data.success) {
                setStatistics(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching statistics:", error);
        }
    };

    useEffect(() => {
        fetchFuelLogs();
        fetchBuses();
        fetchSchedules();
        fetchStatistics();
    }, []);

    const filteredLogs = logs.filter((log) =>
        log.Bus?.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
        log.fuel_type?.toLowerCase().includes(search.toLowerCase()) ||
        log.refueling_location?.toLowerCase().includes(search.toLowerCase()) ||
        log.receipt_number?.toLowerCase().includes(search.toLowerCase())
    );

    const calculateTotalCost = (amount: number, costPerLiter: number) => {
        return Math.round(amount * costPerLiter * 100) / 100;
    };

    const handleFuelAmountChange = (amount: number) => {
        setForm({
            ...form,
            fuel_amount: amount,
            total_cost: calculateTotalCost(amount, form.cost_per_liter)
        });
    };

    const handleCostPerLiterChange = (cost: number) => {
        setForm({
            ...form,
            cost_per_liter: cost,
            total_cost: calculateTotalCost(form.fuel_amount, cost)
        });
    };

    const handleCreate = async () => {
        if (!form.bus_id || !form.fuel_date || !form.fuel_amount || !form.cost_per_liter || !form.odometer_reading) {
            toast.error('Please fill all required fields');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                bus_id: parseInt(form.bus_id),
                schedule_id: form.schedule_id ? parseInt(form.schedule_id) : null,
                fuel_date: form.fuel_date,
                fuel_amount: form.fuel_amount,
                cost_per_liter: form.cost_per_liter,
                total_cost: form.total_cost,
                odometer_reading: form.odometer_reading,
                fuel_type: form.fuel_type,
                refueling_location: form.refueling_location || null,
                receipt_number: form.receipt_number || null,
                remarks: form.remarks || null,
            };

            const response = await api.post('/fuel-logs', payload);
            if (response.data.success) {
                toast.success('Fuel log created successfully');
                fetchFuelLogs();
                fetchStatistics();
                setShowAddModal(false);
                resetForm();
            } else {
                toast.error(response.data.message || 'Failed to create fuel log');
            }
        } catch (error: any) {
            console.error("Create error:", error);
            toast.error(error.response?.data?.message || 'Failed to create fuel log');
        } finally {
            setFormLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedLog) return;
        if (!form.bus_id || !form.fuel_date || !form.fuel_amount || !form.cost_per_liter || !form.odometer_reading) {
            toast.error('Please fill all required fields');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                bus_id: parseInt(form.bus_id),
                schedule_id: form.schedule_id ? parseInt(form.schedule_id) : null,
                fuel_date: form.fuel_date,
                fuel_amount: form.fuel_amount,
                cost_per_liter: form.cost_per_liter,
                total_cost: form.total_cost,
                odometer_reading: form.odometer_reading,
                fuel_type: form.fuel_type,
                refueling_location: form.refueling_location || null,
                receipt_number: form.receipt_number || null,
                remarks: form.remarks || null,
            };

            const response = await api.put(`/fuel-logs/${selectedLog.log_id}`, payload);
            if (response.data.success) {
                toast.success('Fuel log updated successfully');
                fetchFuelLogs();
                fetchStatistics();
                setShowEditModal(false);
                setSelectedLog(null);
                resetForm();
            } else {
                toast.error(response.data.message || 'Failed to update fuel log');
            }
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || 'Failed to update fuel log');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const response = await api.delete(`/fuel-logs/${deleteConfirm.log_id}`);
            if (response.data.success) {
                toast.success('Fuel log deleted successfully');
                fetchFuelLogs();
                fetchStatistics();
                setDeleteConfirm(null);
                setShowDeleteModal(false);
            } else {
                toast.error(response.data.message || 'Failed to delete fuel log');
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || 'Failed to delete fuel log');
        }
    };

    const resetForm = () => {
        setForm({
            bus_id: '',
            schedule_id: '',
            fuel_date: new Date().toISOString().slice(0, 10),
            fuel_amount: 0,
            cost_per_liter: 0,
            total_cost: 0,
            odometer_reading: 0,
            fuel_type: 'Diesel',
            refueling_location: '',
            receipt_number: '',
            remarks: '',
        });
    };

    const openEditModal = (log: FuelLog) => {
        setSelectedLog(log);
        setForm({
            bus_id: log.bus_id.toString(),
            schedule_id: log.schedule_id?.toString() || '',
            fuel_date: log.fuel_date,
            fuel_amount: toNumber(log.fuel_amount),
            cost_per_liter: toNumber(log.cost_per_liter),
            total_cost: toNumber(log.total_cost),
            odometer_reading: toNumber(log.odometer_reading),
            fuel_type: log.fuel_type,
            refueling_location: log.refueling_location || '',
            receipt_number: log.receipt_number || '',
            remarks: log.remarks || '',
        });
        setShowEditModal(true);
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Fuel Logs</h1>
                    <p className="text-sm text-foreground-400 mt-1">Track fuel consumption and costs across the fleet</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowAddModal(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20"
                >
                    <i className="ri-add-line"></i>
                    <span>Add Fuel Log</span>
                </button>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-background-200 p-5">
                        <p className="text-xs text-foreground-400">Total Fuel (30 days)</p>
                        <p className="text-2xl font-bold text-primary-600 font-heading mt-1">
                            {toNumber(statistics.total_fuel_liters).toFixed(2)} L
                        </p>
                    </div>
                    <div className="bg-white rounded-lg border border-background-200 p-5">
                        <p className="text-xs text-foreground-400">Total Cost (30 days)</p>
                        <p className="text-2xl font-bold text-emerald-600 font-heading mt-1">
                            LKR {formatCurrency(statistics.total_cost)}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg border border-background-200 p-5">
                        <p className="text-xs text-foreground-400">Average Cost/Liter</p>
                        <p className="text-2xl font-bold text-amber-600 font-heading mt-1">
                            LKR {formatCurrency(statistics.avg_cost_per_liter)}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg border border-background-200 p-5">
                        <p className="text-xs text-foreground-400">Total Refuels</p>
                        <p className="text-2xl font-bold text-foreground-900 font-heading mt-1">
                            {statistics.refuel_count || 0}
                        </p>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by bus, fuel type, location or receipt..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <span className="ml-2 text-foreground-500">Loading fuel logs...</span>
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
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Fuel Type</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Amount</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Cost/L</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Total Cost</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Odometer</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Location</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Receipt</th>
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
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap text-xs">{log.fuel_date}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${fuelTypeColors[log.fuel_type]}`}>
                                                {log.fuel_type}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                                        {toNumber(log.fuel_amount).toFixed(2)} {log.fuel_type === 'Electric' ? 'kWh' : 'L'}
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                                        LKR {formatCurrency(log.cost_per_liter)}
                                    </td>
                                    <td className="px-4 py-3 text-foreground-900 font-semibold whitespace-nowrap">
                                        LKR {formatCurrency(log.total_cost)}
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap">
                                        {toNumber(log.odometer_reading).toLocaleString()} km
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap text-xs">{log.refueling_location || '-'}</td>
                                    <td className="px-4 py-3 text-foreground-500 font-mono text-[10px] whitespace-nowrap">{log.receipt_number || '-'}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openEditModal(log)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                                                <i className="ri-edit-line text-sm"></i>
                                            </button>
                                            <button onClick={() => { setDeleteConfirm(log); setShowDeleteModal(true); }} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                                                <i className="ri-delete-bin-line text-sm"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr><td colSpan={10} className="px-5 py-12 text-center text-foreground-400">No fuel logs found</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-foreground-900">Add Fuel Log</h2>
                            <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-md"><i className="ri-close-line"></i></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold mb-1">Bus *</label>
                                    <select value={form.bus_id} onChange={(e) => setForm({ ...form, bus_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border">
                                        <option value="">Select bus...</option>{buses.map((b) => (<option key={b.bus_id} value={b.bus_id}>{b.registration_number}</option>))}
                                    </select>
                                </div>
                                <div><label className="block text-xs font-semibold mb-1">Fuel Date *</label><input type="date" value={form.fuel_date} onChange={(e) => setForm({ ...form, fuel_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Fuel Type *</label>
                                    <select value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border">
                                        <option value="Diesel">Diesel</option><option value="Petrol">Petrol</option><option value="CNG">CNG</option><option value="Electric">Electric</option>
                                    </select>
                                </div>
                                <div><label className="block text-xs font-semibold mb-1">Schedule</label>
                                    <select value={form.schedule_id} onChange={(e) => setForm({ ...form, schedule_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border">
                                        <option value="">None</option>{schedules.slice(0, 20).map((s) => (<option key={s.schedule_id} value={s.schedule_id}>{s.schedule_code}</option>))}
                                    </select>
                                </div>
                                <div><label className="block text-xs font-semibold mb-1">Amount *</label><input type="number" step="0.01" value={form.fuel_amount} onChange={(e) => handleFuelAmountChange(parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Cost/Liter *</label><input type="number" step="0.01" value={form.cost_per_liter} onChange={(e) => handleCostPerLiterChange(parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Total Cost</label><input type="number" step="0.01" value={form.total_cost} readOnly className="w-full px-3 py-2 rounded-lg border bg-gray-50" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Odometer *</label><input type="number" step="0.01" value={form.odometer_reading} onChange={(e) => setForm({ ...form, odometer_reading: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Location</label><input type="text" value={form.refueling_location} onChange={(e) => setForm({ ...form, refueling_location: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Receipt #</label><input type="text" value={form.receipt_number} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                            </div>
                            <div><label className="block text-xs font-semibold mb-1">Remarks</label><textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border resize-none" /></div>
                        </div>
                        <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
                            <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg">Cancel</button>
                            <button onClick={handleCreate} disabled={formLoading} className="px-5 py-2 rounded-lg bg-primary-500 text-white">{formLoading ? 'Saving...' : 'Save Log'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">Edit Fuel Log</h2>
                            <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-md"><i className="ri-close-line"></i></button>
                        </div>
                        <div className="p-6">
                            <div className="bg-gray-50 p-3 rounded-lg mb-4"><p className="text-xs">Editing: <strong>{selectedLog.Bus?.registration_number}</strong> - {selectedLog.fuel_date}</p></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold mb-1">Bus *</label><select value={form.bus_id} onChange={(e) => setForm({ ...form, bus_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border">{buses.map((b) => (<option key={b.bus_id} value={b.bus_id}>{b.registration_number}</option>))}</select></div>
                                <div><label className="block text-xs font-semibold mb-1">Date *</label><input type="date" value={form.fuel_date} onChange={(e) => setForm({ ...form, fuel_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Fuel Type</label><select value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })} className="w-full px-3 py-2 rounded-lg border"><option value="Diesel">Diesel</option><option value="Petrol">Petrol</option><option value="CNG">CNG</option><option value="Electric">Electric</option></select></div>
                                <div><label className="block text-xs font-semibold mb-1">Schedule</label><select value={form.schedule_id} onChange={(e) => setForm({ ...form, schedule_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border"><option value="">None</option>{schedules.slice(0, 20).map((s) => (<option key={s.schedule_id} value={s.schedule_id}>{s.schedule_code}</option>))}</select></div>
                                <div><label className="block text-xs font-semibold mb-1">Amount *</label><input type="number" step="0.01" value={form.fuel_amount} onChange={(e) => handleFuelAmountChange(parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Cost/Liter *</label><input type="number" step="0.01" value={form.cost_per_liter} onChange={(e) => handleCostPerLiterChange(parseFloat(e.target.value))} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Total Cost</label><input type="number" step="0.01" value={form.total_cost} readOnly className="w-full px-3 py-2 rounded-lg border bg-gray-50" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Odometer *</label><input type="number" step="0.01" value={form.odometer_reading} onChange={(e) => setForm({ ...form, odometer_reading: parseFloat(e.target.value) })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Location</label><input type="text" value={form.refueling_location} onChange={(e) => setForm({ ...form, refueling_location: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                <div><label className="block text-xs font-semibold mb-1">Receipt #</label><input type="text" value={form.receipt_number} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
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

            {/* Delete Modal */}
            {showDeleteModal && deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 mx-auto mb-4"><i className="ri-delete-bin-line text-red-500 text-xl"></i></div>
                        <h3 className="text-lg font-semibold text-center">Delete Fuel Log?</h3>
                        <p className="text-sm text-center mt-2">Delete log for <strong>{deleteConfirm.Bus?.registration_number}</strong> on <strong>{deleteConfirm.fuel_date}</strong>?</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 text-white">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}