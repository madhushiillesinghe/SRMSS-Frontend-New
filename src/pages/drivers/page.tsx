import { useState, useEffect } from 'react';
import Layout from '@/components/feature/Layout';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';

interface Driver {
    driver_id: number;
    driver_code: string;
    first_name: string;
    last_name: string;
    nic_number: string;
    phone: string;
    email: string;
    address: string;
    license_number: string;
    license_expiry: string;
    license_class: string;
    date_of_birth: string;
    hire_date: string;
    emergency_contact: string;
    emergency_contact_name: string;
    max_working_hours_per_day: number;
    current_working_hours: number;
    rating: number;
    status: string;
    assigned_route_id: number | null;
    profile_image: string | null;
    notes: string;
    created_by: number;
    created_at: string;
    updated_at: string;
    route?: any;
}

interface Route {
    route_id: number;
    route_code: string;
    route_name: string;
    status: string;
}

const statusBadge: Record<string, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    on_duty: 'bg-primary-100 text-primary-700',
    off_duty: 'bg-amber-100 text-amber-700',
    suspended: 'bg-red-100 text-red-700',
    terminated: 'bg-gray-100 text-gray-500 line-through',
};

const licenseClassOptions = ['PSV-Heavy', 'PSV-Medium', 'PSV-Light', 'Light Vehicle', 'Medium Vehicle', 'Heavy Vehicle'];

function isLicenseExpired(expiryDate: string): boolean {
    return new Date(expiryDate) < new Date();
}

function daysUntilExpiry(expiryDate: string): number {
    return Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit' | null>(null);
    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
    const [form, setForm] = useState<any>({
        driver_code: '',
        first_name: '',
        last_name: '',
        nic_number: '',
        phone: '',
        email: '',
        address: '',
        license_number: '',
        license_expiry: '',
        license_class: 'PSV-Heavy',
        date_of_birth: '',
        hire_date: new Date().toISOString().split('T')[0],
        emergency_contact: '',
        emergency_contact_name: '',
        max_working_hours_per_day: 8,
        rating: 5.0,  //  Default rating 5.0
        status: 'available',
        assigned_route_id: null,
        notes: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState<Driver | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Fetch all drivers
    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/drivers');
            if (response.data.success) {
                setDrivers(response.data.data);
            } else {
                toast.error('Failed to load drivers');
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
            toast.error('Failed to load drivers');
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
        fetchDrivers();
        fetchRoutes();
    }, []);

    const filteredDrivers = drivers.filter(
        (d) =>
            d.driver_code?.toLowerCase().includes(search.toLowerCase()) ||
            d.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            d.last_name?.toLowerCase().includes(search.toLowerCase()) ||
            d.phone?.includes(search) ||
            d.license_number?.toLowerCase().includes(search.toLowerCase())
    );

    const openModal = (mode: 'view' | 'create' | 'edit', driver?: Driver) => {
        if (driver && mode !== 'create') {
            setSelectedDriver(driver);
            setForm({
                driver_code: driver.driver_code,
                first_name: driver.first_name,
                last_name: driver.last_name,
                nic_number: driver.nic_number || '',
                phone: driver.phone,
                email: driver.email || '',
                address: driver.address || '',
                license_number: driver.license_number,
                license_expiry: driver.license_expiry,
                license_class: driver.license_class || 'PSV-Heavy',
                date_of_birth: driver.date_of_birth || '',
                hire_date: driver.hire_date,
                emergency_contact: driver.emergency_contact || '',
                emergency_contact_name: driver.emergency_contact_name || '',
                max_working_hours_per_day: driver.max_working_hours_per_day,
                rating: driver.rating || 5.0,
                status: driver.status,
                assigned_route_id: driver.assigned_route_id,
                notes: driver.notes || '',
            });
        } else {
            setSelectedDriver(null);
            // Generate unique driver code
            const generateDriverCode = () => {
                const prefix = 'DRV';
                const randomNum = Math.floor(Math.random() * 9000) + 1000;
                return `${prefix}${randomNum}`;
            };
            setForm({
                driver_code: generateDriverCode(),
                first_name: '',
                last_name: '',
                nic_number: '',
                phone: '',
                email: '',
                address: '',
                license_number: '',
                license_expiry: '',
                license_class: 'PSV-Heavy',
                date_of_birth: '',
                hire_date: new Date().toISOString().split('T')[0],
                emergency_contact: '',
                emergency_contact_name: '',
                max_working_hours_per_day: 8,
                rating: 5.0,  // ✅ Default rating 5.0 for new driver
                status: 'available',
                assigned_route_id: null,
                notes: '',
            });
        }
        setModalMode(mode);
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedDriver(null);
    };

    // Create new driver
    const handleCreate = async () => {
        try {
            const payload = {
                driver_code: form.driver_code,
                first_name: form.first_name,
                last_name: form.last_name,
                nic_number: form.nic_number || null,
                phone: form.phone,
                email: form.email || null,
                address: form.address || null,
                license_number: form.license_number,
                license_expiry: form.license_expiry,
                license_class: form.license_class,
                date_of_birth: form.date_of_birth || null,
                hire_date: form.hire_date,
                emergency_contact: form.emergency_contact || null,
                emergency_contact_name: form.emergency_contact_name || null,
                max_working_hours_per_day: form.max_working_hours_per_day,
                rating: form.rating || 5.0,  // Send rating to backend
                status: form.status,
                assigned_route_id: form.assigned_route_id || null,
                notes: form.notes || null,
            };

            const response = await api.post('/drivers', payload);
            if (response.data.success) {
                toast.success('Driver created successfully');
                fetchDrivers();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to create driver');
            }
        } catch (error: any) {
            console.error("Create error:", error);
            toast.error(error.response?.data?.message || 'Failed to create driver');
        }
    };

    // Update driver
    const handleUpdate = async () => {
        if (!selectedDriver) return;

        try {
            const payload = {
                first_name: form.first_name,
                last_name: form.last_name,
                nic_number: form.nic_number || null,
                phone: form.phone,
                email: form.email || null,
                address: form.address || null,
                license_number: form.license_number,
                license_expiry: form.license_expiry,
                license_class: form.license_class,
                date_of_birth: form.date_of_birth || null,
                hire_date: form.hire_date,
                emergency_contact: form.emergency_contact || null,
                emergency_contact_name: form.emergency_contact_name || null,
                max_working_hours_per_day: form.max_working_hours_per_day,
                rating: form.rating || 5.0,  // ✅ Send rating to backend
                status: form.status,
                assigned_route_id: form.assigned_route_id || null,
                notes: form.notes || null,
            };

            const response = await api.put(`/drivers/${selectedDriver.driver_id}`, payload);
            if (response.data.success) {
                toast.success('Driver updated successfully');
                fetchDrivers();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to update driver');
            }
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || 'Failed to update driver');
        }
    };

    const handleSave = () => {
        if (modalMode === 'create') {
            handleCreate();
        } else if (modalMode === 'edit') {
            handleUpdate();
        }
    };

    // Delete driver
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const response = await api.delete(`/drivers/${deleteConfirm.driver_id}`);
            if (response.data.success) {
                toast.success('Driver deleted successfully');
                fetchDrivers();
                setDeleteConfirm(null);
                setShowDeleteModal(false);
            } else {
                toast.error(response.data.message || 'Failed to delete driver');
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || 'Failed to delete driver');
        }
    };

    // Star rating renderer
    const renderStars = (rating: number) => {
        const roundedRating = Math.round(rating);
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <i
                        key={star}
                        className={`text-xs ${star <= roundedRating ? 'ri-star-fill text-amber-400' : 'ri-star-line text-foreground-200'}`}
                    ></i>
                ))}
            </div>
        );
    };

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Drivers</h1>
                    <p className="text-sm text-foreground-400 mt-1">Manage driver profiles, licenses, and assignments</p>
                </div>
                <button
                    onClick={() => openModal('create')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20"
                >
                    <i className="ri-add-line"></i>
                    <span>Add Driver</span>
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
                        placeholder="Search by code, name, phone or license..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <span className="ml-2 text-foreground-500">Loading drivers...</span>
                </div>
            )}

            {/* Table */}
            {!loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-background-100 bg-background-50/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Code</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Full Name</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Phone</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">License No</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">License Expiry</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Rating</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredDrivers.map((driver) => {
                                const expired = isLicenseExpired(driver.license_expiry);
                                const daysLeft = daysUntilExpiry(driver.license_expiry);
                                const expiringSoon = !expired && daysLeft <= 30;
                                return (
                                    <tr key={driver.driver_id} className="border-b border-background-50 hover:bg-background-50/50 transition-colors">
                                        <td className="px-5 py-3 text-foreground-900 font-mono font-semibold text-xs whitespace-nowrap">{driver.driver_code}</td>
                                        <td className="px-5 py-3 text-foreground-800 font-medium whitespace-nowrap">{driver.first_name} {driver.last_name}</td>
                                        <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{driver.phone}</td>
                                        <td className="px-5 py-3 text-foreground-600 whitespace-nowrap font-mono text-xs">{driver.license_number}</td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                                <span className={`text-xs font-medium ${expired ? 'text-red-600 bg-red-50 px-2 py-0.5 rounded-full' : expiringSoon ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full' : 'text-foreground-600'}`}>
                                                    {driver.license_expiry}
                                                    {expired && ' ⚠ Expired'}
                                                    {expiringSoon && !expired && ` (${daysLeft}d)`}
                                                </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusBadge[driver.status]}`}>
                                                    {driver.status.replace('_', ' ')}
                                                </span>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">{renderStars(driver.rating)}</td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openModal('view', driver)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                                    <i className="ri-eye-line text-sm"></i>
                                                </button>
                                                <button onClick={() => openModal('edit', driver)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                                                    <i className="ri-edit-line text-sm"></i>
                                                </button>
                                                <button onClick={() => { setDeleteConfirm(driver); setShowDeleteModal(true); }} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                                                    <i className="ri-delete-bin-line text-sm"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredDrivers.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-foreground-400">No drivers found</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Driver Modal */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-background-200 animate-scale-in mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200">
                            <h2 className="text-lg font-semibold text-foreground-900 font-heading">
                                {modalMode === 'view' ? 'Driver Details' : modalMode === 'create' ? 'Add Driver' : 'Edit Driver'}
                            </h2>
                            <button onClick={closeModal} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:bg-background-100 transition-colors cursor-pointer">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Profile header (view mode) */}
                            {modalMode === 'view' && (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-background-50 border border-background-200">
                                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                        <i className="ri-user-3-line text-2xl text-primary-500"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground-900 font-heading">{form.first_name} {form.last_name}</h3>
                                        <p className="text-sm text-foreground-500">{form.driver_code} · {form.status?.replace('_', ' ')}</p>
                                        <div className="mt-1">{renderStars(form.rating || 5)}</div>
                                    </div>
                                </div>
                            )}

                            {/* Basic Information Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-user-line text-primary-500"></i>
                                    Basic Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Driver Code *</label>
                                        <input
                                            type="text"
                                            value={form.driver_code}
                                            onChange={(e) => setForm({ ...form, driver_code: e.target.value })}
                                            readOnly={modalMode === 'view' || modalMode === 'edit'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            value={form.first_name}
                                            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            value={form.last_name}
                                            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">NIC Number</label>
                                        <input
                                            type="text"
                                            value={form.nic_number}
                                            onChange={(e) => setForm({ ...form, nic_number: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Phone *</label>
                                        <input
                                            type="tel"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Address</label>
                                        <input
                                            type="text"
                                            value={form.address}
                                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            value={form.date_of_birth}
                                            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* License & Employment Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-id-card-line text-primary-500"></i>
                                    License & Employment
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">License Number *</label>
                                        <input
                                            type="text"
                                            value={form.license_number}
                                            onChange={(e) => setForm({ ...form, license_number: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">License Expiry *</label>
                                        <input
                                            type="date"
                                            value={form.license_expiry}
                                            onChange={(e) => setForm({ ...form, license_expiry: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className={`w-full px-3 py-2 rounded-lg border text-sm read-only:bg-background-50 focus:outline-none focus:border-primary-400 ${
                                                form.license_expiry && isLicenseExpired(form.license_expiry)
                                                    ? 'border-red-300 bg-red-50/50 text-red-700'
                                                    : form.license_expiry && daysUntilExpiry(form.license_expiry) <= 30
                                                        ? 'border-amber-300 bg-amber-50/50 text-amber-700'
                                                        : 'border-background-300 text-foreground-900'
                                            }`}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">License Class</label>
                                        <select
                                            value={form.license_class}
                                            onChange={(e) => setForm({ ...form, license_class: e.target.value })}
                                            disabled={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 disabled:bg-background-50 focus:outline-none focus:border-primary-400"
                                        >
                                            {licenseClassOptions.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Hire Date *</label>
                                        <input
                                            type="date"
                                            value={form.hire_date}
                                            onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Max Hours/Day</label>
                                        <input
                                            type="number"
                                            value={form.max_working_hours_per_day}
                                            onChange={(e) => setForm({ ...form, max_working_hours_per_day: Number(e.target.value) })}
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
                                            <option value="on_duty">On Duty</option>
                                            <option value="off_duty">Off Duty</option>
                                            <option value="suspended">Suspended</option>
                                            <option value="terminated">Terminated</option>
                                        </select>
                                    </div>
                                    {/* Rating Field */}
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Rating (1-5)</label>
                                        <div className="flex items-center gap-2">
                                            {modalMode === 'view' ? (
                                                <div className="flex">{renderStars(form.rating || 5)}</div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="5"
                                                        step="0.5"
                                                        value={form.rating || 5}
                                                        onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) })}
                                                        className="flex-1 h-2 rounded-lg appearance-none cursor-pointer bg-background-200"
                                                    />
                                                    <span className="text-sm font-semibold text-foreground-700 w-12">
                                                        {form.rating || 5}
                                                    </span>
                                                    <div className="flex">
                                                        {renderStars(form.rating || 5)}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Emergency Contact & Assignment Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-emergency-line text-primary-500"></i>
                                    Emergency & Assignment
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Emergency Contact</label>
                                        <input
                                            type="tel"
                                            value={form.emergency_contact}
                                            onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Emergency Contact Name</label>
                                        <input
                                            type="text"
                                            value={form.emergency_contact_name}
                                            onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })}
                                            readOnly={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Assigned Route</label>
                                        <select
                                            value={form.assigned_route_id ?? ''}
                                            onChange={(e) => setForm({ ...form, assigned_route_id: e.target.value ? Number(e.target.value) : null })}
                                            disabled={modalMode === 'view'}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 disabled:bg-background-50 focus:outline-none focus:border-primary-400"
                                        >
                                            <option value="">None</option>
                                            {routes.filter((r) => r.status === 'active').map((r) => (
                                                <option key={r.route_id} value={r.route_id}>
                                                    {r.route_code} — {r.route_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-file-list-line text-primary-500"></i>
                                    Additional Information
                                </h3>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Notes</label>
                                    <textarea
                                        value={form.notes || ''}
                                        onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                        readOnly={modalMode === 'view'}
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Additional notes about the driver..."
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50 focus:outline-none focus:border-primary-400 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {modalMode !== 'view' && (
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-background-200">
                                <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
                                    Cancel
                                </button>
                                <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20">
                                    {modalMode === 'create' ? 'Add Driver' : 'Save Changes'}
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
                        <h3 className="text-lg font-semibold text-foreground-900 text-center font-heading">Delete Driver?</h3>
                        <p className="text-sm text-foreground-500 text-center mt-2">
                            Are you sure you want to delete <strong>{deleteConfirm.first_name} {deleteConfirm.last_name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex items-center gap-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-background-300 text-sm font-medium text-foreground-600 hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap">
                                Cancel
                            </button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}