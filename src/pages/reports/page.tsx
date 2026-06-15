// src/app/reports/page.tsx
'use client';

import { useState } from 'react';
import Layout from '@/components/feature/Layout';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';

interface ReportCard {
    id: string;
    title: string;
    description: string;
    icon: string;
    accentClass: string;
}

interface FuelReportData {
    reportType: string;
    generatedAt: string;
    period: { startDate: string; endDate: string };
    bus: { bus_id: number; registration_number: string; bus_model: string; fuel_type: string } | null;
    summary: {
        totalFuelLiters: string;
        totalCost: string;
        averageCostPerLiter: string;
        averageEfficiency: string;
        totalRefuels: number;
    };
    byFuelType: Record<string, { totalFuel: number; totalCost: number; count: number }>;
    dailySummary: Record<string, { fuelAmount: number; cost: number }>;
    details: Array<{
        date: string;
        fuelAmount: string;
        costPerLiter: string;
        totalCost: string;
        odometerReading: string;
        refuelingLocation: string;
    }>;
}

interface RevenueReportData {
    reportType: string;
    generatedAt: string;
    period: { startDate: string; endDate: string };
    summary: {
        totalTicketsSold: number;
        totalTicketsBooked: number;
        totalCancelled: number;
        totalRevenue: string;
        averageTicketPrice: number;
        cancellationRate: string;
    };
    byPaymentMethod: Record<string, { count: number; revenue: number }>;
    dailyRevenue: Record<string, { tickets: number; revenue: number }>;
    details: Array<any>;
}

interface OperationalReportData {
    reportType: string;
    generatedAt: string;
    period: { startDate: string; endDate: string };
    summary: {
        totalSchedules: number;
        completedTrips: number;
        delayedTrips: number;
        cancelledTrips: number;
        onTimeRate: string;
        averageDelayMinutes: number;
        totalPassengers: number;
        totalRevenue: string;
        averagePassengersPerTrip: string;
    };
    routePerformance: any[];
    driverPerformance: any[];
    busUtilization: any[];
    details: Array<{
        scheduleCode: string;
        route: string;
        bus: string;
        driver: string;
        departureTime: string;
        status: string;
        delayMinutes: number;
        passengers: number;
        revenue: string;
    }>;
}

interface FleetReportData {
    reportType: string;
    generatedAt: string;
    summary: {
        totalBuses: number;
        availableBuses: string;
        onRouteBuses: string;
        maintenanceBuses: string;
        inactiveBuses: string;
        utilizationRate: string;
        totalDrivers: number;
        availableDrivers: string;
        driversOnDuty: string;
        totalCapacity: string;
        averageCapacity: string;
        averageMileage: string;
    };
    busesByType: Array<{ bus_type: string; count: number; available: string; on_route: string; in_maintenance: string }>;
    busesByFuel: Array<{ fuel_type: string; count: number; total_capacity: string; avg_mileage: string }>;
    maintenanceSummary: Array<{ maintenance_type: string; count: number; total_cost: string; avg_cost: string }>;
    totalFuelCostLast90Days: string;
    totalMaintenanceCostLast90Days: number;
}

interface DashboardReportData {
    reportType: string;
    generatedAt: string;
    period: { startDate: string; endDate: string };
    executiveSummary: {
        totalRevenue: string;
        totalTripsCompleted: number;
        totalPassengers: number;
        onTimeRate: string;
        fleetUtilization: string;
        totalFuelCost: string;
        totalMaintenanceCost: string;
        netProfit: string;
    };
    fuelReport: FuelReportData;
    maintenanceReport: any;
    revenueReport: RevenueReportData;
    operationalReport: OperationalReportData;
    fleetReport: FleetReportData;
}

const reportCards: ReportCard[] = [
    {
        id: 'fuel-consumption',
        title: 'Fuel Consumption Report',
        description: 'Fuel usage per bus, cost per km, efficiency trends',
        icon: 'ri-oil-line',
        accentClass: 'bg-secondary-100 text-secondary-700',
    },
    {
        id: 'revenue',
        title: 'Revenue Report',
        description: 'Ticket sales, revenue by route, payment methods',
        icon: 'ri-money-dollar-circle-line',
        accentClass: 'bg-emerald-100 text-emerald-700',
    },
    {
        id: 'operational',
        title: 'Operational Performance',
        description: 'Trip completion rates, on-time performance, delays',
        icon: 'ri-bar-chart-2-line',
        accentClass: 'bg-primary-100 text-primary-700',
    },
    {
        id: 'fleet',
        title: 'Fleet Utilization',
        description: 'Bus usage, driver availability, capacity utilization',
        icon: 'ri-bus-line',
        accentClass: 'bg-accent-100 text-accent-700',
    },
    {
        id: 'maintenance',
        title: 'Maintenance Cost',
        description: 'Cost by category, cost by bus, scheduled vs unscheduled',
        icon: 'ri-tools-line',
        accentClass: 'bg-amber-100 text-amber-700',
    },
    {
        id: 'dashboard',
        title: 'Complete Dashboard',
        description: 'Executive summary with all key metrics',
        icon: 'ri-dashboard-line',
        accentClass: 'bg-purple-100 text-purple-700',
    },
];

export default function ReportsPage() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({ from: '2026-06-01', to: '2026-06-30' });
    const [busId, setBusId] = useState<string>('');
    const [exporting, setExporting] = useState(false);
    const [loading, setLoading] = useState(false);

    // Report data states
    const [fuelReport, setFuelReport] = useState<FuelReportData | null>(null);
    const [revenueReport, setRevenueReport] = useState<RevenueReportData | null>(null);
    const [operationalReport, setOperationalReport] = useState<OperationalReportData | null>(null);
    const [fleetReport, setFleetReport] = useState<FleetReportData | null>(null);
    const [dashboardReport, setDashboardReport] = useState<DashboardReportData | null>(null);
    const [maintenanceReport, setMaintenanceReport] = useState<any>(null);

    // Fetch Fuel Report
    const fetchFuelReport = async () => {
        if (!dateRange.from || !dateRange.to) {
            toast.error('Please select date range');
            return;
        }

        setLoading(true);
        try {
            const url = `/reports/fuel?startDate=${dateRange.from}&endDate=${dateRange.to}${busId ? `&busId=${busId}` : ''}`;
            const response = await api.get(url);
            if (response.data.success) {
                setFuelReport(response.data.data);
                toast.success('Fuel report loaded');
            }
        } catch (error: any) {
            console.error("Error fetching fuel report:", error);
            toast.error(error.response?.data?.message || 'Failed to load fuel report');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Revenue Report
    const fetchRevenueReport = async () => {
        if (!dateRange.from || !dateRange.to) {
            toast.error('Please select date range');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/reports/revenue?startDate=${dateRange.from}&endDate=${dateRange.to}`);
            if (response.data.success) {
                setRevenueReport(response.data.data);
                toast.success('Revenue report loaded');
            }
        } catch (error: any) {
            console.error("Error fetching revenue report:", error);
            toast.error(error.response?.data?.message || 'Failed to load revenue report');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Operational Report
    const fetchOperationalReport = async () => {
        if (!dateRange.from || !dateRange.to) {
            toast.error('Please select date range');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/reports/operational?startDate=${dateRange.from}&endDate=${dateRange.to}`);
            if (response.data.success) {
                setOperationalReport(response.data.data);
                toast.success('Operational report loaded');
            }
        } catch (error: any) {
            console.error("Error fetching operational report:", error);
            toast.error(error.response?.data?.message || 'Failed to load operational report');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Fleet Report
    const fetchFleetReport = async () => {
        setLoading(true);
        try {
            const response = await api.get('/reports/fleet');
            if (response.data.success) {
                setFleetReport(response.data.data);
                toast.success('Fleet report loaded');
            }
        } catch (error: any) {
            console.error("Error fetching fleet report:", error);
            toast.error(error.response?.data?.message || 'Failed to load fleet report');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Maintenance Report
    const fetchMaintenanceReport = async () => {
        if (!dateRange.from || !dateRange.to) {
            toast.error('Please select date range');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/reports/maintenance?startDate=${dateRange.from}&endDate=${dateRange.to}`);
            if (response.data.success) {
                setMaintenanceReport(response.data.data);
                toast.success('Maintenance report loaded');
            }
        } catch (error: any) {
            console.error("Error fetching maintenance report:", error);
            toast.error(error.response?.data?.message || 'Failed to load maintenance report');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Dashboard Report
    const fetchDashboardReport = async () => {
        if (!dateRange.from || !dateRange.to) {
            toast.error('Please select date range');
            return;
        }

        setLoading(true);
        try {
            const response = await api.get(`/reports/dashboard?startDate=${dateRange.from}&endDate=${dateRange.to}`);
            if (response.data.success) {
                setDashboardReport(response.data.data);
                toast.success('Dashboard report loaded');
            }
        } catch (error: any) {
            console.error("Error fetching dashboard report:", error);
            toast.error(error.response?.data?.message || 'Failed to load dashboard report');
        } finally {
            setLoading(false);
        }
    };

    // Export as PDF
    const handleExportPDF = async () => {
        if (!selectedReport) {
            toast.error('Please select a report first');
            return;
        }

        if (!dateRange.from || !dateRange.to) {
            toast.error('Please select date range');
            return;
        }

        setExporting(true);
        try {
            let url = '';
            switch (selectedReport) {
                case 'fuel-consumption':
                    url = `/reports/fuel?startDate=${dateRange.from}&endDate=${dateRange.to}&format=pdf${busId ? `&busId=${busId}` : ''}`;
                    break;
                case 'revenue':
                    url = `/reports/revenue?startDate=${dateRange.from}&endDate=${dateRange.to}&format=pdf`;
                    break;
                case 'operational':
                    url = `/reports/operational?startDate=${dateRange.from}&endDate=${dateRange.to}&format=pdf`;
                    break;
                default:
                    toast.error('PDF export not available for this report');
                    setExporting(false);
                    return;
            }

            const response = await api.get(url, { responseType: 'blob' });

            // Create download link
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const link = document.createElement('a');
            const urlObj = URL.createObjectURL(blob);
            link.href = urlObj;
            link.download = `${selectedReport}_${dateRange.from}_to_${dateRange.to}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(urlObj);

            toast.success('Report exported successfully');
        } catch (error: any) {
            console.error("Export error:", error);
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    };

    const handleReportSelect = async (reportId: string) => {
        setSelectedReport(reportId === selectedReport ? null : reportId);

        if (reportId !== selectedReport) {
            switch (reportId) {
                case 'fuel-consumption':
                    await fetchFuelReport();
                    break;
                case 'revenue':
                    await fetchRevenueReport();
                    break;
                case 'operational':
                    await fetchOperationalReport();
                    break;
                case 'fleet':
                    await fetchFleetReport();
                    break;
                case 'maintenance':
                    await fetchMaintenanceReport();
                    break;
                case 'dashboard':
                    await fetchDashboardReport();
                    break;
            }
        }
    };

    const formatCurrency = (amount: string | number) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString();
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString();
    };

    return (
        <Layout>
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Reports</h1>
                <p className="text-sm text-foreground-400 mt-1">Generate and export operational reports</p>
            </div>

            {/* Report Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {reportCards.map((card) => (
                    <button
                        key={card.id}
                        onClick={() => handleReportSelect(card.id)}
                        className={`bg-white rounded-lg border p-5 text-left transition-all cursor-pointer hover:shadow-md ${
                            selectedReport === card.id
                                ? 'border-primary-400 shadow-lg shadow-primary-500/10 ring-2 ring-primary-100'
                                : 'border-background-200'
                        }`}
                    >
                        <div className={`w-10 h-10 rounded-lg ${card.accentClass} flex items-center justify-center mb-3`}>
                            <i className={`${card.icon} text-lg`}></i>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading mb-1">{card.title}</h3>
                        <p className="text-xs text-foreground-400">{card.description}</p>
                    </button>
                ))}
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg border border-background-200 p-5 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <h3 className="text-sm font-semibold text-foreground-900 font-heading whitespace-nowrap">Date Range</h3>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-foreground-400">From</label>
                            <input
                                type="date"
                                value={dateRange.from}
                                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-foreground-400">To</label>
                            <input
                                type="date"
                                value={dateRange.to}
                                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                className="px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                            />
                        </div>

                        {/* Bus filter for fuel report */}
                        {selectedReport === 'fuel-consumption' && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-foreground-400">Bus ID (optional)</label>
                                <input
                                    type="text"
                                    value={busId}
                                    onChange={(e) => setBusId(e.target.value)}
                                    placeholder="Enter bus ID"
                                    className="px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 w-32"
                                />
                            </div>
                        )}

                        <button
                            onClick={() => {
                                switch (selectedReport) {
                                    case 'fuel-consumption': fetchFuelReport(); break;
                                    case 'revenue': fetchRevenueReport(); break;
                                    case 'operational': fetchOperationalReport(); break;
                                    case 'fleet': fetchFleetReport(); break;
                                    case 'maintenance': fetchMaintenanceReport(); break;
                                    case 'dashboard': fetchDashboardReport(); break;
                                    default: toast.error('Please select a report');
                                }
                            }}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20 disabled:opacity-60"
                        >
                            <i className={`${loading ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'}`}></i>
                            <span>{loading ? 'Loading...' : 'Load Report'}</span>
                        </button>

                        {(selectedReport === 'fuel-consumption') && (
                            <button
                                onClick={handleExportPDF}
                                disabled={exporting || loading}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-secondary-500/20 disabled:opacity-60"
                            >
                                <i className={`${exporting ? 'ri-loader-4-line animate-spin' : 'ri-file-pdf-2-line'}`}></i>
                                <span>{exporting ? 'Exporting...' : 'Export PDF'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <span className="ml-2 text-foreground-500">Loading report data...</span>
                </div>
            )}

            {/* Fuel Consumption Report */}
            {selectedReport === 'fuel-consumption' && fuelReport && !loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden animate-fade-in-up">
                    <div className="px-5 py-4 border-b border-background-200 bg-background-50">
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading">
                            Fuel Consumption Report — {fuelReport.period.startDate} to {fuelReport.period.endDate}
                        </h3>
                        <p className="text-xs text-foreground-400 mt-1">Generated: {new Date(fuelReport.generatedAt).toLocaleString()}</p>
                    </div>
                    <div className="p-5">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-foreground-900 font-heading">{fuelReport.summary.totalFuelLiters}</p>
                                <p className="text-xs text-foreground-400 mt-1">Total Fuel (Liters)</p>
                            </div>
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-primary-600 font-heading">LKR {formatCurrency(fuelReport.summary.totalCost)}</p>
                                <p className="text-xs text-foreground-400 mt-1">Total Cost</p>
                            </div>
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-accent-600 font-heading">LKR {formatCurrency(fuelReport.summary.averageCostPerLiter)}</p>
                                <p className="text-xs text-foreground-400 mt-1">Avg Cost/Liter</p>
                            </div>
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-secondary-600 font-heading">{fuelReport.summary.totalRefuels}</p>
                                <p className="text-xs text-foreground-400 mt-1">Total Refuels</p>
                            </div>
                        </div>

                        {/* Bus Details */}
                        {fuelReport.bus && (
                            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                                <h4 className="text-sm font-semibold text-primary-700 mb-2">Bus Details</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                    <div><span className="text-foreground-400">Registration:</span> <span className="font-semibold">{fuelReport.bus.registration_number}</span></div>
                                    <div><span className="text-foreground-400">Model:</span> <span className="font-semibold">{fuelReport.bus.bus_model}</span></div>
                                    <div><span className="text-foreground-400">Fuel Type:</span> <span className="font-semibold">{fuelReport.bus.fuel_type}</span></div>
                                </div>
                            </div>
                        )}

                        {/* Fuel Details Table */}
                        <h4 className="text-xs font-semibold text-foreground-400 uppercase mb-3">Fuel Log Details</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-background-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Date</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Fuel (L)</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Cost/Liter</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Total Cost</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Odometer</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Location</th>
                                </tr>
                                </thead>
                                <tbody>
                                {fuelReport.details.map((detail, index) => (
                                    <tr key={index} className="border-b border-background-50">
                                        <td className="px-4 py-3 text-foreground-600">{detail.date}</td>
                                        <td className="px-4 py-3 text-foreground-600">{detail.fuelAmount}</td>
                                        <td className="px-4 py-3 text-foreground-600">LKR {detail.costPerLiter}</td>
                                        <td className="px-4 py-3 text-foreground-800 font-semibold">LKR {detail.totalCost}</td>
                                        <td className="px-4 py-3 text-foreground-600">{detail.odometerReading} km</td>
                                        <td className="px-4 py-3 text-foreground-600">{detail.refuelingLocation || '-'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Revenue Report */}
            {selectedReport === 'revenue' && revenueReport && !loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden animate-fade-in-up">
                    <div className="px-5 py-4 border-b border-background-200 bg-background-50">
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading">
                            Revenue Report — {revenueReport.period.startDate} to {revenueReport.period.endDate}
                        </h3>
                        <p className="text-xs text-foreground-400 mt-1">Generated: {new Date(revenueReport.generatedAt).toLocaleString()}</p>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-emerald-600 font-heading">LKR {formatCurrency(revenueReport.summary.totalRevenue)}</p>
                                <p className="text-xs text-foreground-400 mt-1">Total Revenue</p>
                            </div>
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-foreground-900 font-heading">{revenueReport.summary.totalTicketsBooked}</p>
                                <p className="text-xs text-foreground-400 mt-1">Tickets Booked</p>
                            </div>
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-foreground-900 font-heading">{revenueReport.summary.totalTicketsSold}</p>
                                <p className="text-xs text-foreground-400 mt-1">Tickets Used</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-amber-600 font-heading">{revenueReport.summary.cancellationRate}%</p>
                                <p className="text-xs text-foreground-400 mt-1">Cancellation Rate</p>
                            </div>
                        </div>

                        {Object.keys(revenueReport.dailyRevenue).length > 0 && (
                            <>
                                <h4 className="text-xs font-semibold text-foreground-400 uppercase mb-3">Daily Revenue Breakdown</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b border-background-100">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Date</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Tickets</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Revenue</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {Object.entries(revenueReport.dailyRevenue).map(([date, data]: [string, any]) => (
                                            <tr key={date} className="border-b border-background-50">
                                                <td className="px-4 py-3 text-foreground-600">{date}</td>
                                                <td className="px-4 py-3 text-foreground-600">{data.tickets}</td>
                                                <td className="px-4 py-3 text-foreground-800 font-semibold">LKR {formatCurrency(data.revenue)}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {revenueReport.details.length === 0 && Object.keys(revenueReport.dailyRevenue).length === 0 && (
                            <div className="text-center py-8 text-foreground-400">
                                <i className="ri-information-line text-3xl mb-2 block"></i>
                                <p>No revenue data available for selected period</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Operational Report */}
            {selectedReport === 'operational' && operationalReport && !loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden animate-fade-in-up">
                    <div className="px-5 py-4 border-b border-background-200 bg-background-50">
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading">
                            Operational Performance Report — {operationalReport.period.startDate} to {operationalReport.period.endDate}
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-foreground-900 font-heading">{operationalReport.summary.totalSchedules}</p>
                                <p className="text-xs text-foreground-400 mt-1">Total Trips</p>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-emerald-600 font-heading">{operationalReport.summary.completedTrips}</p>
                                <p className="text-xs text-foreground-400 mt-1">Completed</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-amber-600 font-heading">{operationalReport.summary.delayedTrips}</p>
                                <p className="text-xs text-foreground-400 mt-1">Delayed</p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-red-600 font-heading">{operationalReport.summary.cancelledTrips}</p>
                                <p className="text-xs text-foreground-400 mt-1">Cancelled</p>
                            </div>
                            <div className="bg-primary-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-primary-600 font-heading">{operationalReport.summary.onTimeRate}%</p>
                                <p className="text-xs text-foreground-400 mt-1">On-Time Rate</p>
                            </div>
                        </div>

                        <h4 className="text-xs font-semibold text-foreground-400 uppercase mb-3">Trip Details</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                <tr className="border-b border-background-100">
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Schedule Code</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Route</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Bus</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Driver</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Departure</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Delay</th>
                                </tr>
                                </thead>
                                <tbody>
                                {operationalReport.details.map((detail, index) => (
                                    <tr key={index} className="border-b border-background-50">
                                        <td className="px-4 py-3 text-foreground-600 font-mono text-xs">{detail.scheduleCode}</td>
                                        <td className="px-4 py-3 text-foreground-600">{detail.route}</td>
                                        <td className="px-4 py-3 text-foreground-600">{detail.bus}</td>
                                        <td className="px-4 py-3 text-foreground-600">{detail.driver}</td>
                                        <td className="px-4 py-3 text-foreground-600">{formatDateTime(detail.departureTime)}</td>
                                        <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                    detail.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        detail.status === 'delayed' ? 'bg-amber-100 text-amber-700' :
                                                            detail.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                detail.status === 'in_progress' ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {detail.status}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-foreground-600">{detail.delayMinutes > 0 ? `${detail.delayMinutes} min` : '—'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Fleet Report */}
            {selectedReport === 'fleet' && fleetReport && !loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden animate-fade-in-up">
                    <div className="px-5 py-4 border-b border-background-200 bg-background-50">
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading">Fleet Utilization Report</h3>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-foreground-900 font-heading">{fleetReport.summary.totalBuses}</p>
                                <p className="text-xs text-foreground-400 mt-1">Total Buses</p>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-emerald-600 font-heading">{fleetReport.summary.availableBuses}</p>
                                <p className="text-xs text-foreground-400 mt-1">Available Buses</p>
                            </div>
                            <div className="bg-primary-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-primary-600 font-heading">{fleetReport.summary.utilizationRate}%</p>
                                <p className="text-xs text-foreground-400 mt-1">Utilization Rate</p>
                            </div>
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-foreground-900 font-heading">{fleetReport.summary.totalDrivers}</p>
                                <p className="text-xs text-foreground-400 mt-1">Total Drivers</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h4 className="text-xs font-semibold text-foreground-400 uppercase mb-3">Buses by Type</h4>
                                <div className="space-y-2">
                                    {fleetReport.busesByType.map((type, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-background-50 rounded-lg">
                                            <span className="font-medium text-foreground-800">{type.bus_type}</span>
                                            <div className="flex gap-4">
                                                <span className="text-sm text-foreground-600">Total: {type.count}</span>
                                                <span className="text-sm text-emerald-600">Available: {type.available}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-foreground-400 uppercase mb-3">Buses by Fuel Type</h4>
                                <div className="space-y-2">
                                    {fleetReport.busesByFuel.map((fuel, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-background-50 rounded-lg">
                                            <span className="font-medium text-foreground-800">{fuel.fuel_type}</span>
                                            <div className="flex gap-4">
                                                <span className="text-sm text-foreground-600">Count: {fuel.count}</span>
                                                <span className="text-sm text-accent-600">Avg Mileage: {parseFloat(fuel.avg_mileage).toFixed(1)} km/L</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="text-sm font-semibold text-amber-700 mb-2">Cost Summary</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-amber-600">Total Fuel Cost (Last 90 Days)</p>
                                    <p className="text-xl font-bold text-amber-700">LKR {formatCurrency(fleetReport.totalFuelCostLast90Days)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-amber-600">Total Maintenance Cost (Last 90 Days)</p>
                                    <p className="text-xl font-bold text-amber-700">LKR {formatCurrency(fleetReport.totalMaintenanceCostLast90Days)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Maintenance Report */}
            {selectedReport === 'maintenance' && maintenanceReport && !loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden animate-fade-in-up">
                    <div className="px-5 py-4 border-b border-background-200 bg-background-50">
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading">
                            Maintenance Cost Report — {maintenanceReport.period?.startDate} to {maintenanceReport.period?.endDate}
                        </h3>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-foreground-900 font-heading">{maintenanceReport.summary?.totalMaintenanceJobs || 0}</p>
                                <p className="text-xs text-foreground-400 mt-1">Total Jobs</p>
                            </div>
                            <div className="bg-amber-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-amber-600 font-heading">LKR {formatCurrency(maintenanceReport.summary?.totalCost || 0)}</p>
                                <p className="text-xs text-foreground-400 mt-1">Total Cost</p>
                            </div>
                            <div className="bg-background-50 rounded-lg p-4 text-center">
                                <p className="text-2xl font-bold text-foreground-900 font-heading">LKR {formatCurrency(maintenanceReport.summary?.averageCostPerJob || 0)}</p>
                                <p className="text-xs text-foreground-400 mt-1">Avg Cost/Job</p>
                            </div>
                        </div>

                        {maintenanceReport.details && maintenanceReport.details.length > 0 && (
                            <>
                                <h4 className="text-xs font-semibold text-foreground-400 uppercase mb-3">Maintenance Records</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                        <tr className="border-b border-background-100">
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Date</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Type</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Category</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Description</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Cost</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {maintenanceReport.details.map((detail: any, index: number) => (
                                            <tr key={index} className="border-b border-background-50">
                                                <td className="px-4 py-3 text-foreground-600">{detail.date}</td>
                                                <td className="px-4 py-3 text-foreground-600">{detail.type}</td>
                                                <td className="px-4 py-3 text-foreground-600">{detail.category}</td>
                                                <td className="px-4 py-3 text-foreground-600">{detail.description}</td>
                                                <td className="px-4 py-3 text-foreground-800 font-semibold">LKR {formatCurrency(detail.cost)}</td>
                                                <td className="px-4 py-3">
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                            detail.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {detail.status}
                                                        </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Dashboard Report */}
            {selectedReport === 'dashboard' && dashboardReport && !loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden animate-fade-in-up">
                    <div className="px-5 py-4 border-b border-background-200 bg-background-50">
                        <h3 className="text-sm font-semibold text-foreground-900 font-heading">
                            Complete Dashboard Report — {dashboardReport.period.startDate} to {dashboardReport.period.endDate}
                        </h3>
                    </div>
                    <div className="p-5">
                        {/* Executive Summary */}
                        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-5 mb-6 border border-primary-100">
                            <h4 className="text-sm font-semibold text-primary-700 mb-3">Executive Summary</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-foreground-400">Total Revenue</p>
                                    <p className="text-xl font-bold text-primary-600">LKR {formatCurrency(dashboardReport.executiveSummary.totalRevenue)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-foreground-400">Trips Completed</p>
                                    <p className="text-xl font-bold text-emerald-600">{dashboardReport.executiveSummary.totalTripsCompleted}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-foreground-400">On-Time Rate</p>
                                    <p className="text-xl font-bold text-amber-600">{dashboardReport.executiveSummary.onTimeRate}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-foreground-400">Net Profit</p>
                                    <p className={`text-xl font-bold ${parseFloat(dashboardReport.executiveSummary.netProfit) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        LKR {formatCurrency(dashboardReport.executiveSummary.netProfit)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3">
                                    <i className="ri-oil-line text-2xl text-blue-600"></i>
                                    <div>
                                        <p className="text-xs text-blue-600">Fuel Cost</p>
                                        <p className="text-lg font-bold text-blue-700">LKR {formatCurrency(dashboardReport.executiveSummary.totalFuelCost)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-3">
                                    <i className="ri-tools-line text-2xl text-purple-600"></i>
                                    <div>
                                        <p className="text-xs text-purple-600">Maintenance Cost</p>
                                        <p className="text-lg font-bold text-purple-700">LKR {formatCurrency(dashboardReport.executiveSummary.totalMaintenanceCost)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <div className="flex items-center gap-3">
                                    <i className="ri-bus-line text-2xl text-emerald-600"></i>
                                    <div>
                                        <p className="text-xs text-emerald-600">Fleet Utilization</p>
                                        <p className="text-lg font-bold text-emerald-700">{dashboardReport.executiveSummary.fleetUtilization}%</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation to other reports */}
                        <div className="text-center text-sm text-foreground-400">
                            <i className="ri-information-line mr-1"></i>
                            View individual report cards above for detailed breakdowns
                        </div>
                    </div>
                </div>
            )}

            {/* No Report Selected */}
            {!selectedReport && !loading && (
                <div className="bg-white rounded-lg border border-background-200 p-12 text-center">
                    <i className="ri-bar-chart-2-line text-5xl text-foreground-300 mb-4 block"></i>
                    <h3 className="text-lg font-semibold text-foreground-900 mb-2">Select a Report</h3>
                    <p className="text-sm text-foreground-400">
                        Choose a report from the cards above to view detailed analytics
                    </p>
                </div>
            )}
        </Layout>
    );
}