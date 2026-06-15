import { useState, useEffect } from 'react';
import Layout from '@/components/feature/Layout';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';

interface AdminUser {
    admin_id: number;
    username: string;
    email: string;
    full_name: string;
    phone: string;
    role: 'super_admin' | 'depot_manager' | 'scheduler' | 'ticket_officer' | 'viewer';
    status: 'active' | 'inactive' | 'suspended';
    last_login: string | null;
    created_at: string;
}

const roleBadge: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    depot_manager: 'bg-blue-100 text-blue-700',
    scheduler: 'bg-amber-100 text-amber-700',
    ticket_officer: 'bg-pink-100 text-pink-700',
    viewer: 'bg-gray-100 text-gray-600',
};

const statusBadge: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-700',
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: 'viewer' as AdminUser['role'],
        status: 'active' as AdminUser['status'],
    });
    const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [formLoading, setFormLoading] = useState(false);

    // Fetch all admin users
    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const response = await api.get('/auth/admins');
            if (response.data.success) {
                setUsers(response.data.data);
            } else {
                toast.error('Failed to load admin users');
            }
        } catch (error: any) {
            console.error("Error fetching admins:", error);
            toast.error(error.response?.data?.message || 'Failed to load admin users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const filteredUsers = users.filter((u) =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const openModal = (mode: 'create' | 'edit', user?: AdminUser) => {
        if (user && mode === 'edit') {
            setSelectedUser(user);
            setForm({
                username: user.username,
                email: user.email,
                password: '',
                full_name: user.full_name,
                phone: user.phone || '',
                role: user.role,
                status: user.status,
            });
        } else {
            setSelectedUser(null);
            setForm({
                username: '',
                email: '',
                password: '',
                full_name: '',
                phone: '',
                role: 'viewer',
                status: 'active',
            });
        }
        setShowPassword(false);
        setPasswordStrength(0);
        setModalMode(mode);
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedUser(null);
        setFormLoading(false);
    };

    const handlePasswordChange = (val: string) => {
        setForm({ ...form, password: val });
        let strength = 0;
        if (val.length >= 6) strength += 25;
        if (val.length >= 10) strength += 25;
        if (/[A-Z]/.test(val)) strength += 25;
        if (/[0-9!@#$%^&*]/.test(val)) strength += 25;
        setPasswordStrength(strength);
    };

    // Create new admin
    const handleCreate = async () => {
        if (!form.username || !form.email || !form.password || !form.full_name) {
            toast.error('Please fill all required fields');
            return;
        }

        setFormLoading(true);
        try {
            const payload = {
                username: form.username,
                email: form.email,
                password: form.password,
                full_name: form.full_name,
                phone: form.phone || null,
                role: form.role,
                status: form.status,
            };

            const response = await api.post('/auth/admins', payload);
            if (response.data.success) {
                toast.success('Admin user created successfully');
                fetchAdmins();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to create admin');
            }
        } catch (error: any) {
            console.error("Create error:", error);
            toast.error(error.response?.data?.message || 'Failed to create admin');
        } finally {
            setFormLoading(false);
        }
    };

    // Update admin
    const handleUpdate = async () => {
        if (!selectedUser) return;
        if (!form.username || !form.email || !form.full_name) {
            toast.error('Please fill all required fields');
            return;
        }

        setFormLoading(true);
        try {
            const payload: any = {
                username: form.username,
                email: form.email,
                full_name: form.full_name,
                phone: form.phone || null,
                role: form.role,
                status: form.status,
            };

            // Only send password if it's provided (not empty)
            if (form.password) {
                payload.password = form.password;
            }

            const response = await api.put(`/auth/admins/${selectedUser.admin_id}`, payload);
            if (response.data.success) {
                toast.success('Admin user updated successfully');
                fetchAdmins();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to update admin');
            }
        } catch (error: any) {
            console.error("Update error:", error);
            toast.error(error.response?.data?.message || 'Failed to update admin');
        } finally {
            setFormLoading(false);
        }
    };

    const handleSave = () => {
        if (modalMode === 'create') {
            handleCreate();
        } else if (modalMode === 'edit') {
            handleUpdate();
        }
    };

    // Delete admin (soft delete - set status to inactive)
    const handleDelete = async () => {
        if (!deleteConfirm) return;

        try {
            const response = await api.delete(`/auth/admins/${deleteConfirm.admin_id}`);
            if (response.data.success) {
                toast.success('Admin user deactivated successfully');
                fetchAdmins();
                setDeleteConfirm(null);
                setShowDeleteModal(false);
            } else {
                toast.error(response.data.message || 'Failed to delete admin');
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            toast.error(error.response?.data?.message || 'Failed to delete admin');
        }
    };

    const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500'];
    const strengthLabel = ['Weak', 'Fair', 'Good', 'Strong'];

    // Format date for display
    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleString();
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Admin Users</h1>
                    <p className="text-sm text-foreground-400 mt-1">Manage system users and role-based permissions</p>
                </div>
                <button
                    onClick={() => openModal('create')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20"
                >
                    <i className="ri-add-line"></i>
                    <span>Add Admin</span>
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
                        placeholder="Search by username, name or email..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <span className="ml-2 text-foreground-500">Loading admin users...</span>
                </div>
            )}

            {/* Table */}
            {!loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-background-100 bg-background-50/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Username</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Full Name</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Email</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Role</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Last Login</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.admin_id} className="border-b border-background-50 hover:bg-background-50/50 transition-colors">
                                    <td className="px-4 py-3 text-foreground-900 font-mono font-semibold text-xs whitespace-nowrap">{user.username}</td>
                                    <td className="px-4 py-3 text-foreground-800 font-medium whitespace-nowrap">{user.full_name}</td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap text-xs">{user.email}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${roleBadge[user.role]}`}>
                                                {user.role.replace('_', ' ')}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusBadge[user.status]}`}>
                                                {user.status}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap text-xs">{formatDate(user.last_login)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => openModal('edit', user)}
                                                className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                                            >
                                                <i className="ri-edit-line text-sm"></i>
                                            </button>
                                            <button
                                                onClick={() => { setDeleteConfirm(user); setShowDeleteModal(true); }}
                                                className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                            >
                                                <i className="ri-delete-bin-line text-sm"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-foreground-400">No admin users found</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Admin User Modal */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-background-200 p-6 animate-scale-in mx-4">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold text-foreground-900 font-heading">
                                {modalMode === 'create' ? 'Add Admin User' : 'Edit Admin User'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:bg-background-100 transition-colors cursor-pointer"
                            >
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Username *</label>
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">
                                        Password {modalMode === 'create' ? '*' : '(Leave blank to keep current)'}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={(e) => handlePasswordChange(e.target.value)}
                                            className="w-full px-3 py-2 pr-10 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 cursor-pointer"
                                        >
                                            <i className={`ri-${showPassword ? 'eye-off-line' : 'eye-line'} text-sm`}></i>
                                        </button>
                                    </div>
                                    {(modalMode === 'create' || form.password) && form.password && (
                                        <div className="mt-2">
                                            <div className="flex gap-1 mb-1">
                                                {[0, 1, 2, 3].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 flex-1 rounded-full ${passwordStrength > i * 25 ? strengthColor[Math.min(Math.floor(passwordStrength / 25) - 1, 3)] : 'bg-background-200'}`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-foreground-400">
                                                {strengthLabel[Math.min(Math.floor(passwordStrength / 25) - 1, 3)] || ''}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        value={form.full_name}
                                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Phone</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Role</label>
                                    <select
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value as AdminUser['role'] })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                    >
                                        <option value="super_admin">Super Admin</option>
                                        <option value="depot_manager">Depot Manager</option>
                                        <option value="scheduler">Scheduler</option>
                                        <option value="ticket_officer">Ticket Officer</option>
                                        <option value="viewer">Viewer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Status</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value as AdminUser['status'] })}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 mt-6">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={formLoading}
                                className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {formLoading ? 'Processing...' : (modalMode === 'create' ? 'Create User' : 'Save Changes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-background-200 p-6 animate-scale-in mx-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <i className="ri-delete-bin-line text-red-500 text-xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground-900 text-center font-heading">Deactivate User?</h3>
                        <p className="text-sm text-foreground-500 text-center mt-2">
                            Are you sure you want to deactivate <strong>{deleteConfirm.full_name}</strong>?
                            This will prevent them from accessing the system.
                        </p>
                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-background-300 text-sm font-medium text-foreground-600 hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                            >
                                Deactivate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}