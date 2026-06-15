// src/pages/driver-login/page.tsx
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useDriver } from '../../context/DriverContext';
import api from '../../api/axios';

export default function DriverLoginPage() {
    const navigate = useNavigate();
    const { loginDriver } = useDriver();

    const [email, setEmail] = useState('');
    const [nicNumber, setNicNumber] = useState('');
    const [showNic, setShowNic] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email.trim() || !nicNumber.trim()) {
            const msg = 'Please enter your Email and NIC number.';
            setError(msg);
            toast.error(msg);
            return;
        }
        setLoading(true);
        try {
            const response = await api.post('/drivers/login', { email, nicNumber });
            if (response.data.success) {
                const { driver, token } = response.data.data;
                loginDriver(driver, token);
                toast.success('Login successful! Redirecting to portal...');
                setTimeout(() => navigate('/portal'), 1500);
            } else {
                const msg = response.data.message || 'Login failed';
                setError(msg);
                toast.error(msg);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-50 via-accent-50/30 to-primary-50/40 p-4">
            {/* Decorative background blobs - red tint */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-red-100/20 rounded-full blur-3xl pointer-events-none" />

            {/* Login card */}
            <div className="relative z-10 w-full max-w-md animate-scale-in">
                <div className="bg-white rounded-2xl shadow-xl border border-background-200 p-8">
                    {/* Logo area - red gradient */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-4 shadow-lg shadow-red-500/25">
                            <i className="ri-steering-2-line text-white text-2xl"></i>
                        </div>
                        <h1 className="text-xl font-bold text-foreground-900 font-heading">Driver Portal</h1>
                        <p className="text-sm text-foreground-400 mt-1">SRMSS — Smart Route Management</p>
                    </div>

                    {/* Error message (same) */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 animate-fade-in">
                            <i className="ri-error-warning-line text-red-500 text-sm"></i>
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-base"></i>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    placeholder="driver@example.com"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        {/* NIC Number */}
                        <div>
                            <label htmlFor="nicNumber" className="block text-sm font-medium text-foreground-700 mb-1.5">
                                NIC Number
                            </label>
                            <div className="relative">
                                <i className="ri-id-card-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-base"></i>
                                <input
                                    id="nicNumber"
                                    type={showNic ? 'text' : 'password'}
                                    value={nicNumber}
                                    onChange={(e) => setNicNumber(e.target.value)}
                                    placeholder="198512345678"
                                    maxLength={12}
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                                    autoComplete="off"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNic(!showNic)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                                >
                                    <i className={`ri-${showNic ? 'eye-off-line' : 'eye-line'} text-base`}></i>
                                </button>
                            </div>
                        </div>

                        {/* Submit button - red */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 hover:shadow-red-500/35"
                        >
                            {loading ? (
                                <>
                                    <i className="ri-loader-4-line animate-spin"></i>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <i className="ri-login-box-line"></i>
                                    <span>Start Shift</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-xs text-foreground-400 mt-6">
                        Use your registered email and NIC number to log in.
                    </p>
                </div>
            </div>
        </div>
    );
}