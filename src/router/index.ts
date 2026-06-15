// src/router/index.tsx
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useRoutes } from "react-router-dom";
import { useEffect } from "react";
import routes from "./config.tsx";

let navigateResolver: (navigate: ReturnType<typeof useNavigate>) => void;

declare global {
    interface Window {
        REACT_APP_NAVIGATE: ReturnType<typeof useNavigate>;
    }
}

export const navigatePromise = new Promise<NavigateFunction>((resolve) => {
    navigateResolver = resolve;
});

export function AppRoutes() {
    const element = useRoutes(routes);
    const navigate = useNavigate();
    useEffect(() => {
        window.REACT_APP_NAVIGATE = navigate;
        navigateResolver(window.REACT_APP_NAVIGATE);
    }, [navigate]); // Added dependency array
    return element;
}