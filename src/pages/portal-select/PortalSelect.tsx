import { useNavigate } from 'react-router-dom';

export default function PortalSelectPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background-50 via-accent-50/30 to-primary-50/40 p-4">
            {/* Decorative background blobs — matches login page */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-secondary-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-background-200 p-8">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4 shadow-lg shadow-primary-500/25">
                            <i className="ri-bus-wifi-line text-white text-2xl"></i>
                        </div>
                        <h1 className="text-xl font-bold text-foreground-900 font-heading">SRMSS</h1>
                        <p className="text-sm text-foreground-400 mt-1">Smart Route Management &amp; Scheduling System</p>
                    </div>

                    {/* Prompt */}
                    <div className="text-center mb-6">
                        <h2 className="text-base font-semibold text-foreground-800">Welcome! How are you signing in?</h2>
                        <p className="text-sm text-foreground-400 mt-1">Choose your portal to continue</p>
                    </div>

                    {/* Portal cards */}
                    <div className="space-y-3">

                        {/* Operator card */}
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full group flex items-center gap-4 p-4 rounded-xl border-2 border-background-200 bg-background-50 hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200 cursor-pointer text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center flex-shrink-0 transition-colors">
                                <i className="ri-shield-user-line text-primary-600 text-2xl"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground-900 group-hover:text-primary-700 transition-colors">
                                    I'm an Operator / Staff
                                </p>
                                <p className="text-xs text-foreground-400 mt-0.5">
                                    Admin, Depot Manager, Logistics Officer, Depot Clerk
                                </p>
                            </div>
                            <i className="ri-arrow-right-s-line text-foreground-300 group-hover:text-primary-500 text-xl flex-shrink-0 transition-colors group-hover:translate-x-0.5 transform"></i>
                        </button>

                        {/* Driver card */}
                        <button
                            onClick={() => navigate('/driver/login')}
                            className="w-full group flex items-center gap-4 p-4 rounded-xl border-2 border-background-200 bg-background-50 hover:border-primary-400 hover:bg-primary-50/50 transition-all duration-200 cursor-pointer text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center flex-shrink-0 transition-colors">
                                <i className="ri-steering-2-line text-primary-600 text-2xl"></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-foreground-900 group-hover:text-primary-700 transition-colors">
                                    I'm a Driver
                                </p>
                                <p className="text-xs text-foreground-400 mt-0.5">
                                    Sign in to track your route halts and shifts
                                </p>
                            </div>
                            <i className="ri-arrow-right-s-line text-foreground-300 group-hover:text-primary-500 text-xl flex-shrink-0 transition-colors group-hover:translate-x-0.5 transform"></i>
                        </button>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-xs text-foreground-300 mt-6">
                        Not sure? Contact your depot administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}
