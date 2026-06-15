// src/components/base/ProtectedRoute.tsx
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import { canAccess } from "@/config/permissions.ts";

interface ProtectedRouteProps {
    module: string;
    children: ReactNode;
}

const ProtectedRoute = ({ module, children }: ProtectedRouteProps) => {
    const { user, isAuthenticated, loading } = useAuth();

    console.log("ProtectedRoute - Module:", module);
    console.log("ProtectedRoute - User:", user);
    console.log("ProtectedRoute - isAuthenticated:", isAuthenticated);
    console.log("ProtectedRoute - loading:", loading);

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        console.log("Not authenticated, redirecting to login");
        return <Navigate to="/login" replace />;
    }

    // Check if user has access to this module
    if (!canAccess(user.role, module)) {
        console.log(`User role ${user.role} cannot access ${module}, redirecting to dashboard`);
        return <Navigate to="/dashboard" replace />;
    }

    console.log("Access granted to:", module);
    return <>{children}</>;
};

export default ProtectedRoute;