// src/app/schedules/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';
import Layout from '@/components/feature/Layout';

interface Schedule {
    schedule_id: number;
    schedule_code: string;
    route_id: number;
    bus_id: number;
    driver_id: number;
    departure_time: string;
    arrival_time: string;
    trip_type: 'regular' | 'express' | 'night' | 'special';
    trip_status: 'scheduled' | 'on_time' | 'delayed' | 'in_progress' | 'completed' | 'cancelled';
    delay_minutes: number;
    delay_reason: string | null;
    actual_departure: string | null;
    actual_arrival: string | null;
    passenger_count: number;
    revenue: number | string;
    notes: string | null;
    Route?: {
        route_id: number;
        route_code: string;
        route_name: string;
        estimated_duration: number;
    };
    Bus?: {
        bus_id: number;
        registration_number: string;
        bus_model: string;
    };
    Driver?: {
        driver_id: number;
        driver_code: string;
        first_name: string;
        last_name: string;
    };
}

interface Route {
    route_id: number;
    route_code: string;
    route_name: string;
    estimated_duration: number;
    status: string;
}

interface Bus {
    bus_id: number;
    registration_number: string;
    bus_model: string;
    status: string;
}

interface Driver {
    driver_id: number;
    driver_code: string;
    first_name: string;
    last_name: string;
    status: string;
}

interface TripItem {
    id: string;
    time: string;
    type: string;
}

interface ConflictInfo {
    hasConflict: boolean;
    busConflicts: Schedule[];
    driverConflicts: Schedule[];
    message: string;
}

const statusBadge: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    on_time: 'bg-emerald-100 text-emerald-700',
    delayed: 'bg-amber-100 text-amber-700',
    in_progress: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
};

const tripTypeBadge: Record<string, string> = {
    regular: 'bg-gray-100 text-gray-600',
    express: 'bg-amber-100 text-amber-700',
    night: 'bg-indigo-100 text-indigo-700',
    special: 'bg-pink-100 text-pink-700',
};

export default function SchedulesPage() {
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [buses, setBuses] = useState<Bus[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit' | null>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
    const [form, setForm] = useState({
        route_id: '',
        bus_id: '',
        driver_id: '',
        departure_time: '',
        arrival_time: '',
        trip_type: 'regular',
        trip_status: 'scheduled',
        delay_minutes: 0,
        delay_reason: '',
        actual_departure: '',
        actual_arrival: '',
        passenger_count: 0,
        revenue: 0,
        notes: '',
    });
    const [deleteConfirm, setDeleteConfirm] = useState<Schedule | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);

    // Multi-trip schedule state
    const [showMultiTripModal, setShowMultiTripModal] = useState(false);
    const [multiTripStep, setMultiTripStep] = useState(1);
    const [multiTripForm, setMultiTripForm] = useState({
        route_id: '',
        bus_id: '',
        driver_id: '',
        trips: [] as TripItem[],
        date: ''
    });
    const [currentTripTime, setCurrentTripTime] = useState({ time: '', type: 'regular' });
    const [multiTripConflictInfo, setMultiTripConflictInfo] = useState<ConflictInfo | null>(null);
    const [checkingConflicts, setCheckingConflicts] = useState(false);

    // Fetch all schedules
    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const response = await api.get('/schedules');
            if (response.data.success) {
                const schedulesData = response.data.data.map((schedule: any) => ({
                    ...schedule,
                    Route: schedule.Route || schedule.route || null,
                    Bus: schedule.Bus || schedule.bus || null,
                    Driver: schedule.Driver || schedule.driver || null
                }));
                setSchedules(schedulesData);
            } else {
                toast.error('Failed to load schedules');
            }
        } catch (error: any) {
            console.error("Error fetching schedules:", error);
            toast.error(error.response?.data?.message || 'Failed to load schedules');
        } finally {
            setLoading(false);
        }
    };

    const fetchRoutes = async () => {
        try {
            const response = await api.get('/routes/active');
            if (response.data.success) setRoutes(response.data.data);
        } catch (error) { console.error("Error fetching routes:", error); }
    };

    const fetchBuses = async () => {
        try {
            const response = await api.get('/buses/available');
            if (response.data.success) setBuses(response.data.data);
        } catch (error) { console.error("Error fetching buses:", error); }
    };

    const fetchDrivers = async () => {
        try {
            const response = await api.get('/drivers/available');
            if (response.data.success) setDrivers(response.data.data);
        } catch (error) { console.error("Error fetching drivers:", error); }
    };

    useEffect(() => {
        fetchSchedules();
        fetchRoutes();
        fetchBuses();
        fetchDrivers();
    }, []);

    // ✅ Check bus and driver conflicts for a specific time
    const checkConflicts = async (busId: number, driverId: number, dateTime: string, excludeId?: number) => {
        try {
            const response = await api.get('/schedules');
            if (response.data.success) {
                const allSchedules = response.data.data;
                const targetTime = new Date(dateTime);
                const targetHour = targetTime.getHours();
                const targetDate = targetTime.toDateString();

                const busConflicts = allSchedules.filter((s: any) => {
                    if (excludeId && s.schedule_id === excludeId) return false;
                    if (s.bus_id !== busId) return false;
                    const scheduleTime = new Date(s.departure_time);
                    const scheduleDate = scheduleTime.toDateString();
                    const scheduleHour = scheduleTime.getHours();
                    return scheduleDate === targetDate && Math.abs(scheduleHour - targetHour) < 3;
                });

                const driverConflicts = allSchedules.filter((s: any) => {
                    if (excludeId && s.schedule_id === excludeId) return false;
                    if (s.driver_id !== driverId) return false;
                    const scheduleTime = new Date(s.departure_time);
                    const scheduleDate = scheduleTime.toDateString();
                    const scheduleHour = scheduleTime.getHours();
                    return scheduleDate === targetDate && Math.abs(scheduleHour - targetHour) < 3;
                });

                const hasConflict = busConflicts.length > 0 || driverConflicts.length > 0;
                let message = '';
                if (busConflicts.length > 0 && driverConflicts.length > 0) {
                    message = `Bus and Driver are already scheduled for another trip around this time`;
                } else if (busConflicts.length > 0) {
                    message = `Bus is already scheduled for another trip around this time`;
                } else if (driverConflicts.length > 0) {
                    message = `Driver is already scheduled for another trip around this time`;
                }

                return { hasConflict, busConflicts, driverConflicts, message };
            }
        } catch (error) {
            console.error("Error checking conflicts:", error);
        }
        return { hasConflict: false, busConflicts: [], driverConflicts: [], message: '' };
    };

    // ✅ Check conflicts for multiple trips
    const checkMultiTripConflicts = async () => {
        if (!multiTripForm.bus_id || !multiTripForm.driver_id || !multiTripForm.date) return;

        setCheckingConflicts(true);
        const conflicts: { time: string; busConflict: boolean; driverConflict: boolean; message: string }[] = [];

        for (const trip of multiTripForm.trips) {
            const [hours, minutes] = trip.time.split(':');
            const dateTime = new Date(multiTripForm.date);
            dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const conflictResult = await checkConflicts(
                parseInt(multiTripForm.bus_id),
                parseInt(multiTripForm.driver_id),
                dateTime.toISOString()
            );

            if (conflictResult?.hasConflict) {
                conflicts.push({
                    time: trip.time,
                    busConflict: conflictResult.busConflicts.length > 0,
                    driverConflict: conflictResult.driverConflicts.length > 0,
                    message: conflictResult.message
                });
            }
        }

        if (conflicts.length > 0) {
            setMultiTripConflictInfo({
                hasConflict: true,
                busConflicts: [],
                driverConflicts: [],
                message: `${conflicts.length} trip(s) have conflicts: ${conflicts.map(c => `${c.time} (${c.message})`).join(', ')}`
            });
        } else {
            setMultiTripConflictInfo(null);
        }
        setCheckingConflicts(false);
    };

    useEffect(() => {
        if (multiTripForm.bus_id && multiTripForm.driver_id && multiTripForm.date && multiTripForm.trips.length > 0) {
            checkMultiTripConflicts();
        }
    }, [multiTripForm.bus_id, multiTripForm.driver_id, multiTripForm.date, multiTripForm.trips]);

    const getRouteDisplay = (schedule: Schedule) => {
        if (schedule.Route) return `${schedule.Route.route_name} (${schedule.Route.route_code})`;
        return '- (-)';
    };

    const getBusDisplay = (schedule: Schedule) => {
        if (schedule.Bus) return `${schedule.Bus.registration_number} (${schedule.Bus.bus_model})`;
        return '- (-)';
    };

    const getDriverDisplay = (schedule: Schedule) => {
        if (schedule.Driver) return `${schedule.Driver.first_name} ${schedule.Driver.last_name} (${schedule.Driver.driver_code})`;
        return '- (-)';
    };

    const filteredSchedules = schedules.filter(
        (s) =>
            s.schedule_code?.toLowerCase().includes(search.toLowerCase()) ||
            s.Route?.route_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.Bus?.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
            s.Driver?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.Driver?.last_name?.toLowerCase().includes(search.toLowerCase())
    );

    const openModal = (mode: 'view' | 'create' | 'edit', schedule?: Schedule) => {
        if (schedule && mode !== 'create') {
            setSelectedSchedule(schedule);
            setForm({
                route_id: schedule.route_id.toString(),
                bus_id: schedule.bus_id.toString(),
                driver_id: schedule.driver_id.toString(),
                departure_time: schedule.departure_time ? schedule.departure_time.slice(0, 16) : '',
                arrival_time: schedule.arrival_time ? schedule.arrival_time.slice(0, 16) : '',
                trip_type: schedule.trip_type,
                trip_status: schedule.trip_status,
                delay_minutes: schedule.delay_minutes,
                delay_reason: schedule.delay_reason || '',
                actual_departure: schedule.actual_departure ? schedule.actual_departure.slice(0, 16) : '',
                actual_arrival: schedule.actual_arrival ? schedule.actual_arrival.slice(0, 16) : '',
                passenger_count: schedule.passenger_count,
                revenue: typeof schedule.revenue === 'string' ? parseFloat(schedule.revenue) : schedule.revenue,
                notes: schedule.notes || '',
            });
            setConflictInfo(null);
        } else {
            setSelectedSchedule(null);
            setForm({
                route_id: '',
                bus_id: '',
                driver_id: '',
                departure_time: '',
                arrival_time: '',
                trip_type: 'regular',
                trip_status: 'scheduled',
                delay_minutes: 0,
                delay_reason: '',
                actual_departure: '',
                actual_arrival: '',
                passenger_count: 0,
                revenue: 0,
                notes: '',
            });
            setConflictInfo(null);
        }
        setModalMode(mode);
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedSchedule(null);
        setFormLoading(false);
        setConflictInfo(null);
    };

    const calculateArrivalTime = (departureTime: string, routeId: number): string => {
        if (!departureTime) return '';
        const route = routes.find(r => r.route_id === routeId);
        const departure = new Date(departureTime);
        const durationMinutes = route?.estimated_duration || 180;
        const arrival = new Date(departure.getTime() + durationMinutes * 60000);
        return arrival.toISOString();
    };

    const handleRouteChange = (routeId: number) => {
        setForm({ ...form, route_id: routeId.toString() });
        if (form.departure_time) {
            const newArrival = calculateArrivalTime(form.departure_time, routeId);
            setForm(prev => ({ ...prev, arrival_time: newArrival.slice(0, 16) }));
        }
    };

    const handleDepartureChange = async (departureTime: string) => {
        setForm({ ...form, departure_time: departureTime });
        if (form.route_id) {
            const newArrival = calculateArrivalTime(departureTime, parseInt(form.route_id));
            setForm(prev => ({ ...prev, arrival_time: newArrival.slice(0, 16) }));
        }

        // Check conflicts when departure time changes
        if (form.bus_id && form.driver_id && departureTime) {
            const conflict = await checkConflicts(
                parseInt(form.bus_id),
                parseInt(form.driver_id),
                new Date(departureTime).toISOString(),
                selectedSchedule?.schedule_id
            );
            setConflictInfo(conflict || null);
        }
    };

    const handleBusChange = async (busId: string) => {
        setForm({ ...form, bus_id: busId });
        if (form.driver_id && form.departure_time && busId) {
            const conflict = await checkConflicts(
                parseInt(busId),
                parseInt(form.driver_id),
                new Date(form.departure_time).toISOString(),
                selectedSchedule?.schedule_id
            );
            setConflictInfo(conflict || null);
        }
    };

    const handleDriverChange = async (driverId: string) => {
        setForm({ ...form, driver_id: driverId });
        if (form.bus_id && form.departure_time && driverId) {
            const conflict = await checkConflicts(
                parseInt(form.bus_id),
                parseInt(driverId),
                new Date(form.departure_time).toISOString(),
                selectedSchedule?.schedule_id
            );
            setConflictInfo(conflict || null);
        }
    };

    const handleCreate = async () => {
        if (!form.route_id || !form.bus_id || !form.driver_id || !form.departure_time) {
            toast.error('Please fill all required fields');
            return;
        }

        // Check conflicts before creating
        const conflict = await checkConflicts(
            parseInt(form.bus_id),
            parseInt(form.driver_id),
            new Date(form.departure_time).toISOString()
        );

        if (conflict?.hasConflict) {
            toast.error(conflict.message);
            setConflictInfo(conflict);
            return;
        }

        let arrivalTime = form.arrival_time;
        if (!arrivalTime && form.route_id && form.departure_time) {
            arrivalTime = calculateArrivalTime(form.departure_time, parseInt(form.route_id));
        }

        setFormLoading(true);
        try {
            const payload = {
                route_id: parseInt(form.route_id),
                bus_id: parseInt(form.bus_id),
                driver_id: parseInt(form.driver_id),
                departure_time: new Date(form.departure_time).toISOString(),
                arrival_time: arrivalTime ? new Date(arrivalTime).toISOString() : null,
                trip_type: form.trip_type,
                trip_status: form.trip_status,
                delay_minutes: form.delay_minutes,
                delay_reason: form.delay_reason || null,
                actual_departure: form.actual_departure ? new Date(form.actual_departure).toISOString() : null,
                actual_arrival: form.actual_arrival ? new Date(form.actual_arrival).toISOString() : null,
                passenger_count: form.passenger_count,
                revenue: form.revenue,
                notes: form.notes || null,
            };
            const response = await api.post('/schedules', payload);
            if (response.data.success) {
                toast.success('Schedule created successfully');
                fetchSchedules();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to create schedule');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create schedule');
        } finally {
            setFormLoading(false);
        }
    };

    const addTripToList = () => {
        if (!currentTripTime.time) {
            toast.error('Please select trip time');
            return;
        }

        // Check if time already exists
        if (multiTripForm.trips.some(t => t.time === currentTripTime.time)) {
            toast.error('This trip time already exists');
            return;
        }

        const newTrip: TripItem = {
            id: Date.now().toString(),
            time: currentTripTime.time,
            type: currentTripTime.type
        };
        const updatedTrips = [...multiTripForm.trips, newTrip].sort((a, b) => a.time.localeCompare(b.time));
        setMultiTripForm({ ...multiTripForm, trips: updatedTrips });
        setCurrentTripTime({ time: '', type: 'regular' });
    };

    const removeTrip = (tripId: string) => {
        setMultiTripForm({
            ...multiTripForm,
            trips: multiTripForm.trips.filter(t => t.id !== tripId)
        });
    };

    const handleCreateMultiTrips = async () => {
        if (!multiTripForm.route_id || !multiTripForm.bus_id || !multiTripForm.driver_id) {
            toast.error('Please select route, bus and driver');
            return;
        }
        if (!multiTripForm.date) {
            toast.error('Please select date');
            return;
        }
        if (multiTripForm.trips.length === 0) {
            toast.error('Please add at least one trip time');
            return;
        }

        // Check if there are conflicts
        if (multiTripConflictInfo?.hasConflict) {
            toast.error(multiTripConflictInfo.message);
            return;
        }

        setFormLoading(true);

        const tripTimes = multiTripForm.trips.map(trip => {
            const [hours, minutes] = trip.time.split(':');
            const dateTime = new Date(multiTripForm.date);
            dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return {
                time: dateTime.toISOString(),
                type: trip.type
            };
        });

        const payload = {
            routeId: parseInt(multiTripForm.route_id),
            busId: parseInt(multiTripForm.bus_id),
            driverId: parseInt(multiTripForm.driver_id),
            tripTimes: tripTimes,
            tripType: 'regular'
        };

        try {
            const response = await api.post('/schedules/multi-trip', payload);
            if (response.data.success) {
                const result = response.data.data;
                toast.success(`${result.totalCreated} schedules created, ${result.totalFailed} failed`);
                fetchSchedules();
                resetMultiTripModal();
                setShowMultiTripModal(false);
                if (result.failed && result.failed.length > 0) {
                    toast.error(`Failed: ${result.failed.map((f: any) => new Date(f.time).toLocaleTimeString()).join(', ')}`);
                }
            } else {
                toast.error(response.data.message || 'Failed to create schedules');
            }
        } catch (error: any) {
            console.error("Multi-trip error:", error);
            toast.error(error.response?.data?.message || 'Failed to create schedules');
        } finally {
            setFormLoading(false);
        }
    };

    const resetMultiTripModal = () => {
        setMultiTripStep(1);
        setMultiTripForm({
            route_id: '',
            bus_id: '',
            driver_id: '',
            trips: [],
            date: ''
        });
        setCurrentTripTime({ time: '', type: 'regular' });
        setMultiTripConflictInfo(null);
    };

    const openMultiTripModal = () => {
        resetMultiTripModal();
        setShowMultiTripModal(true);
    };

    const handleUpdate = async () => {
        if (!selectedSchedule) return;
        if (!form.route_id || !form.bus_id || !form.driver_id || !form.departure_time) {
            toast.error('Please fill all required fields');
            return;
        }

        // Check conflicts before updating
        const conflict = await checkConflicts(
            parseInt(form.bus_id),
            parseInt(form.driver_id),
            new Date(form.departure_time).toISOString(),
            selectedSchedule.schedule_id
        );

        if (conflict?.hasConflict) {
            toast.error(conflict.message);
            setConflictInfo(conflict);
            return;
        }

        let arrivalTime = form.arrival_time;
        if (!arrivalTime && form.route_id && form.departure_time) {
            arrivalTime = calculateArrivalTime(form.departure_time, parseInt(form.route_id));
        }

        setFormLoading(true);
        try {
            const payload = {
                route_id: parseInt(form.route_id),
                bus_id: parseInt(form.bus_id),
                driver_id: parseInt(form.driver_id),
                departure_time: new Date(form.departure_time).toISOString(),
                arrival_time: arrivalTime ? new Date(arrivalTime).toISOString() : null,
                trip_type: form.trip_type,
                trip_status: form.trip_status,
                delay_minutes: form.delay_minutes,
                delay_reason: form.delay_reason || null,
                actual_departure: form.actual_departure ? new Date(form.actual_departure).toISOString() : null,
                actual_arrival: form.actual_arrival ? new Date(form.actual_arrival).toISOString() : null,
                passenger_count: form.passenger_count,
                revenue: form.revenue,
                notes: form.notes || null,
            };
            const response = await api.put(`/schedules/${selectedSchedule.schedule_id}`, payload);
            if (response.data.success) {
                toast.success('Schedule updated successfully');
                fetchSchedules();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to update schedule');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update schedule');
        } finally {
            setFormLoading(false);
        }
    };

    const updateTripStatus = async (scheduleId: number, status: string) => {
        try {
            const response = await api.put(`/schedules/${scheduleId}/status`, { status });
            if (response.data.success) {
                toast.success(`Trip status updated to ${status}`);
                fetchSchedules();
            } else {
                toast.error(response.data.message || 'Failed to update status');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const handleSave = () => {
        if (modalMode === 'create') handleCreate();
        else if (modalMode === 'edit') handleUpdate();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            const response = await api.delete(`/schedules/${deleteConfirm.schedule_id}`);
            if (response.data.success) {
                toast.success('Schedule deleted successfully');
                fetchSchedules();
                setDeleteConfirm(null);
                setShowDeleteModal(false);
            } else {
                toast.error(response.data.message || 'Failed to delete schedule');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete schedule');
        }
    };

    const formatDateTime = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    };

    const isDelayed = form.trip_status === 'delayed';

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    <span className="ml-2 text-gray-500">Loading schedules...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Schedules</h1>
                    <p className="text-sm text-foreground-400 mt-1">Manage trip schedules, track status and delays</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => openModal('create')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/20">
                        <i className="ri-add-line"></i><span>Single Schedule</span>
                    </button>
                    <button onClick={openMultiTripModal} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white font-semibold text-sm shadow-lg shadow-secondary-500/20">
                        <i className="ri-calendar-todo-line"></i><span>Multiple Schedules</span>
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search schedules..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-white text-sm text-foreground-900 focus:outline-none focus:border-primary-400" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="border-b border-background-100 bg-background-50/50">
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Code</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Route</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Bus</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Driver</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Departure</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Arrival</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Type</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Status</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Delay</th>
                            <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredSchedules.map((schedule) => (
                            <tr key={schedule.schedule_id} className="border-b border-background-50 hover:bg-background-50/50">
                                <td className="px-5 py-3 text-foreground-900 font-mono font-semibold text-[11px]">{schedule.schedule_code}</td>
                                <td className="px-5 py-3 text-foreground-800 font-medium">{getRouteDisplay(schedule)}</td>
                                <td className="px-5 py-3 text-foreground-600 font-mono text-xs">{getBusDisplay(schedule)}</td>
                                <td className="px-5 py-3 text-foreground-600">{getDriverDisplay(schedule)}</td>
                                <td className="px-5 py-3 text-foreground-600 text-xs">{formatDateTime(schedule.departure_time)}</td>
                                <td className="px-5 py-3 text-foreground-600 text-xs">{formatDateTime(schedule.arrival_time)}</td>
                                <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${tripTypeBadge[schedule.trip_type]}`}>{schedule.trip_type}</span></td>
                                <td className="px-5 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge[schedule.trip_status]}`}>{schedule.trip_status.replace('_', ' ')}</span></td>
                                <td className="px-5 py-3">{schedule.delay_minutes > 0 ? <span className="text-amber-600 font-semibold text-xs">{schedule.delay_minutes} min</span> : <span className="text-foreground-300 text-xs">—</span>}</td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => openModal('view', schedule)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-accent-600 hover:bg-accent-50"><i className="ri-eye-line text-sm"></i></button>
                                        <button onClick={() => openModal('edit', schedule)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-primary-600 hover:bg-primary-50"><i className="ri-edit-line text-sm"></i></button>
                                        <button onClick={() => { setDeleteConfirm(schedule); setShowDeleteModal(true); }} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-red-600 hover:bg-red-50"><i className="ri-delete-bin-line text-sm"></i></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredSchedules.length === 0 && (<tr><td colSpan={10} className="px-5 py-12 text-center text-foreground-400">No schedules found</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Single Schedule Modal */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-semibold">{modalMode === 'view' ? 'Schedule Details' : modalMode === 'create' ? 'Create Schedule' : 'Edit Schedule'}</h2>
                            <button onClick={closeModal} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:bg-gray-100"><i className="ri-close-line"></i></button>
                        </div>
                        <div className="p-6 space-y-6">
                            {modalMode !== 'create' && selectedSchedule && (
                                <div className="bg-gray-50 p-4 rounded-lg border">
                                    <label className="block text-xs font-semibold mb-1">Schedule Code</label>
                                    <input type="text" value={selectedSchedule.schedule_code} readOnly className="w-full px-3 py-2 rounded-lg border bg-gray-100 text-sm font-mono" />
                                </div>
                            )}

                            {/* Conflict Warning */}
                            {conflictInfo?.hasConflict && modalMode !== 'view' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <i className="ri-alert-line"></i>
                                        <span className="text-sm font-semibold">Schedule Conflict Detected!</span>
                                    </div>
                                    <p className="text-sm text-red-600 mt-1">{conflictInfo.message}</p>
                                    <p className="text-xs text-red-500 mt-2">Please select a different bus, driver, or time.</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div><label className="block text-xs font-semibold mb-1">Route *</label>
                                    <select value={form.route_id} onChange={(e) => handleRouteChange(Number(e.target.value))} disabled={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-primary-400">
                                        <option value="">Select route...</option>{routes.map((r) => (<option key={r.route_id} value={r.route_id}>{r.route_code} - {r.route_name}</option>))}
                                    </select>
                                </div>
                                <div><label className="block text-xs font-semibold mb-1">Bus *</label>
                                    <select value={form.bus_id} onChange={(e) => handleBusChange(e.target.value)} disabled={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-primary-400">
                                        <option value="">Select bus...</option>{buses.map((b) => (<option key={b.bus_id} value={b.bus_id}>{b.registration_number} - {b.bus_model}</option>))}
                                    </select>
                                </div>
                                <div><label className="block text-xs font-semibold mb-1">Driver *</label>
                                    <select value={form.driver_id} onChange={(e) => handleDriverChange(e.target.value)} disabled={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border focus:outline-none focus:border-primary-400">
                                        <option value="">Select driver...</option>{drivers.map((d) => (<option key={d.driver_id} value={d.driver_id}>{d.first_name} {d.last_name} ({d.driver_code})</option>))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold mb-1">Departure Time *</label>
                                    <input type="datetime-local" value={form.departure_time} onChange={(e) => handleDepartureChange(e.target.value)} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border read-only:bg-gray-50" />
                                    {conflictInfo?.hasConflict && form.departure_time && (
                                        <p className="text-xs text-red-500 mt-1">⚠️ {conflictInfo.message}</p>
                                    )}
                                </div>
                                <div><label className="block text-xs font-semibold mb-1">Arrival Time</label>
                                    <input type="datetime-local" value={form.arrival_time} onChange={(e) => setForm({ ...form, arrival_time: e.target.value })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border read-only:bg-gray-50" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold mb-1">Trip Type</label><select value={form.trip_type} onChange={(e) => setForm({ ...form, trip_type: e.target.value })} disabled={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border"><option value="regular">Regular</option><option value="express">Express</option><option value="night">Night</option><option value="special">Special</option></select></div>
                                <div><label className="block text-xs font-semibold mb-1">Trip Status</label><select value={form.trip_status} onChange={(e) => setForm({ ...form, trip_status: e.target.value })} disabled={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border"><option value="scheduled">Scheduled</option><option value="on_time">On Time</option><option value="delayed">Delayed</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
                            </div>
                            {isDelayed && (<div className="bg-amber-50 border border-amber-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-amber-600 mb-1">Delay (minutes)</label><input type="number" value={form.delay_minutes} onChange={(e) => setForm({ ...form, delay_minutes: Number(e.target.value) })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-amber-300" /></div>
                                <div><label className="block text-xs font-semibold text-amber-600 mb-1">Delay Reason</label><input type="text" value={form.delay_reason} onChange={(e) => setForm({ ...form, delay_reason: e.target.value })} readOnly={modalMode === 'view'} placeholder="e.g., Traffic, Breakdown..." className="w-full px-3 py-2 rounded-lg border border-amber-300" /></div>
                            </div>)}
                            <div><h4 className="text-xs font-semibold text-foreground-400 uppercase mb-2">Actual Times & Stats</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div><label className="block text-[11px] text-foreground-400 mb-1">Actual Departure</label><input type="datetime-local" value={form.actual_departure} onChange={(e) => setForm({ ...form, actual_departure: e.target.value })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border read-only:bg-gray-50" /></div>
                                    <div><label className="block text-[11px] text-foreground-400 mb-1">Actual Arrival</label><input type="datetime-local" value={form.actual_arrival} onChange={(e) => setForm({ ...form, actual_arrival: e.target.value })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border read-only:bg-gray-50" /></div>
                                    <div><label className="block text-[11px] text-foreground-400 mb-1">Passenger Count</label><input type="number" value={form.passenger_count} onChange={(e) => setForm({ ...form, passenger_count: Number(e.target.value) })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border read-only:bg-gray-50" /></div>
                                    <div><label className="block text-[11px] text-foreground-400 mb-1">Revenue (LKR)</label><input type="number" step="0.01" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: Number(e.target.value) })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border read-only:bg-gray-50" /></div>
                                </div>
                            </div>
                            <div><label className="block text-xs font-semibold mb-1">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} readOnly={modalMode === 'view'} rows={3} className="w-full px-3 py-2 rounded-lg border read-only:bg-gray-50 resize-none" placeholder="Additional notes..." /></div>
                        </div>
                        {modalMode !== 'view' && (
                            <div className="sticky bottom-0 bg-white px-6 py-4 border-t flex justify-end gap-3">
                                <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-gray-100">Cancel</button>
                                <button onClick={handleSave} disabled={formLoading || conflictInfo?.hasConflict} className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-50">
                                    {formLoading ? 'Processing...' : (modalMode === 'create' ? 'Create Schedule' : 'Save Changes')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Multiple Schedules Modal */}
            {showMultiTripModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold">Create Multiple Schedules</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className={`text-xs px-2 py-0.5 rounded-full ${multiTripStep === 1 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>Step 1: Basic Details</div>
                                    <i className="ri-arrow-right-s-line text-gray-400 text-sm"></i>
                                    <div className={`text-xs px-2 py-0.5 rounded-full ${multiTripStep === 2 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>Step 2: Add Trip Times</div>
                                    <i className="ri-arrow-right-s-line text-gray-400 text-sm"></i>
                                    <div className={`text-xs px-2 py-0.5 rounded-full ${multiTripStep === 3 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>Step 3: Confirm & Create</div>
                                </div>
                            </div>
                            <button onClick={() => { setShowMultiTripModal(false); resetMultiTripModal(); }} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:bg-gray-100"><i className="ri-close-line"></i></button>
                        </div>
                        <div className="p-6">
                            {/* Step 1: Basic Details */}
                            {multiTripStep === 1 && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><p className="text-sm text-blue-700">Select route, bus, driver, and date for your multiple schedules.</p></div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-semibold mb-1">Route *</label><select value={multiTripForm.route_id} onChange={(e) => setMultiTripForm({ ...multiTripForm, route_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border"><option value="">Select route...</option>{routes.map((r) => (<option key={r.route_id} value={r.route_id}>{r.route_code} - {r.route_name}</option>))}</select></div>
                                        <div><label className="block text-xs font-semibold mb-1">Bus *</label><select value={multiTripForm.bus_id} onChange={(e) => setMultiTripForm({ ...multiTripForm, bus_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border"><option value="">Select bus...</option>{buses.map((b) => (<option key={b.bus_id} value={b.bus_id}>{b.registration_number} - {b.bus_model}</option>))}</select></div>
                                        <div><label className="block text-xs font-semibold mb-1">Driver *</label><select value={multiTripForm.driver_id} onChange={(e) => setMultiTripForm({ ...multiTripForm, driver_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border"><option value="">Select driver...</option>{drivers.map((d) => (<option key={d.driver_id} value={d.driver_id}>{d.first_name} {d.last_name} ({d.driver_code})</option>))}</select></div>
                                        <div><label className="block text-xs font-semibold mb-1">Date *</label><input type="date" value={multiTripForm.date} onChange={(e) => setMultiTripForm({ ...multiTripForm, date: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button onClick={() => setShowMultiTripModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-gray-100">Cancel</button>
                                        <button onClick={() => { if (!multiTripForm.route_id || !multiTripForm.bus_id || !multiTripForm.driver_id || !multiTripForm.date) { toast.error('Please fill all required fields'); return; } setMultiTripStep(2); }} className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">Next: Add Trip Times</button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Add Trip Times */}
                            {multiTripStep === 2 && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><p className="text-sm text-blue-700">Add trip times for {multiTripForm.date}. Example: 07:30, 13:30, 16:30</p></div>

                                    {/* Conflict Warning for Multi Trip */}
                                    {multiTripConflictInfo?.hasConflict && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 text-red-700">
                                                <i className="ri-alert-line"></i>
                                                <span className="text-sm font-semibold">Schedule Conflicts Detected!</span>
                                            </div>
                                            <p className="text-sm text-red-600 mt-1">{multiTripConflictInfo.message}</p>
                                            <p className="text-xs text-red-500 mt-2">Please remove conflicting trip times or select a different bus/driver.</p>
                                        </div>
                                    )}

                                    <div><h3 className="text-sm font-semibold mb-3">Trip Times</h3>
                                        {multiTripForm.trips.length === 0 ? (<div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed"><i className="ri-time-line text-4xl text-gray-400"></i><p className="text-sm text-gray-500 mt-2">No trip times added yet</p></div>) : (
                                            <div className="space-y-2 mb-4">
                                                {multiTripForm.trips.map((trip, index) => {
                                                    // Check if this specific trip has a conflict
                                                    const hasConflict = multiTripConflictInfo?.message.includes(trip.time);
                                                    return (
                                                        <div key={trip.id} className={`flex items-center justify-between p-3 rounded-lg border ${hasConflict ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-sm font-semibold text-primary-600">Trip {index + 1}</span>
                                                                <span className="text-sm font-mono text-gray-700">{trip.time}</span>
                                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${tripTypeBadge[trip.type]}`}>{trip.type}</span>
                                                                {hasConflict && <span className="text-xs text-red-500">⚠️ Conflict</span>}
                                                            </div>
                                                            <button onClick={() => removeTrip(trip.id)} className="text-red-500 hover:text-red-700"><i className="ri-delete-bin-line"></i></button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t pt-4"><h4 className="text-sm font-medium mb-3">Add Another Trip Time</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="block text-xs font-semibold mb-1">Time *</label><input type="time" value={currentTripTime.time} onChange={(e) => setCurrentTripTime({ ...currentTripTime, time: e.target.value })} className="w-full px-3 py-2 rounded-lg border" /></div>
                                            <div><label className="block text-xs font-semibold mb-1">Trip Type</label><select value={currentTripTime.type} onChange={(e) => setCurrentTripTime({ ...currentTripTime, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border"><option value="regular">Regular</option><option value="express">Express</option><option value="night">Night</option><option value="special">Special</option></select></div>
                                        </div>
                                        <button onClick={addTripToList} className="mt-3 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"><i className="ri-add-line"></i> Add Trip Time</button>
                                    </div>
                                    <div className="flex justify-between gap-3 pt-4 border-t">
                                        <button onClick={() => setMultiTripStep(1)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-gray-100"><i className="ri-arrow-left-line mr-1"></i> Back</button>
                                        <div className="flex gap-3">
                                            <button onClick={() => setShowMultiTripModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-gray-100">Cancel</button>
                                            <button onClick={() => { if (multiTripForm.trips.length === 0) { toast.error('Please add at least one trip time'); return; } setMultiTripStep(3); }} className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold">Next: Review</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Confirm & Create */}
                            {multiTripStep === 3 && (
                                <div className="space-y-6">
                                    <div className={`p-4 rounded-lg border ${multiTripConflictInfo?.hasConflict ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                                        <p className={`text-sm ${multiTripConflictInfo?.hasConflict ? 'text-red-700' : 'text-green-700'}`}>
                                            {multiTripConflictInfo?.hasConflict
                                                ? `⚠️ ${multiTripConflictInfo.message} Please fix conflicts before creating.`
                                                : `✓ No conflicts detected. Ready to create ${multiTripForm.trips.length} schedules.`}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-sm font-semibold mb-3">Schedule Details</h3><div className="grid grid-cols-2 gap-2 text-sm"><div className="text-gray-500">Route:</div><div>{routes.find(r => r.route_id === parseInt(multiTripForm.route_id))?.route_name || '-'}</div><div className="text-gray-500">Bus:</div><div>{buses.find(b => b.bus_id === parseInt(multiTripForm.bus_id))?.registration_number || '-'}</div><div className="text-gray-500">Driver:</div><div>{drivers.find(d => d.driver_id === parseInt(multiTripForm.driver_id))?.first_name || '-'}</div><div className="text-gray-500">Date:</div><div>{multiTripForm.date}</div></div></div>
                                    <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-sm font-semibold mb-3">Trip Times ({multiTripForm.trips.length} trips)</h3><div className="space-y-2">{multiTripForm.trips.map((trip, index) => (<div key={trip.id} className="flex items-center gap-3 py-2 border-b last:border-0"><span className="text-xs font-semibold text-primary-600 w-12">Trip {index + 1}</span><span className="text-sm font-mono">{trip.time}</span><span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${tripTypeBadge[trip.type]}`}>{trip.type}</span></div>))}</div></div>
                                    <div className="flex justify-between gap-3 pt-4 border-t">
                                        <button onClick={() => setMultiTripStep(2)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-gray-100"><i className="ri-arrow-left-line mr-1"></i> Back</button>
                                        <div className="flex gap-3">
                                            <button onClick={() => setShowMultiTripModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-gray-100">Cancel</button>
                                            <button onClick={handleCreateMultiTrips} disabled={formLoading || multiTripConflictInfo?.hasConflict} className="px-5 py-2 rounded-lg bg-secondary-500 hover:bg-secondary-600 text-white text-sm font-semibold disabled:opacity-50">{formLoading ? 'Creating...' : `Create ${multiTripForm.trips.length} Schedules`}</button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteModal && deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><i className="ri-delete-bin-line text-red-500 text-xl"></i></div>
                        <h3 className="text-lg font-semibold text-center">Delete Schedule?</h3>
                        <p className="text-sm text-gray-500 text-center mt-2">Are you sure you want to delete <strong>{deleteConfirm.schedule_code}</strong>?</p>
                        <div className="flex gap-3 mt-6"><button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button><button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold">Delete</button></div>
                    </div>
                </div>
            )}
        </Layout>
    );
}