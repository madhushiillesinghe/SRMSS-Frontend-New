// src/App.tsx
import { BrowserRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from "./router";
import { AuthProvider } from "./context/AuthContext";
import { DriverProvider } from "./context/DriverContext"; // ✅ import DriverProvider
import i18n from "./i18n";

function App() {
    return (
        <I18nextProvider i18n={i18n}>
            {/* DriverProvider wraps AuthProvider so both contexts are available */}
            <DriverProvider>
                <AuthProvider>
                    <BrowserRouter basename={__BASE_PATH__}>
                        <Toaster position="top-right" />
                        <AppRoutes />
                    </BrowserRouter>
                </AuthProvider>
            </DriverProvider>
        </I18nextProvider>
    );
}

export default App;