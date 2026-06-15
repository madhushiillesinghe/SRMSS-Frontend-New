import { useState, useEffect } from 'react';
import Layout from '@/components/feature/Layout';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';

interface Bus {
    bus_id: number;
    registration_number: string;
    bus_model: string;
    capacity: number;
    bus_type: string;
    fuel_type: string;
    mileage: string | number;
    current_odometer: string | number;
    manufacturing_year: number;
    last_maintenance_date: string | null;
    next_maintenance_due: string | null;
    last_maintenance_odometer: string | number | null;
    maintenance_interval_km: number;
    status: string;
    assigned_route_id: number | null;
    qr_code: string | null;
    notes: string | null;
    created_by: number;
    created_at: string;
    updated_at: string;
    route: any | null;
}

const statusBadge: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    on_route: 'bg-primary-100 text-primary-700',
    maintenance: 'bg-amber-100 text-amber-700',
    inactive: 'bg-gray-100 text-gray-600',
};

const busTypeColors: Record<string, string> = {
    AC: 'bg-blue-100 text-blue-700',
    'Non-AC': 'bg-gray-100 text-gray-600',
    Luxury: 'bg-secondary-100 text-secondary-700',
    'Semi-Luxury': 'bg-accent-100 text-accent-700',
};

const fuelTypeColors: Record<string, string> = {
    Diesel: 'bg-amber-100 text-amber-700',
    Petrol: 'bg-sky-100 text-sky-700',
    Electric: 'bg-emerald-100 text-emerald-700',
    CNG: 'bg-purple-100 text-purple-700',
};

export default function BusesPage() {
    const [buses, setBuses] = useState<Bus[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit' | null>(null);
    const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
    const [form, setForm] = useState<any>({
        registration_number: '',
        bus_model: '',
        capacity: 0,
        bus_type: 'AC',
        fuel_type: 'Diesel',
        mileage: 0,
        current_odometer: 0,
        manufacturing_year: new Date().getFullYear(),
        last_maintenance_date: '',
        next_maintenance_due: '',
        last_maintenance_odometer: 0,
        maintenance_interval_km: 5000,
        status: 'available',
        assigned_route_id: null,
        qr_code: '',
        notes: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState<Bus | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [routes, setRoutes] = useState<any[]>([]);

    // Fetch all buses
    const fetchBuses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/buses');
            console.log("API Response:", response.data);

            if (response.data.success) {
                setBuses(response.data.data);
            } else {
                toast.error('Failed to load buses');
            }
        } catch (error) {
            console.error("Error fetching buses:", error);
            toast.error('Failed to load buses');
        } finally {
            setLoading(false);
        }
    };

    // Fetch routes for dropdown
    const fetchRoutes = async () => {
        try {
            const response = await api.get('/routes/active');
            if (response.data.success) {
                setRoutes(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching routes:", error);
        }
    };

    useEffect(() => {
        fetchBuses();
        fetchRoutes();
    }, []);

    const filteredBuses = buses.filter(
        (b) =>
            b.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
            b.bus_model?.toLowerCase().includes(search.toLowerCase()) ||
            b.bus_type?.toLowerCase().includes(search.toLowerCase()) ||
            b.fuel_type?.toLowerCase().includes(search.toLowerCase())
    );

    const openModal = (mode: 'view' | 'create' | 'edit', bus?: Bus) => {
        if (bus && mode !== 'create') {
            setSelectedBus(bus);
            setForm({
                registration_number: bus.registration_number,
                bus_model: bus.bus_model,
                capacity: bus.capacity,
                bus_type: bus.bus_type,
                fuel_type: bus.fuel_type,
                mileage: parseFloat(bus.mileage as string) || 0,
                current_odometer: parseFloat(bus.current_odometer as string) || 0,
                manufacturing_year: bus.manufacturing_year,
                last_maintenance_date: bus.last_maintenance_date || '',
                next_maintenance_due: bus.next_maintenance_due || '',
                last_maintenance_odometer: parseFloat(bus.last_maintenance_odometer as string) || 0,
                maintenance_interval_km: bus.maintenance_interval_km,
                status: bus.status,
                assigned_route_id: bus.assigned_route_id,
                qr_code: bus.qr_code || '',
                notes: bus.notes || '',
            });
        } else {
            setSelectedBus(null);
            setForm({
                registration_number: `BUS-${Math.floor(Math.random() * 9000) + 1000}`,
                bus_model: '',
                capacity: 0,
                bus_type: 'AC',
                fuel_type: 'Diesel',
                mileage: 0,
                current_odometer: 0,
                manufacturing_year: new Date().getFullYear(),
                last_maintenance_date: '',
                next_maintenance_due: '',
                last_maintenance_odometer: 0,
                maintenance_interval_km: 5000,
                status: 'available',
                assigned_route_id: null,
                qr_code: '',
                notes: '',
            });
        }
        setModalMode(mode);
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedBus(null);
    };

    // Create new bus
    const handleCreate = async () => {
        try {
            const payload = {
                registration_number: form.registration_number,
                bus_model: form.bus_model,
                capacity: parseInt(form.capacity),
                bus_type: form.bus_type,
                fuel_type: form.fuel_type,
                mileage: parseFloat(form.mileage) || 0,
                current_odometer: parseFloat(form.current_odometer) || 0,
                manufacturing_year: parseInt(form.manufacturing_year),
                last_maintenance_date: form.last_maintenance_date || null,
                next_maintenance_due: form.next_maintenance_due || null,
                last_maintenance_odometer: parseFloat(form.last_maintenance_odometer) || 0,
                maintenance_interval_km: parseInt(form.maintenance_interval_km),
                status: form.status,
                assigned_route_id: form.assigned_route_id || null,
                qr_code: form.qr_code || null,
                notes: form.notes || null,
            };

            const response = await api.post('/buses', payload);
            console.log("Create response:", response.data);

            if (response.data.success) {
                toast.success('Bus created successfully');
                fetchBuses();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to create bus');
            }
        } catch (error: any) {
            console.error("Create error:", error);
            toast.error(error.response?.data?.message || 'Failed to create bus');
        }
    };

    // Update bus
    const handleUpdate = async () => {
        if (!selectedBus) return;

        try {
            const payload = {
                bus_model: form.bus_model,
                capacity: parseInt(form.capacity),
                bus_type: form.bus_type,
                fuel_type: form.fuel_type,
                mileage: parseFloat(form.mileage) || 0,
                current_odometer: parseFloat(form.current_odometer) || 0,
                manufacturing_year: parseInt(form.manufacturing_year),
                last_maintenance_date: form.last_maintenance_date || null,
                next_maintenance_due: form.next_maintenance_due || null,
                last_maintenance_odometer: parseFloat(form.last_maintenance_odometer) || 0,
                maintenance_interval_km: parseInt(form.maintenance_interval_km),
                status: form.status,
                assigned_route_id: form.assigned_route_id || null,
                qr_code: form.qr_code || null,
                notes: form.notes || null,
            };

            const response = await api.put(`/buses/${selectedBus.bus_id}`, payload);
            console.log("Update response:", response.data);

            if (response.data.success) {
                toast.success('Bus updated successfully');
                fetchBuses();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to update bus');
            }
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || 'Failed to update bus');
        }
    };

    const handleSave = () => {
        if (modalMode === 'create') {
            handleCreate();
        } else if (modalMode === 'edit') {
            handleUpdate();
        }
    };

    // Delete bus
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const response = await api.delete(`/buses/${deleteConfirm.bus_id}`);
            console.log("Delete response:", response.data);

            if (response.data.success) {
                toast.success('Bus deleted successfully');
                fetchBuses();
                setDeleteConfirm(null);
                setShowDeleteModal(false);
            } else {
                toast.error(response.data.message || 'Failed to delete bus');
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || 'Failed to delete bus');
        }
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Buses</h1>
                    <p className="text-sm text-foreground-400 mt-1">Manage bus fleet inventory and maintenance schedules</p>
                </div>
                <button
                    onClick={() => openModal('create')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20"
                >
                    <i className="ri-add-line"></i>
                    <span>Add Bus</span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by registration, model, type or fuel..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <span className="ml-2 text-foreground-500">Loading buses...</span>
                </div>
            )}

            {/* Table */}
            {!loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-background-100 bg-background-50/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Reg Number</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Model</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Type</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Capacity</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Fuel Type</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Odometer</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Next Maintenance</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredBuses.map((bus) => (
                                <tr key={bus.bus_id} className="border-b border-background-50 hover:bg-background-50/50 transition-colors">
                                    <td className="px-5 py-3 text-foreground-900 font-mono font-semibold text-xs whitespace-nowrap">{bus.registration_number}</td>
                                    <td className="px-5 py-3 text-foreground-800 font-medium whitespace-nowrap">{bus.bus_model}</td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${busTypeColors[bus.bus_type] || 'bg-gray-100 text-gray-600'}`}>
                                                {bus.bus_type}
                                            </span>
                                    </td>
                                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{bus.capacity} seats</td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${fuelTypeColors[bus.fuel_type] || 'bg-gray-100 text-gray-600'}`}>
                                                <i className={`ri-${bus.fuel_type === 'Electric' ? 'plug-line' : 'oil-line'} text-foreground-400 text-[10px]`}></i>
                                                {bus.fuel_type}
                                            </span>
                                    </td>
                                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">{Number(bus.current_odometer).toLocaleString()} km</td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusBadge[bus.status]}`}>
                                                {bus.status.replace('_', ' ')}
                                            </span>
                                    </td>
                                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">
                                        {bus.next_maintenance_due ? new Date(bus.next_maintenance_due).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openModal('view', bus)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                                <i className="ri-eye-line text-sm"></i>
                                            </button>
                                            <button onClick={() => openModal('edit', bus)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                                                <i className="ri-edit-line text-sm"></i>
                                            </button>
                                            <button onClick={() => { setDeleteConfirm(bus); setShowDeleteModal(true); }} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                                                <i className="ri-delete-bin-line text-sm"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBuses.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-5 py-12 text-center text-foreground-400">No buses found</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Bus Modal */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-background-200 animate-scale-in mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200">
                            <h2 className="text-lg font-semibold text-foreground-900 font-heading">
                                {modalMode === 'view' ? 'Bus Details' : modalMode === 'create' ? 'Register Bus' : 'Edit Bus'}
                            </h2>
                            <button onClick={closeModal} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:bg-background-100 transition-colors cursor-pointer">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Basic Information Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-bus-line text-primary-500"></i>
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Registration Number *</label>
                                        <input
                                            type="text"
                                            value={form.registration_number}
                                            onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Bus Model *</label>
                                        <input
                                            type="text"
                                            value={form.bus_model}
                                            onChange={(e) => setForm({ ...form, bus_model: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Capacity (seats) *</label>
                                        <input
                                            type="number"
                                            value={form.capacity}
                                            onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Bus Type</label>
                                        <select
                                            value={form.bus_type}
                                            onChange={(e) => setForm({ ...form, bus_type: e.target.value })}
                                            disabled={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 disabled:bg-background-50 focus:outline-none focus:border-primary-400"
                                        >
                                            <option value="AC">AC</option>
                                            <option value="Non-AC">Non-AC</option>
                                            <option value="Luxury">Luxury</option>
                                            <option value="Semi-Luxury">Semi-Luxury</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Fuel Type</label>
                                        <select
                                            value={form.fuel_type}
                                            onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}
                                            disabled={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 disabled:bg-background-50 focus:outline-none focus:border-primary-400"
                                        >
                                            <option value="Diesel">Diesel</option>
                                            <option value="Petrol">Petrol</option>
                                            <option value="Electric">Electric</option>
                                            <option value="CNG">CNG</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Manufacturing Year</label>
                                        <input
                                            type="number"
                                            value={form.manufacturing_year}
                                            onChange={(e) => setForm({ ...form, manufacturing_year: Number(e.target.value) })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Status</label>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                                            disabled={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 disabled:bg-background-50 focus:outline-none focus:border-primary-400"
                                        >
                                            <option value="available">Available</option>
                                            <option value="on_route">On Route</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Assigned Route</label>
                                        <select
                                            value={form.assigned_route_id || ''}
                                            onChange={(e) => setForm({ ...form, assigned_route_id: e.target.value ? Number(e.target.value) : null })}
                                            disabled={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 disabled:bg-background-50 focus:outline-none focus:border-primary-400"
                                        >
                                            <option value="">None</option>
                                            {routes.map((route) => (
                                                <option key={route.route_id} value={route.route_id}>
                                                    {route.route_name} ({route.route_code})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Performance Metrics Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-dashboard-line text-primary-500"></i>
                                    Performance Metrics
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Mileage (km/L)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={form.mileage}
                                            onChange={(e) => setForm({ ...form, mileage: parseFloat(e.target.value) })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Current Odometer (km)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={form.current_odometer}
                                            onChange={(e) => setForm({ ...form, current_odometer: parseFloat(e.target.value) })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Maintenance Interval (km)</label>
                                        <input
                                            type="number"
                                            value={form.maintenance_interval_km}
                                            onChange={(e) => setForm({ ...form, maintenance_interval_km: Number(e.target.value) })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Maintenance Schedule Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-tools-line text-primary-500"></i>
                                    Maintenance Schedule
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Last Maintenance Date</label>
                                        <input
                                            type="date"
                                            value={form.last_maintenance_date}
                                            onChange={(e) => setForm({ ...form, last_maintenance_date: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Next Maintenance Due</label>
                                        <input
                                            type="date"
                                            value={form.next_maintenance_due}
                                            onChange={(e) => setForm({ ...form, next_maintenance_due: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Odometer at Last Maintenance</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={form.last_maintenance_odometer}
                                            onChange={(e) => setForm({ ...form, last_maintenance_odometer: parseFloat(e.target.value) })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* QR Code & Notes Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-qr-code-line text-primary-500"></i>
                                    Additional Information
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">QR Code</label>
                                        <input
                                            type="text"
                                            value={form.qr_code}
                                            onChange={(e) => setForm({ ...form, qr_code: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            placeholder="QR Code value"
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Notes</label>
                                        <textarea
                                            value={form.notes || ''}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            rows={3}
                                            maxLength={500}
                                            placeholder="Additional notes about the bus..."
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400 resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {modalMode !== 'view' && (
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-background-200">
                                <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
                                    Cancel
                                </button>
                                <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20">
                                    {modalMode === 'create' ? 'Register Bus' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteModal && deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-background-200 p-6 animate-scale-in mx-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <i className="ri-delete-bin-line text-red-500 text-xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground-900 text-center font-heading">Delete Bus?</h3>
                        <p className="text-sm text-foreground-500 text-center mt-2">
                            Are you sure you want to delete <strong>{deleteConfirm.registration_number}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex items-center gap-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-background-300 text-sm font-medium text-foreground-600 hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}