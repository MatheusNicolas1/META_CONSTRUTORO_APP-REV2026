import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface PublicRouteProps {
    children: React.ReactNode;
    allowAuthenticated?: boolean;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children, allowAuthenticated = false }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // Se já está logado e tentando acessar a rota de login ou site institucional,
    // recusa o acesso e redireciona ao interior do sistema
    if (isAuthenticated && !allowAuthenticated) {
        return <Navigate to="/app/dashboard" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

export default PublicRoute;
