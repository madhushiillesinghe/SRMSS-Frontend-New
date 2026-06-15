// src/app/tracker/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '@/components/feature/Layout';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Auto-fit map bounds
function MapUpdater({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [positions, map]);
    return null;
}

// ========== Types ==========
interface RealTimeBus {
    bus_id: number;
    registration_number: string;
    bus_model: string;
    location: {
        latitude: string;
        longitude: string;
        speed: string;
        heading: string;
    };
    eta_to_next_stop_minutes: number | null;
    last_update: string;
}

interface ScheduleProgress {
    schedule_id: number;
    route_id: number;
    route_name: string;
    departure_time: string;
    arrival_time: string;
    trip_status?: string;
    current_stop_id: number | null;
    current_stop_name: string | null;
    next_stop_id: number | null;
    next_stop_name: string | null;
    is_completed: boolean;
}

interface ActiveBusMerged {
    bus: {
        bus_id: number;
        registration_number: string;
        bus_model: string;
        status: string;
    };
    schedule: ScheduleProgress | null;
    realtime: {
        speed: number;
        heading: number;
        eta_minutes: number | null;
        last_update: string;
        latitude: number;
        longitude: number;
    } | null;
}

interface StopInfo {
    stop_id: number;
    stop_name: string;
    stop_order: number;
    distance_from_start: string;
    latitude?: string;
    longitude?: string;
}

interface RouteProgress {
    route: {
        route_id: number;
        total_distance: string;
        estimated_duration: number;
    };
    current_position: {
        latitude: string | null;
        longitude: string | null;
        distance_traveled: string;
        elapsed_time: number;
        speed: number;
        progress_percentage: number;
    };
    current_stop?: StopInfo | null;
    next_stop?: {
        stop_id: number;
        stop_name: string;
        distance_to_next: number;
        estimated_minutes: number;
        latitude?: string;
        longitude?: string;
    } | null;
    all_stops: Array<StopInfo & { estimated_arrival_time: number; is_passed: boolean }>;
}

interface BusCurrentLocation {
    bus: {
        id: number;
        registration_number: string;
        bus_model: string;
        status: string;
    };
    location: {
        latitude: string;
        longitude: string;
        speed: string;
        heading: string;
        status: string;
        recorded_at: string;
        is_recent: boolean;
    } | null;
    next_stop_eta: { etaMinutes: number } | null;
    last_update_seconds_ago: number;
    route_progress?: RouteProgress;
    fuel_level?: number;
    battery_level?: number;
    engine_temp?: number;
    odometer?: number;
}

interface BusStats {
    total_locations: number;
    total_distance_km: string;
    avg_speed_kmh: string;
    max_speed_kmh: string;
    stopped_time_minutes: number;
    moving_time_minutes: number;
    active_percentage: number;
}

interface TodaySchedule {
    bus: {
        id: number;
        registration_number: string;
        bus_model: string;
        capacity: number;
    };
    date: string;
    totalTrips: number;
    trips: Array<{
        schedule_id: number;
        schedule_code: string;
        departure_time: string;
        arrival_time: string;
        route: string;
        trip_type: string;
        status: string;
        driver: string | null;
    }>;
}

const statusColors: Record<string, string> = {
    active: 'bg-emerald-500',
    stopped: 'bg-amber-500',
    offline: 'bg-gray-400',
};

const statusTextColors: Record<string, string> = {
    active: 'text-emerald-700 bg-emerald-50',
    stopped: 'text-amber-700 bg-amber-50',
    offline: 'text-gray-500 bg-gray-100',
};

export default function TrackerPage() {
    const [activeBuses, setActiveBuses] = useState<ActiveBusMerged[]>([]);
    const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
    const [selectedBusDetails, setSelectedBusDetails] = useState<BusCurrentLocation | null>(null);
    const [busStats, setBusStats] = useState<BusStats | null>(null);
    const [todaySchedule, setTodaySchedule] = useState<TodaySchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Map state
    const [busPosition, setBusPosition] = useState<[number, number] | null>(null);
    const [currentStopPosition, setCurrentStopPosition] = useState<[number, number] | null>(null);
    const [currentStopName, setCurrentStopName] = useState<string | null>(null);
    const [nextStopPosition, setNextStopPosition] = useState<[number, number] | null>(null);
    const [nextStopName, setNextStopName] = useState<string | null>(null);
    const [routeProgress, setRouteProgress] = useState<RouteProgress | null>(null);

    const refreshInterval = useRef<NodeJS.Timeout | null>(null);

    // Fetch and merge schedule + real‑time data
    const fetchActiveBuses = useCallback(async () => {
        try {
            const scheduleRes = await api.get('/tracking/active-buses-progress');
            const realtimeRes = await api.get('/tracking/active-buses');
            const scheduleData = scheduleRes.data.success ? scheduleRes.data.data : [];
            const realtimeData = realtimeRes.data.success ? realtimeRes.data.data : [];
            const merged = scheduleData.map((item: any) => {
                const rt = realtimeData.find((r: RealTimeBus) => r.bus_id === item.bus.bus_id);
                // Safely check if rt and rt.location exist
                if (rt && rt.location) {
                    return {
                        bus: item.bus,
                        schedule: item.schedule,
                        realtime: {
                            speed: parseFloat(rt.location.speed),
                            heading: parseFloat(rt.location.heading),
                            eta_minutes: rt.eta_to_next_stop_minutes,
                            last_update: rt.last_update,
                            latitude: parseFloat(rt.location.latitude),
                            longitude: parseFloat(rt.location.longitude),
                        },
                    };
                } else {
                    return {
                        bus: item.bus,
                        schedule: item.schedule,
                        realtime: null,
                    };
                }
            });
            setActiveBuses(merged);
        } catch (error) {
            console.error('Error fetching active buses:', error);
            toast.error('Failed to load active buses');
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    }, []);
    // Fetch bus current location (includes route_progress)
    const fetchBusCurrentLocation = useCallback(async (busId: number) => {
        try {
            const response = await api.get(`/tracking/buses/${busId}/current`);
            if (response.data.success) {
                const data = response.data.data as BusCurrentLocation;
                setSelectedBusDetails(data);
                // Bus position (from GPS or fallback)
                if (data.location && data.location.latitude && data.location.longitude) {
                    setBusPosition([parseFloat(data.location.latitude), parseFloat(data.location.longitude)]);
                } else {
                    setBusPosition(null);
                }
                // Route progress (contains current/next stops with coordinates)
                if (data.route_progress) {
                    setRouteProgress(data.route_progress);
                    // Current stop
                    if (data.route_progress.current_stop && data.route_progress.current_stop.latitude && data.route_progress.current_stop.longitude) {
                        setCurrentStopPosition([
                            parseFloat(data.route_progress.current_stop.latitude),
                            parseFloat(data.route_progress.current_stop.longitude)
                        ]);
                        setCurrentStopName(data.route_progress.current_stop.stop_name);
                    } else {
                        setCurrentStopPosition(null);
                        setCurrentStopName(null);
                    }
                    // Next stop
                    if (data.route_progress.next_stop && data.route_progress.next_stop.latitude && data.route_progress.next_stop.longitude) {
                        setNextStopPosition([
                            parseFloat(data.route_progress.next_stop.latitude),
                            parseFloat(data.route_progress.next_stop.longitude)
                        ]);
                        setNextStopName(data.route_progress.next_stop.stop_name);
                    } else {
                        setNextStopPosition(null);
                        setNextStopName(null);
                    }
                } else {
                    setRouteProgress(null);
                    setCurrentStopPosition(null);
                    setNextStopPosition(null);
                    setCurrentStopName(null);
                    setNextStopName(null);
                }
            } else {
                setSelectedBusDetails(null);
                setBusPosition(null);
                setRouteProgress(null);
                setCurrentStopPosition(null);
                setNextStopPosition(null);
            }
        } catch (error) {
            console.error('Error fetching bus current location:', error);
            setSelectedBusDetails(null);
            setBusPosition(null);
            setRouteProgress(null);
            setCurrentStopPosition(null);
            setNextStopPosition(null);
        }
    }, []);

    // Fetch today's schedule for the bus (still needed for the sidebar)
    const fetchBusTodaySchedule = useCallback(async (busId: number) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await api.get(`/schedules/bus/${busId}/daily?date=${today}`);
            if (response.data.success) {
                setTodaySchedule(response.data.data);
                return response.data.data;
            } else {
                setTodaySchedule(null);
                return null;
            }
        } catch (error) {
            console.error('Error fetching today\'s schedule:', error);
            setTodaySchedule(null);
            return null;
        }
    }, []);

    // Fetch bus statistics
    const fetchBusStats = useCallback(async (busId: number, days: number = 7) => {
        try {
            const response = await api.get(`/tracking/buses/${busId}/stats?days=${days}`);
            if (response.data.success) {
                setBusStats(response.data.data);
            } else {
                setBusStats(null);
            }
        } catch (error) {
            console.error('Error fetching bus stats:', error);
            setBusStats(null);
        }
    }, []);

    // Refresh all data for selected bus
    const refreshSelectedBus = useCallback(async (busId: number) => {
        setDetailsLoading(true);
        await Promise.all([
            fetchBusCurrentLocation(busId),
            fetchBusStats(busId, 7),
            fetchBusTodaySchedule(busId)
        ]);
        setDetailsLoading(false);
    }, [fetchBusCurrentLocation, fetchBusStats, fetchBusTodaySchedule]);

    // Handle bus selection
    const handleSelectBus = async (busId: number) => {
        if (selectedBusId === busId) {
            setSelectedBusId(null);
            setSelectedBusDetails(null);
            setBusStats(null);
            setTodaySchedule(null);
            setBusPosition(null);
            setCurrentStopPosition(null);
            setNextStopPosition(null);
            setCurrentStopName(null);
            setNextStopName(null);
            setRouteProgress(null);
        } else {
            setSelectedBusId(busId);
            await refreshSelectedBus(busId);
        }
    };

    // Auto-refresh effect
    useEffect(() => {
        fetchActiveBuses();
        if (autoRefresh) {
            refreshInterval.current = setInterval(() => {
                fetchActiveBuses();
                if (selectedBusId) {
                    refreshSelectedBus(selectedBusId);
                }
            }, 10000);
        } else {
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
                refreshInterval.current = null;
            }
        }
        return () => {
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
            }
        };
    }, [autoRefresh, fetchActiveBuses, refreshSelectedBus, selectedBusId]);

    // When selected bus changes, refresh details
    useEffect(() => {
        if (selectedBusId) {
            refreshSelectedBus(selectedBusId);
        }
    }, [selectedBusId, refreshSelectedBus]);

    const formatETA = (minutes: number | null) => {
        if (minutes === null) return 'N/A';
        if (minutes < 1) return '< 1 min';
        if (minutes < 60) return `${Math.round(minutes)} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getBusStatusFromRealtime = (realtime: ActiveBusMerged['realtime']) => {
        if (!realtime) return 'offline';
        if (realtime.speed > 0) return 'active';
        if (realtime.speed === 0) return 'stopped';
        return 'offline';
    };

    // Build positions array for auto-fit
    const mapPositions: [number, number][] = [];
    if (busPosition) mapPositions.push(busPosition);
    if (currentStopPosition) mapPositions.push(currentStopPosition);
    if (nextStopPosition) mapPositions.push(nextStopPosition);

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Live Bus Tracker</h1>
                    <p className="text-sm text-foreground-400 mt-1">Real-time GPS tracking of all active buses</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground-400 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                        {autoRefresh ? 'Live (10s refresh)' : 'Paused'}
                    </span>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                            autoRefresh ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-background-100 text-foreground-500 hover:bg-background-200'
                        }`}
                    >
                        {autoRefresh ? 'Pause' : 'Resume'}
                    </button>
                    <button
                        onClick={() => {
                            fetchActiveBuses();
                            if (selectedBusId) refreshSelectedBus(selectedBusId);
                        }}
                        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100"
                    >
                        <i className="ri-refresh-line mr-1"></i> Refresh
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    <span className="ml-3 text-foreground-500">Loading tracking data...</span>
                </div>
            )}

            {!loading && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Map Section */}
                    <div className="lg:col-span-2 bg-white rounded-lg border border-background-200 overflow-hidden">
                        <div className="relative h-[500px] md:h-[600px] w-full">
                            {selectedBusId ? (
                                <MapContainer
                                    key={selectedBusId}
                                    center={[7.8731, 80.7718]}
                                    zoom={8}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    {/* Bus marker */}
                                    {busPosition && !isNaN(busPosition[0]) && !isNaN(busPosition[1]) && (
                                        <Marker position={busPosition}>
                                            <Popup>
                                                <strong>Bus {selectedBusDetails?.bus.registration_number}</strong><br />
                                                Speed: {selectedBusDetails?.location?.speed || '0'} km/h
                                            </Popup>
                                        </Marker>
                                    )}
                                    {/* Current stop marker */}
                                    {currentStopPosition && !isNaN(currentStopPosition[0]) && !isNaN(currentStopPosition[1]) && currentStopName && (
                                        <Marker
                                            position={currentStopPosition}
                                            icon={L.divIcon({
                                                className: 'custom-marker',
                                                html: '<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                                                iconSize: [12, 12],
                                            })}
                                        >
                                            <Popup><strong>Current Stop:</strong> {currentStopName}</Popup>
                                        </Marker>
                                    )}
                                    {/* Next stop marker */}
                                    {nextStopPosition && !isNaN(nextStopPosition[0]) && !isNaN(nextStopPosition[1]) && nextStopName && (
                                        <Marker
                                            position={nextStopPosition}
                                            icon={L.divIcon({
                                                className: 'custom-marker',
                                                html: '<div style="background-color: #f59e0b; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                                                iconSize: [12, 12],
                                            })}
                                        >
                                            <Popup>
                                                <strong>Next Stop:</strong> {nextStopName}<br />
                                                ETA: {routeProgress?.next_stop?.estimated_minutes || '?'} min
                                            </Popup>
                                        </Marker>
                                    )}
                                    {/* Polyline between current and next stop */}
                                    {currentStopPosition && nextStopPosition && !isNaN(currentStopPosition[0]) && !isNaN(currentStopPosition[1]) && !isNaN(nextStopPosition[0]) && !isNaN(nextStopPosition[1]) && (
                                        <Polyline positions={[currentStopPosition, nextStopPosition]} color="blue" weight={3} />
                                    )}
                                    <MapUpdater positions={mapPositions} />
                                </MapContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full bg-gray-50">
                                    <i className="ri-bus-line text-4xl text-gray-400"></i>
                                    <p className="ml-2 text-gray-500">Select a bus to view its location</p>
                                </div>
                            )}
                            {/* Legend */}
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2.5 shadow-lg border border-background-200 z-10">
                                <p className="text-xs font-semibold text-foreground-700 mb-2">Live Markers</p>
                                <div className="flex items-center gap-4 text-[11px]">
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" /> Bus</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-600" /> Current Stop</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Next Stop</span>
                                </div>
                                <p className="text-[10px] text-foreground-400 mt-2">Last update: {lastRefresh.toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Side Panel - Active Buses List (unchanged from your original) */}
                    <div className="bg-white rounded-lg border border-background-200 overflow-hidden flex flex-col h-[500px] md:h-[600px]">
                        <div className="px-4 py-3 border-b border-background-200 bg-background-50">
                            <h3 className="text-sm font-semibold text-foreground-900 font-heading">Active Buses ({activeBuses.length})</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-background-50">
                            {activeBuses.length === 0 && (
                                <div className="p-8 text-center text-foreground-400">
                                    <i className="ri-bus-line text-3xl mb-2 block"></i>
                                    <p className="text-sm">No active buses found</p>
                                </div>
                            )}
                            {activeBuses.map((item) => {
                                const bus = item.bus;
                                const schedule = item.schedule;
                                const realtime = item.realtime;
                                const status = getBusStatusFromRealtime(realtime);

                                return (
                                    <div
                                        key={bus.bus_id}
                                        onClick={() => handleSelectBus(bus.bus_id)}
                                        className={`px-4 py-3 cursor-pointer transition-colors ${
                                            selectedBusId === bus.bus_id ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'hover:bg-background-50'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'active' ? 'animate-pulse' : ''}`} />
                                                <span className="text-sm font-semibold text-foreground-900">{bus.registration_number}</span>
                                            </div>
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${statusTextColors[status]}`}>{status}</span>
                                        </div>
                                        <p className="text-xs text-foreground-500">{bus.bus_model}</p>

                                        {/* Real‑time fields */}
                                        {realtime && (
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-foreground-400">Speed: {realtime.speed.toFixed(1)} km/h</p>
                                                {realtime.eta_minutes !== null && (
                                                    <p className="text-xs text-amber-600">ETA: {formatETA(realtime.eta_minutes)}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Schedule‑based current/next stops */}
                                        {schedule ? (
                                            <div className="mt-2 space-y-1">
                                                {schedule.current_stop_name && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">Current</span>
                                                        <span className="text-xs text-foreground-700">{schedule.current_stop_name}</span>
                                                    </div>
                                                )}
                                                {schedule.next_stop_name && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Next</span>
                                                        <span className="text-xs text-foreground-700">{schedule.next_stop_name}</span>
                                                    </div>
                                                )}
                                                {!schedule.current_stop_name && !schedule.next_stop_name && (
                                                    <p className="text-xs text-foreground-400 italic">No stop data available</p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-foreground-400 italic mt-1">No active schedule</p>
                                        )}

                                        {/* Expanded details when selected */}
                                        {selectedBusId === bus.bus_id && (
                                            <div className="mt-3 pt-3 border-t border-background-100 space-y-3 animate-fade-in">
                                                {detailsLoading ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                                                        <span className="ml-2 text-xs text-foreground-500">Loading details...</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Today's Schedule */}
                                                        {todaySchedule && todaySchedule.trips.length > 0 && (
                                                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                                                <p className="text-xs font-semibold text-blue-700 mb-2">Today's Schedule</p>
                                                                <div className="space-y-2">
                                                                    {todaySchedule.trips.map((trip) => {
                                                                        const now = new Date();
                                                                        const departure = new Date(trip.departure_time);
                                                                        const arrival = new Date(trip.arrival_time);
                                                                        let tripStatus = '';
                                                                        if (now < departure) tripStatus = 'Upcoming';
                                                                        else if (now >= departure && now <= arrival) tripStatus = 'In Progress';
                                                                        else tripStatus = 'Completed';
                                                                        return (
                                                                            <div key={trip.schedule_id} className="text-xs">
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium">{trip.route}</span>
                                                                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${tripStatus === 'In Progress' ? 'bg-green-100 text-green-700' : tripStatus === 'Upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                                                        {tripStatus}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-foreground-500 mt-0.5">
                                                                                    {new Date(trip.departure_time).toLocaleTimeString()} → {new Date(trip.arrival_time).toLocaleTimeString()}
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Vehicle Telemetry */}
                                                        {selectedBusDetails && (
                                                            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                                                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><i className="ri-dashboard-line"></i> Vehicle Telemetry</p>
                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                    <div><span className="text-foreground-400 block">Fuel Level</span><p className="font-semibold text-foreground-900">{selectedBusDetails.fuel_level !== undefined ? `${selectedBusDetails.fuel_level}%` : '—'}</p></div>
                                                                    <div><span className="text-foreground-400 block">Battery</span><p className="font-semibold text-foreground-900">{selectedBusDetails.battery_level !== undefined ? `${selectedBusDetails.battery_level}%` : '—'}</p></div>
                                                                    <div><span className="text-foreground-400 block">Engine Temp</span><p className="font-semibold text-foreground-900">{selectedBusDetails.engine_temp !== undefined ? `${selectedBusDetails.engine_temp}°C` : '—'}</p></div>
                                                                    <div><span className="text-foreground-400 block">Odometer</span><p className="font-semibold text-foreground-900">{selectedBusDetails.odometer !== undefined ? `${selectedBusDetails.odometer.toFixed(0)} km` : '—'}</p></div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Location Details */}
                                                        {selectedBusDetails && selectedBusDetails.location && (
                                                            <div className="space-y-2">
                                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                                    <div><span className="text-foreground-400">Speed</span><p className="font-semibold text-foreground-900">{parseFloat(selectedBusDetails.location.speed).toFixed(1)} km/h</p></div>
                                                                    <div><span className="text-foreground-400">Heading</span><p className="font-semibold text-foreground-900">{selectedBusDetails.location.heading}°</p></div>
                                                                    <div><span className="text-foreground-400">Status</span><p className="font-semibold text-foreground-900 capitalize">{selectedBusDetails.location.status}</p></div>
                                                                    <div><span className="text-foreground-400">Last Update</span><p className="font-semibold text-foreground-900">{selectedBusDetails.last_update_seconds_ago}s ago</p></div>
                                                                    <div className="col-span-2"><span className="text-foreground-400">Coordinates</span><p className="font-mono text-[11px] text-foreground-600">{parseFloat(selectedBusDetails.location.latitude).toFixed(5)}, {parseFloat(selectedBusDetails.location.longitude).toFixed(5)}</p></div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Route progress (real‑time stop status) */}
                                                        {routeProgress && (
                                                            <div className="mt-2 pt-2 border-t border-background-100">
                                                                <p className="text-xs font-semibold text-foreground-700 mb-2">Real‑time Stop Status</p>
                                                                {routeProgress.current_stop && (
                                                                    <div className="bg-green-50 rounded-lg p-2 mb-2 border border-green-200">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-xs font-medium text-green-700">📍 Current Stop</span>
                                                                            <span className="text-xs text-green-600 font-semibold">{routeProgress.current_stop.stop_name}</span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {routeProgress.next_stop && (
                                                                    <div className="bg-amber-50 rounded-lg p-2 border border-amber-200">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className="text-xs font-medium text-amber-700">⏩ Next Stop</span>
                                                                            <span className="text-xs text-amber-600 font-semibold">{routeProgress.next_stop.stop_name}</span>
                                                                        </div>
                                                                        {routeProgress.next_stop.distance_to_next && (
                                                                            <p className="text-[10px] text-foreground-500 mt-1">Distance: {routeProgress.next_stop.distance_to_next.toFixed(1)} km</p>
                                                                        )}
                                                                        {routeProgress.next_stop.estimated_minutes && (
                                                                            <p className="text-[10px] text-amber-600">ETA: {Math.round(routeProgress.next_stop.estimated_minutes)} min</p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {/* Progress bar */}
                                                                <div className="mt-2">
                                                                    <div className="h-1.5 bg-background-100 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-primary-500 rounded-full" style={{ width: `${routeProgress.current_position.progress_percentage}%` }} />
                                                                    </div>
                                                                    <p className="text-[10px] text-foreground-500 mt-1 text-right">{routeProgress.current_position.progress_percentage.toFixed(0)}% completed</p>
                                                                </div>
                                                                {/* All stops (collapsible) */}
                                                                <details className="mt-2">
                                                                    <summary className="text-[11px] text-primary-600 cursor-pointer">View all stops</summary>
                                                                    <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                                                                        {routeProgress.all_stops.map((stop) => (
                                                                            <div key={stop.stop_id} className="flex items-center gap-2 text-xs">
                                                                                <div className={`w-2 h-2 rounded-full ${stop.is_passed ? 'bg-emerald-500' : (stop.stop_id === routeProgress.next_stop?.stop_id ? 'bg-amber-500 animate-pulse' : 'bg-gray-300')}`} />
                                                                                <span className={`flex-1 ${stop.is_passed ? 'text-foreground-400 line-through' : 'text-foreground-700'}`}>{stop.stop_name}</span>
                                                                                {stop.stop_id === routeProgress.current_stop?.stop_id && <span className="text-[10px] text-green-600 font-medium">Current</span>}
                                                                                {stop.stop_id === routeProgress.next_stop?.stop_id && <span className="text-[10px] text-amber-600 font-medium">Next</span>}
                                                                                <span className="text-foreground-400 text-[10px]">{parseFloat(stop.distance_from_start).toFixed(1)} km</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </details>
                                                            </div>
                                                        )}

                                                        {/* 7-Day Stats */}
                                                        {busStats && (
                                                            <div className="mt-2 pt-2 border-t border-background-100">
                                                                <p className="text-xs font-semibold text-foreground-700 mb-1">7-Day Stats</p>
                                                                <div className="grid grid-cols-3 gap-2 text-[10px]">
                                                                    <div><span className="text-foreground-400 block">Distance</span><span className="font-semibold">{parseFloat(busStats.total_distance_km || '0').toFixed(1)} km</span></div>
                                                                    <div><span className="text-foreground-400 block">Avg Speed</span><span className="font-semibold">{parseFloat(busStats.avg_speed_kmh || '0').toFixed(1)} km/h</span></div>
                                                                    <div><span className="text-foreground-400 block">Active %</span><span className="font-semibold">{busStats.active_percentage?.toFixed(0) ?? '0'}%</span></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom stats bar */}
            {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white rounded-lg border border-background-200 p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600 font-heading">{activeBuses.filter(b => getBusStatusFromRealtime(b.realtime) === 'active').length}</p>
                        <p className="text-xs text-foreground-400 mt-1">Active</p>
                    </div>
                    <div className="bg-white rounded-lg border border-background-200 p-4 text-center">
                        <p className="text-2xl font-bold text-amber-600 font-heading">{activeBuses.filter(b => getBusStatusFromRealtime(b.realtime) === 'stopped').length}</p>
                        <p className="text-xs text-foreground-400 mt-1">Stopped</p>
                    </div>
                    <div className="bg-white rounded-lg border border-background-200 p-4 text-center">
                        <p className="text-2xl font-bold text-gray-500 font-heading">{activeBuses.filter(b => getBusStatusFromRealtime(b.realtime) === 'offline').length}</p>
                        <p className="text-xs text-foreground-400 mt-1">Offline</p>
                    </div>
                    <div className="bg-white rounded-lg border border-background-200 p-4 text-center">
                        <p className="text-2xl font-bold text-primary-600 font-heading">{activeBuses.length}</p>
                        <p className="text-xs text-foreground-400 mt-1">Total Tracked</p>
                    </div>
                </div>
            )}
        </Layout>
    );
}