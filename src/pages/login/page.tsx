import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '@/services/authService.ts';
import { toast } from 'react-hot-toast';

export function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!username || !password) {
            const errorMsg = 'Please fill all fields';
            setError(errorMsg);
            toast.error(errorMsg);
            return;
        }

        // Clear any existing session before attempting login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        sessionStorage.clear();

        try {
            setLoading(true);

            const response = await authService.login(username, password);
            console.log("Login response:", response);

            // Check if login was successful
            if (!response || response.success === false) {
                const errorMsg = response?.message || 'Invalid username or password';
                setError(errorMsg);
                toast.error(errorMsg);
                setLoading(false);
                return;
            }

            // Check if we have the required data
            if (!response.data?.accessToken) {
                const errorMsg = 'Invalid response from server';
                setError(errorMsg);
                toast.error(errorMsg);
                setTimeout(() => {
                }, 1500);
                setLoading(false);
                return;
            }

            // Login successful
            login(response);
            toast.success('Login successful! Redirecting to dashboard...');

            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);

        } catch (error: any) {
            console.error("Login error:", error);

            // Clear any tokens that might have been stored
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            sessionStorage.clear();

            // Get error message
            let errorMsg = error?.message || 'Invalid username or password';

            setError(errorMsg);
            toast.error(errorMsg);
            setTimeout(() => {
            }, 1500);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-50 via-accent-50/30 to-primary-50/40 p-4">
            {/* Decorative background blobs */}
            <div
                className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl pointer-events-none"/>
            <div
                className="absolute bottom-0 left-0 w-80 h-80 bg-accent-200/30 rounded-full blur-3xl pointer-events-none"/>
            <div
                className="absolute top-1/3 left-1/4 w-64 h-64 bg-secondary-200/20 rounded-full blur-3xl pointer-events-none"/>

            {/* Login card */}
            <div className="relative z-10 w-full max-w-md animate-scale-in">
                <div className="bg-white rounded-2xl shadow-xl border border-background-200 p-8">
                    {/* Logo area */}
                    <div className="flex flex-col items-center mb-8">
                        <div
                            className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/25">
                            <i className="ri-bus-wifi-line text-white text-2xl"></i>
                        </div>
                        <h1 className="text-xl font-bold text-foreground-900 font-heading">SRMSS</h1>
                        <p className="text-sm text-foreground-400 mt-1">Smart Route Management &amp; Scheduling
                            System</p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div
                            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 animate-fade-in">
                            <i className="ri-error-warning-line text-red-500 text-sm"></i>
                            <span className="text-sm text-red-700">{error}</span>
                        </div>
                    )}

                    {/* Login form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-foreground-700 mb-1.5">
                                Username
                            </label>
                            <div className="relative">
                                <i className="ri-user-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-base"></i>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Enter your username"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <i className="ri-lock-2-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-base"></i>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-background-300 bg-background-50 text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-400 hover:text-foreground-600 transition-colors cursor-pointer"
                                >
                                    <i className={`ri-${showPassword ? 'eye-off-line' : 'eye-line'} text-base`}></i>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 hover:shadow-primary-500/35"
                        >
                            {loading ? (
                                <>
                                    <i className="ri-loader-4-line animate-spin"></i>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <i className="ri-login-box-line"></i>
                                    <span>Sign in</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}