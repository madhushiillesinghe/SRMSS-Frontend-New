import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/feature/Layout';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';

type SettingsTab = 'profile' | 'appearance' | 'notifications' | 'system';

const tabConfig: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'profile',       label: 'Profile',       icon: 'ri-user-settings-line' },
    { id: 'appearance',    label: 'Appearance',     icon: 'ri-palette-line' },
    { id: 'notifications', label: 'Notifications',  icon: 'ri-notification-3-line' },
    { id: 'system',        label: 'System',         icon: 'ri-settings-4-line' },
];

const roleLabels: Record<string, string> = {
    super_admin:       'Super Administrator',
    admin:             'Administrator',
    depot_manager:     'Depot Manager',
    logistics_officer: 'Logistics Officer',
    depot_clerk:       'Depot Clerk',
};

const roleBadge: Record<string, string> = {
    super_admin:       'bg-purple-100 text-purple-600',
    admin:             'bg-red-100 text-red-600',
    depot_manager:     'bg-blue-100 text-blue-600',
    logistics_officer: 'bg-green-100 text-green-600',
    depot_clerk:       'bg-yellow-100 text-yellow-600',
};

export default function SettingsPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

    // Password change modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordUpdating, setPasswordUpdating] = useState(false);

    // Appearance state (saved to localStorage)
    const [density, setDensity] = useState<'comfortable' | 'compact'>(
        () => (localStorage.getItem('ui_density') as 'comfortable' | 'compact') || 'comfortable'
    );
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

    // Notification toggles (saved to localStorage)
    const [notifs, setNotifs] = useState(() => {
        const saved = localStorage.getItem('notification_prefs');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch { /* ignore */ }
        }
        return {
            scheduleAlerts: true,
            maintenanceDue: true,
            fuelThreshold: false,
            newTickets: true,
            systemAnnouncements: true,
        };
    });

    // System / security state
    const [sessionTimeout, setSessionTimeout] = useState(() => localStorage.getItem('session_timeout') || '30');
    const [auditLog, setAuditLog] = useState(() => localStorage.getItem('audit_log') !== 'false');

    // Save preferences to localStorage
    useEffect(() => {
        localStorage.setItem('ui_density', density);
    }, [density]);

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('notification_prefs', JSON.stringify(notifs));
    }, [notifs]);

    useEffect(() => {
        localStorage.setItem('session_timeout', sessionTimeout);
    }, [sessionTimeout]);

    useEffect(() => {
        localStorage.setItem('audit_log', String(auditLog));
    }, [auditLog]);

    const handleChangePassword = async () => {
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            toast.error('All password fields are required');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error('New password and confirmation do not match');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setPasswordUpdating(true);
        try {
            const response = await api.post('/auth/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword,
            });
            if (response.data.success) {
                toast.success('Password changed successfully');
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(response.data.message || 'Password change failed');
            }
        } catch (error: any) {
            console.error('Password change error:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setPasswordUpdating(false);
        }
    };

    const toggleNotif = (key: keyof typeof notifs) => {
        setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Layout>
            <div className="p-6 max-w-4xl mx-auto">
                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-foreground-900 font-heading">Settings</h1>
                    <p className="text-sm text-foreground-400 mt-0.5">Manage your account and system preferences</p>
                </div>

                <div className="flex gap-6 flex-col md:flex-row">
                    {/* Sidebar tabs */}
                    <nav className="flex md:flex-col gap-1 flex-row overflow-x-auto md:overflow-visible flex-shrink-0 md:w-48">
                        {tabConfig.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium whitespace-nowrap transition-all cursor-pointer w-full text-left ${
                                    activeTab === tab.id
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-foreground-600 hover:bg-background-100 hover:text-foreground-900'
                                }`}
                            >
                                <i className={`${tab.icon} text-base ${activeTab === tab.id ? 'text-primary-500' : 'text-foreground-400'}`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Content panel */}
                    <div className="flex-1 bg-white border border-background-200 rounded-xl p-6 min-h-[400px]">
                        {/* ── PROFILE TAB (read‑only, no update) ── */}
                        {activeTab === 'profile' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <i className="ri-user-line text-primary-500 text-lg"></i>
                                    <h2 className="text-base font-semibold text-foreground-800">Profile Information</h2>
                                </div>

                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-background-100">
                                    <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                        <i className="ri-user-line text-primary-600 text-2xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground-800">{user?.full_name || user?.name}</p>
                                        <p className="text-xs text-foreground-400 mt-0.5">{user?.email}</p>
                                        {user && (
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${roleBadge[user.role]}`}>
                                                {roleLabels[user.role]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 max-w-md">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-1.5">Display Name</label>
                                        <input
                                            type="text"
                                            value={user?.full_name || user?.name || ''}
                                            readOnly
                                            className="w-full px-3 py-2 text-sm border border-background-200 rounded-md bg-background-50 text-foreground-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-1.5">Email Address</label>
                                        <input
                                            type="email"
                                            value={user?.email ?? ''}
                                            readOnly
                                            className="w-full px-3 py-2 text-sm border border-background-200 rounded-md bg-background-50 text-foreground-400 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-foreground-400 mt-1">Email cannot be changed.</p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-1.5">Role</label>
                                        <input
                                            type="text"
                                            value={user ? roleLabels[user.role] : ''}
                                            readOnly
                                            className="w-full px-3 py-2 text-sm border border-background-200 rounded-md bg-background-50 text-foreground-400 cursor-not-allowed"
                                        />
                                    </div>

                                    <div>
                                        <button
                                            onClick={() => setShowPasswordModal(true)}
                                            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-2"
                                        >
                                            <i className="ri-lock-line"></i> Change Password
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── APPEARANCE TAB ── */}
                        {activeTab === 'appearance' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <i className="ri-palette-line text-primary-500 text-lg"></i>
                                    <h2 className="text-base font-semibold text-foreground-800">Appearance & Display</h2>
                                </div>

                                <div className="space-y-6 max-w-md">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-1.5">Table Density</label>
                                        <div className="flex gap-3 mt-1">
                                            {(['comfortable', 'compact'] as const).map((d) => (
                                                <button
                                                    key={d}
                                                    onClick={() => setDensity(d)}
                                                    className={`flex-1 py-2 rounded-md text-sm font-medium border transition-all cursor-pointer capitalize ${
                                                        density === d
                                                            ? 'border-primary-400 bg-primary-50 text-primary-700'
                                                            : 'border-background-200 text-foreground-500 hover:border-primary-200'
                                                    }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-1.5">Language</label>
                                        <select
                                            value={language}
                                            onChange={(e) => setLanguage(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-background-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 text-foreground-800 bg-white"
                                        >
                                            <option value="en">English</option>
                                            <option value="si">සිංහල (Sinhala)</option>
                                            <option value="ta">தமிழ் (Tamil)</option>
                                        </select>
                                    </div>

                                    <div className="p-3 bg-background-50 rounded-md border border-background-200">
                                        <p className="text-xs text-foreground-400">
                                            <i className="ri-information-line mr-1"></i>
                                            Dark mode support is planned for a future release.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── NOTIFICATIONS TAB ── */}
                        {activeTab === 'notifications' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <i className="ri-notification-3-line text-primary-500 text-lg"></i>
                                    <h2 className="text-base font-semibold text-foreground-800">Notification Preferences</h2>
                                </div>

                                <div className="space-y-3 max-w-md">
                                    {[
                                        { key: 'scheduleAlerts', label: 'Schedule Alerts', desc: 'Get notified about upcoming schedule conflicts' },
                                        { key: 'maintenanceDue', label: 'Maintenance Due', desc: 'Reminders when vehicle maintenance is overdue' },
                                        { key: 'fuelThreshold', label: 'Fuel Threshold Alerts', desc: 'Alert when fuel log entries exceed limits' },
                                        { key: 'newTickets', label: 'New Tickets', desc: 'Notify when new tickets are raised' },
                                        { key: 'systemAnnouncements', label: 'System Announcements', desc: 'Platform updates and maintenance windows' },
                                    ].map(({ key, label, desc }) => (
                                        <div
                                            key={key}
                                            className="flex items-center justify-between p-3 rounded-md border border-background-200 hover:bg-background-50 transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-foreground-800">{label}</p>
                                                <p className="text-xs text-foreground-400 mt-0.5">{desc}</p>
                                            </div>
                                            <Toggle checked={notifs[key as keyof typeof notifs]} onChange={() => toggleNotif(key as keyof typeof notifs)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── SYSTEM TAB ── */}
                        {activeTab === 'system' && (
                            <div>
                                <div className="flex items-center gap-2 mb-5">
                                    <i className="ri-settings-4-line text-primary-500 text-lg"></i>
                                    <h2 className="text-base font-semibold text-foreground-800">System & Security</h2>
                                </div>

                                <div className="space-y-6 max-w-md">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-1.5">Session Timeout (minutes)</label>
                                        <select
                                            value={sessionTimeout}
                                            onChange={(e) => setSessionTimeout(e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-background-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 text-foreground-800 bg-white"
                                        >
                                            <option value="15">15 minutes</option>
                                            <option value="30">30 minutes</option>
                                            <option value="60">1 hour</option>
                                            <option value="120">2 hours</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-md border border-background-200">
                                        <div>
                                            <p className="text-sm font-medium text-foreground-800">Audit Log</p>
                                            <p className="text-xs text-foreground-400 mt-0.5">Record all user actions for compliance</p>
                                        </div>
                                        <Toggle checked={auditLog} onChange={() => setAuditLog(!auditLog)} />
                                    </div>

                                    {/* App info */}
                                    <div className="pt-4 border-t border-background-100">
                                        <p className="text-xs font-semibold text-foreground-400 uppercase tracking-wider mb-3">Application Info</p>
                                        <div className="space-y-2">
                                            {[
                                                { label: 'Version', value: '1.0.0-beta' },
                                                { label: 'Environment', value: 'Development' },
                                                { label: 'Region', value: 'LK — Sri Lanka' },
                                            ].map(({ label, value }) => (
                                                <div key={label} className="flex justify-between text-sm">
                                                    <span className="text-foreground-400">{label}</span>
                                                    <span className="text-foreground-700 font-medium">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-foreground-900">Change Password</h3>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="text-foreground-400 hover:text-foreground-600"
                            >
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-1.5">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-background-200 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-1.5">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-background-200 rounded-md"
                                />
                                <p className="text-xs text-foreground-400 mt-1">Minimum 8 characters</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-background-200 rounded-md"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="px-4 py-2 text-sm font-medium border border-background-200 rounded-md hover:bg-background-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleChangePassword}
                                disabled={passwordUpdating}
                                className="px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50"
                            >
                                {passwordUpdating ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                checked ? 'bg-primary-500' : 'bg-background-200'
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                    checked ? 'translate-x-4' : 'translate-x-0'
                }`}
            />
        </button>
    );
}