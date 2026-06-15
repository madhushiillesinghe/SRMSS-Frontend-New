import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import {LoginPage} from "../pages/login/page";
import DashboardPage from "../pages/dashboard/page";
import RoutesPage from "../pages/routes/page";
import BusesPage from "../pages/buses/page";
import DriversPage from "../pages/drivers/page";
import SchedulesPage from "../pages/schedules/page";
import TrackerPage from "../pages/tracker/page";
import TicketsPage from "../pages/tickets/page";
import FuelLogsPage from "../pages/fuel-logs/page";
import MaintenanceLogsPage from "../pages/maintenance-logs/page";
import ReportsPage from "../pages/reports/page";
import AdminUsersPage from "../pages/admin-users/page";
import ProtectedRoute from "../components/base/ProtectedRoute";
import SettingsPage from "@/pages/settings/page.tsx";
import DriverLoginPage from "../pages/driver-login/page";
import PortalPage from "../pages/Portal.tsx";
import PortalSelectPage from '../pages/portal-select/PortalSelect';



const routes: RouteObject[] = [
  { path: "/", element: <Home /> },
  { path: "/login", element: <LoginPage /> },

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute module="dashboard">
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/routes",
    element: (
      <ProtectedRoute module="routes">
        <RoutesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/buses",
    element: (
      <ProtectedRoute module="buses">
        <BusesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/drivers",
    element: (
      <ProtectedRoute module="drivers">
        <DriversPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/schedules",
    element: (
      <ProtectedRoute module="schedules">
        <SchedulesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tracker",
    element: (
      <ProtectedRoute module="tracker">
        <TrackerPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tickets",
    element: (
      <ProtectedRoute module="tickets">
        <TicketsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/fuel-logs",
    element: (
      <ProtectedRoute module="fuel-logs">
        <FuelLogsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/maintenance-logs",
    element: (
      <ProtectedRoute module="maintenance-logs">
        <MaintenanceLogsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/reports",
    element: (
      <ProtectedRoute module="reports">
        <ReportsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin-users",
    element: (
      <ProtectedRoute module="admin-users">
        <AdminUsersPage />
      </ProtectedRoute>
    ),
  },
    {
        path: "/settings",
        element: (
            <ProtectedRoute module="settings">
                <SettingsPage/>
            </ProtectedRoute>
        ),
    },
    {
        path: "/driver/login",
        element: (
                <DriverLoginPage/>
        ),
    },
    {
        path: "/portal",
        element: (
                <PortalPage/>
        ),
    },
{ path: "/landing", element: <PortalSelectPage /> },

  { path: "*", element: <NotFound /> },
];

export default routes;