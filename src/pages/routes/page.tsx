// src/pages/routes/page.tsx
import { useState, useEffect, useRef } from 'react';
import Layout from '@/components/feature/Layout';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteStop {
    stop_id?: number;
    stop_name: string;
    stop_order: number;
    distance_from_start: number;
    estimated_arrival_time?: number;
    waiting_time: number;
    fare_to_next: number;
    latitude?: number;
    longitude?: number;
}

interface Route {
    route_id: number;
    route_code: string;
    route_name: string;
    start_location: string;
    end_location: string;
    start_latitude: number | null;
    start_longitude: number | null;
    end_latitude: number | null;
    end_longitude: number | null;
    total_distance: number;
    estimated_duration: number;
    base_fare: number;
    fare_per_km: number;
    status: 'active' | 'inactive' | 'suspended';
    description: string | null;
    stops?: RouteStop[];
    created_at?: string;
    updated_at?: string;
}

const statusBadge: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-700',
};

// Improved geocoding: ORS first, fallback to Nominatim if needed
const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
    if (!location.trim()) return null;

    // Try OpenRouteService first
    try {
        const response = await api.get('/maps/geocode', { params: { location } });
        if (response.data.success) {
            return {
                lat: response.data.data.latitude,
                lng: response.data.data.longitude
            };
        }
    } catch (err) {
        console.warn('ORS geocoding failed, trying Nominatim...');
    }

    // Fallback to OpenStreetMap Nominatim (free, no API key)
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`
        );
        const data = await res.json();
        if (data && data[0]) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (err) {
        console.error('Nominatim fallback failed:', err);
    }

    // If both fail, show a toast (only once per location)
    toast.error(`Could not find coordinates for "${location}". Please check spelling or enter manually.`);
    return null;
};

export default function RoutesPage() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit' | null>(null);
    const [form, setForm] = useState<Route>({
        route_id: 0,
        route_code: '',
        route_name: '',
        start_location: '',
        end_location: '',
        start_latitude: null,
        start_longitude: null,
        end_latitude: null,
        end_longitude: null,
        total_distance: 0,
        estimated_duration: 0,
        base_fare: 0,
        fare_per_km: 0,
        status: 'active',
        description: null,
        stops: [],
    });
    const [deleteConfirm, setDeleteConfirm] = useState<Route | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [stopsLoading, setStopsLoading] = useState(false);
    const [calculatingDistance, setCalculatingDistance] = useState(false);
    // Map state
    const [mapCenter, setMapCenter] = useState<[number, number]>([7.8731, 80.7718]);
    const [mapMarkers, setMapMarkers] = useState<{ start: [number, number] | null; end: [number, number] | null }>({ start: null, end: null });
    const [mapPolyline, setMapPolyline] = useState<[number, number][]>([]);
    const [updatingMap, setUpdatingMap] = useState(false);

    const fetchRoutes = async () => {
        try {
            setLoading(true);
            const response = await api.get('/routes');
            if (response.data.success) setRoutes(response.data.data);
            else toast.error('Failed to load routes');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to load routes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRoutes(); }, []);

    const filteredRoutes = routes.filter(r =>
        r.route_code?.toLowerCase().includes(search.toLowerCase()) ||
        r.route_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.start_location?.toLowerCase().includes(search.toLowerCase()) ||
        r.end_location?.toLowerCase().includes(search.toLowerCase())
    );

    // Update map preview using current form coordinates (no external geocoding)
    const updateMapPreviewFromForm = () => {
        let startCoords = null;
        let endCoords = null;
        if (form.start_latitude && form.start_longitude) {
            startCoords = { lat: form.start_latitude, lng: form.start_longitude };
        }
        if (form.end_latitude && form.end_longitude) {
            endCoords = { lat: form.end_latitude, lng: form.end_longitude };
        }

        if (startCoords && endCoords) {
            setMapMarkers({ start: [startCoords.lat, startCoords.lng], end: [endCoords.lat, endCoords.lng] });
            setMapPolyline([[startCoords.lat, startCoords.lng], [endCoords.lat, endCoords.lng]]);
            const newCenter: [number, number] = [(startCoords.lat + endCoords.lat) / 2, (startCoords.lng + endCoords.lng) / 2];
            if (!isNaN(newCenter[0]) && !isNaN(newCenter[1])) setMapCenter(newCenter);
        } else if (startCoords) {
            setMapMarkers({ start: [startCoords.lat, startCoords.lng], end: null });
            setMapPolyline([]);
            if (!isNaN(startCoords.lat) && !isNaN(startCoords.lng)) setMapCenter([startCoords.lat, startCoords.lng]);
        } else if (endCoords) {
            setMapMarkers({ start: null, end: [endCoords.lat, endCoords.lng] });
            setMapPolyline([]);
            if (!isNaN(endCoords.lat) && !isNaN(endCoords.lng)) setMapCenter([endCoords.lat, endCoords.lng]);
        } else {
            setMapMarkers({ start: null, end: null });
            setMapPolyline([]);
            setMapCenter([7.8731, 80.7718]);
        }
    };

    // Called when start or end location is blurred – geocode and calculate distance
    const fetchDistanceAndDuration = async () => {
        if (!form.start_location || !form.end_location) {
            setForm(prev => ({ ...prev, total_distance: 0, estimated_duration: 0 }));
            setMapMarkers({ start: null, end: null });
            setMapPolyline([]);
            setMapCenter([7.8731, 80.7718]);
            return;
        }
        setCalculatingDistance(true);
        setUpdatingMap(true);

        // Geocode start and end (silently)
        let startCoords = form.start_latitude && form.start_longitude
            ? { lat: form.start_latitude, lng: form.start_longitude }
            : await geocodeLocation(form.start_location);
        let endCoords = form.end_latitude && form.end_longitude
            ? { lat: form.end_latitude, lng: form.end_longitude }
            : await geocodeLocation(form.end_location);

        if (startCoords) {
            setForm(prev => ({ ...prev, start_latitude: startCoords!.lat, start_longitude: startCoords!.lng }));
        }
        if (endCoords) {
            setForm(prev => ({ ...prev, end_latitude: endCoords!.lat, end_longitude: endCoords!.lng }));
        }

        // Update map preview with new coordinates
        if (startCoords && endCoords) {
            setMapMarkers({ start: [startCoords.lat, startCoords.lng], end: [endCoords.lat, endCoords.lng] });
            setMapPolyline([[startCoords.lat, startCoords.lng], [endCoords.lat, endCoords.lng]]);
            const newCenter: [number, number] = [(startCoords.lat + endCoords.lat) / 2, (startCoords.lng + endCoords.lng) / 2];
            if (!isNaN(newCenter[0]) && !isNaN(newCenter[1])) setMapCenter(newCenter);
        } else if (startCoords) {
            setMapMarkers({ start: [startCoords.lat, startCoords.lng], end: null });
            setMapPolyline([]);
            if (!isNaN(startCoords.lat) && !isNaN(startCoords.lng)) setMapCenter([startCoords.lat, startCoords.lng]);
        } else if (endCoords) {
            setMapMarkers({ start: null, end: [endCoords.lat, endCoords.lng] });
            setMapPolyline([]);
            if (!isNaN(endCoords.lat) && !isNaN(endCoords.lng)) setMapCenter([endCoords.lat, endCoords.lng]);
        } else {
            setMapMarkers({ start: null, end: null });
            setMapPolyline([]);
            setMapCenter([7.8731, 80.7718]);
        }
        setUpdatingMap(false);

        // Calculate distance via backend
        try {
            const response = await api.post('/routes/calculate-distance', {
                start_location: form.start_location,
                end_location: form.end_location
            });
            if (response.data.success) {
                const { distance_km, duration_min } = response.data.data;
                setForm(prev => ({
                    ...prev,
                    total_distance: distance_km,
                    estimated_duration: duration_min
                }));
                toast.success(`Distance: ${distance_km} km, Time: ${duration_min} min`);
            } else {
                toast.error(response.data.message || 'Could not calculate distance');
            }
        } catch (error: any) {
            console.error('Distance calculation error:', error);
            toast.error(error.response?.data?.message || 'Failed to calculate distance');
        } finally {
            setCalculatingDistance(false);
        }
    };

    const openModal = async (mode: 'view' | 'create' | 'edit', route?: Route) => {
        if (route && mode !== 'create') {
            setSelectedRoute(route);
            setForm({
                ...route,
                stops: route.stops || [],
            });
            // If route has coordinates, show map immediately
            if (route.start_latitude && route.start_longitude && route.end_latitude && route.end_longitude) {
                const startLat = route.start_latitude;
                const startLng = route.start_longitude;
                const endLat = route.end_latitude;
                const endLng = route.end_longitude;
                if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
                    setMapMarkers({ start: [startLat, startLng], end: [endLat, endLng] });
                    setMapPolyline([[startLat, startLng], [endLat, endLng]]);
                    const centerLat = (startLat + endLat) / 2;
                    const centerLng = (startLng + endLng) / 2;
                    if (!isNaN(centerLat) && !isNaN(centerLng)) setMapCenter([centerLat, centerLng]);
                }
            } else {
                // Geocode missing coordinates (async)
                if (route.start_location && !route.start_latitude) {
                    const coords = await geocodeLocation(route.start_location);
                    if (coords) setForm(prev => ({ ...prev, start_latitude: coords.lat, start_longitude: coords.lng }));
                }
                if (route.end_location && !route.end_latitude) {
                    const coords = await geocodeLocation(route.end_location);
                    if (coords) setForm(prev => ({ ...prev, end_latitude: coords.lat, end_longitude: coords.lng }));
                }
                setTimeout(() => updateMapPreviewFromForm(), 100);
            }
            if (mode === 'view' && route.route_id) await fetchRouteStops(route.route_id);
        } else {
            setSelectedRoute(null);
            setForm({
                route_id: 0,
                route_code: '',
                route_name: '',
                start_location: '',
                end_location: '',
                start_latitude: null,
                start_longitude: null,
                end_latitude: null,
                end_longitude: null,
                total_distance: 0,
                estimated_duration: 0,
                base_fare: 0,
                fare_per_km: 0,
                status: 'active',
                description: null,
                stops: [],
            });
            setMapMarkers({ start: null, end: null });
            setMapPolyline([]);
            setMapCenter([7.8731, 80.7718]);
        }
        setModalMode(mode);
    };

    const fetchRouteStops = async (routeId: number) => {
        try {
            setStopsLoading(true);
            const response = await api.get(`/routes/${routeId}/stops`);
            if (response.data.success) setForm(prev => ({ ...prev, stops: response.data.data.stops || [] }));
        } catch (error) { console.error(error); }
        finally { setStopsLoading(false); }
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedRoute(null);
        setFormLoading(false);
    };

    const addStop = () => {
        const newStop: RouteStop = {
            stop_name: '',
            stop_order: (form.stops?.length || 0) + 1,
            distance_from_start: 0,
            waiting_time: 2,
            fare_to_next: 0,
        };
        setForm({ ...form, stops: [...(form.stops || []), newStop] });
    };

    const removeStop = (index: number) => {
        const newStops = [...(form.stops || [])];
        newStops.splice(index, 1);
        newStops.forEach((stop, idx) => { stop.stop_order = idx + 1; });
        setForm({ ...form, stops: newStops });
    };

    const updateStop = (index: number, field: keyof RouteStop, value: string | number) => {
        const newStops = [...(form.stops || [])];
        newStops[index] = { ...newStops[index], [field]: value };
        setForm({ ...form, stops: newStops });
    };

    const handleCreate = async () => {
        if (!form.route_code || !form.route_name || !form.start_location || !form.end_location) {
            toast.error('Please fill all required fields');
            return;
        }
        setFormLoading(true);
        try {
            const routeResponse = await api.post('/routes', {
                route_code: form.route_code,
                route_name: form.route_name,
                start_location: form.start_location,
                end_location: form.end_location,
                start_latitude: form.start_latitude,
                start_longitude: form.start_longitude,
                end_latitude: form.end_latitude,
                end_longitude: form.end_longitude,
                total_distance: form.total_distance,
                estimated_duration: form.estimated_duration,
                base_fare: form.base_fare,
                fare_per_km: form.fare_per_km,
                status: form.status,
                description: form.description,
            });
            if (routeResponse.data.success) {
                const newRoute = routeResponse.data.data;
                if (form.stops?.length) {
                    await api.post('/route-stops/bulk', {
                        route_id: newRoute.route_id,
                        stops: form.stops.map((stop, idx) => ({
                            stop_name: stop.stop_name,
                            stop_order: idx + 1,
                            distance_from_start: stop.distance_from_start,
                            waiting_time: stop.waiting_time || 2,
                            fare_to_next: stop.fare_to_next || 0,
                            latitude: stop.latitude || null,
                            longitude: stop.longitude || null,
                        }))
                    });
                }
                toast.success('Route created successfully');
                fetchRoutes();
                closeModal();
            } else toast.error(routeResponse.data.message || 'Failed to create route');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create route');
        } finally { setFormLoading(false); }
    };

    const handleUpdate = async () => {
        if (!selectedRoute) return;
        if (!form.route_code || !form.route_name || !form.start_location || !form.end_location) {
            toast.error('Please fill all required fields');
            return;
        }
        setFormLoading(true);
        try {
            const response = await api.put(`/routes/${selectedRoute.route_id}`, {
                route_code: form.route_code,
                route_name: form.route_name,
                start_location: form.start_location,
                end_location: form.end_location,
                start_latitude: form.start_latitude,
                start_longitude: form.start_longitude,
                end_latitude: form.end_latitude,
                end_longitude: form.end_longitude,
                total_distance: form.total_distance,
                estimated_duration: form.estimated_duration,
                base_fare: form.base_fare,
                fare_per_km: form.fare_per_km,
                status: form.status,
                description: form.description,
            });
            if (response.data.success) {
                if (form.stops?.length) {
                    await api.post('/route-stops/bulk', {
                        route_id: selectedRoute.route_id,
                        stops: form.stops.map((stop, idx) => ({
                            stop_name: stop.stop_name,
                            stop_order: idx + 1,
                            distance_from_start: stop.distance_from_start,
                            waiting_time: stop.waiting_time || 2,
                            fare_to_next: stop.fare_to_next || 0,
                            latitude: stop.latitude || null,
                            longitude: stop.longitude || null,
                        }))
                    });
                }
                toast.success('Route updated successfully');
                fetchRoutes();
                closeModal();
            } else toast.error(response.data.message || 'Failed to update route');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update route');
        } finally { setFormLoading(false); }
    };

    const handleSave = () => {
        if (modalMode === 'create') handleCreate();
        else if (modalMode === 'edit') handleUpdate();
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        try {
            const response = await api.delete(`/routes/${deleteConfirm.route_id}`);
            if (response.data.success) {
                toast.success('Route deleted successfully');
                fetchRoutes();
                setDeleteConfirm(null);
                setShowDeleteModal(false);
            } else toast.error(response.data.message || 'Failed to delete route');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to delete route');
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins} min`;
    };

    // Update map when form coordinates change (create/edit mode)
    useEffect(() => {
        if (modalMode === 'create' || modalMode === 'edit') {
            updateMapPreviewFromForm();
        }
    }, [form.start_latitude, form.start_longitude, form.end_latitude, form.end_longitude]);

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Routes</h1>
                    <p className="text-sm text-foreground-400 mt-1">Manage transport routes and stop sequences</p>
                </div>
                <button onClick={() => openModal('create')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20">
                    <i className="ri-add-line"></i> <span>Add Route</span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code, name or location..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all" />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <span className="ml-2 text-foreground-500">Loading routes...</span>
                </div>
            )}

            {/* Routes Table */}
            {!loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-background-100 bg-background-50/50">
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Route Code</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Route Name</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Start → End</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Distance</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Duration</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Base Fare</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredRoutes.map((route) => (
                                <tr key={route.route_id} className="border-b border-background-50 hover:bg-background-50/50 transition-colors">
                                    <td className="px-5 py-3 text-foreground-900 font-mono font-semibold text-xs whitespace-nowrap">{route.route_code}</td>
                                    <td className="px-5 py-3 text-foreground-800 font-medium whitespace-nowrap">{route.route_name}</td>
                                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap text-xs">{route.start_location} → {route.end_location}</td>
                                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{route.total_distance} km</td>
                                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{formatDuration(route.estimated_duration)}</td>
                                    <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">LKR {Number(route.base_fare).toFixed(2)}</td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusBadge[route.status]}`}>
                                    {route.status}
                                </span>
                                    </td>
                                    <td className="px-5 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openModal('view', route)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                                <i className="ri-eye-line text-sm"></i>
                                            </button>
                                            <button onClick={() => openModal('edit', route)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
                                                <i className="ri-edit-line text-sm"></i>
                                            </button>
                                            <button onClick={() => { setDeleteConfirm(route); setShowDeleteModal(true); }} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                                                <i className="ri-delete-bin-line text-sm"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredRoutes.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-12 text-center text-foreground-400">No routes found</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Route Modal */}
            {modalMode && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-background-200 animate-scale-in mx-4">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200">
                            <h2 className="text-lg font-semibold text-foreground-900 font-heading">
                                {modalMode === 'view' ? 'Route Details' : modalMode === 'create' ? 'Create Route' : 'Edit Route'}
                            </h2>
                            <button onClick={closeModal} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:bg-background-100 transition-colors cursor-pointer"><i className="ri-close-line"></i></button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Basic Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Route Code *</label>
                                    <input type="text" value={form.route_code} onChange={(e) => setForm({ ...form, route_code: e.target.value.toUpperCase() })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 read-only:bg-background-50" required />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Route Name *</label>
                                    <input type="text" value={form.route_name} onChange={(e) => setForm({ ...form, route_name: e.target.value })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 read-only:bg-background-50" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Start Location *</label>
                                    <input
                                        type="text"
                                        value={form.start_location}
                                        onChange={(e) => setForm({ ...form, start_location: e.target.value })}
                                        onBlur={fetchDistanceAndDuration}
                                        readOnly={modalMode === 'view'}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 read-only:bg-background-50"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">End Location *</label>
                                    <input
                                        type="text"
                                        value={form.end_location}
                                        onChange={(e) => setForm({ ...form, end_location: e.target.value })}
                                        onBlur={fetchDistanceAndDuration}
                                        readOnly={modalMode === 'view'}
                                        className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 read-only:bg-background-50"
                                        required
                                    />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Total Distance (km) *</label>
                                    <input type="number" step="0.01" value={form.total_distance} onChange={(e) => setForm({ ...form, total_distance: Number(e.target.value) })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50" required />
                                    {calculatingDistance && <i className="ri-loader-4-line animate-spin absolute right-3 top-9 text-primary-500"></i>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Estimated Duration (min) *</label>
                                    <input type="number" value={form.estimated_duration} onChange={(e) => setForm({ ...form, estimated_duration: Number(e.target.value) })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Base Fare (LKR)</label>
                                    <input type="number" step="0.01" value={form.base_fare} onChange={(e) => setForm({ ...form, base_fare: Number(e.target.value) })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Fare per KM (LKR)</label>
                                    <input type="number" step="0.01" value={form.fare_per_km} onChange={(e) => setForm({ ...form, fare_per_km: Number(e.target.value) })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground-500 mb-1">Status</label>
                                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Route['status'] })} disabled={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 disabled:bg-background-50">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            {/* Coordinates Section */}
                            <div>
                                <h4 className="text-xs font-semibold text-foreground-400 uppercase tracking-wider mb-2">Coordinates</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div><label className="block text-[11px] text-foreground-400 mb-1">Start Latitude</label><input type="number" step="0.00000001" value={form.start_latitude || ''} onChange={(e) => setForm({ ...form, start_latitude: e.target.value ? Number(e.target.value) : null })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50" /></div>
                                    <div><label className="block text-[11px] text-foreground-400 mb-1">Start Longitude</label><input type="number" step="0.00000001" value={form.start_longitude || ''} onChange={(e) => setForm({ ...form, start_longitude: e.target.value ? Number(e.target.value) : null })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50" /></div>
                                    <div><label className="block text-[11px] text-foreground-400 mb-1">End Latitude</label><input type="number" step="0.00000001" value={form.end_latitude || ''} onChange={(e) => setForm({ ...form, end_latitude: e.target.value ? Number(e.target.value) : null })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50" /></div>
                                    <div><label className="block text-[11px] text-foreground-400 mb-1">End Longitude</label><input type="number" step="0.00000001" value={form.end_longitude || ''} onChange={(e) => setForm({ ...form, end_longitude: e.target.value ? Number(e.target.value) : null })} readOnly={modalMode === 'view'} className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 read-only:bg-background-50" /></div>
                                </div>
                            </div>

                            {/* Map Preview */}
                            {form.start_location && form.end_location && mapMarkers.start && mapMarkers.end && (
                                <div>
                                    <h4 className="text-xs font-semibold text-foreground-400 uppercase tracking-wider mb-2">Route Map Preview</h4>
                                    <div style={{ height: '300px', width: '100%', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                        {updatingMap ? (
                                            <div className="flex items-center justify-center h-full bg-gray-50">
                                                <i className="ri-loader-4-line animate-spin text-primary-500 text-xl"></i>
                                                <span className="ml-2 text-sm text-gray-500">Loading map...</span>
                                            </div>
                                        ) : (
                                            mapCenter && !isNaN(mapCenter[0]) && !isNaN(mapCenter[1]) ? (
                                                <MapContainer
                                                    key={`${form.start_location}-${form.end_location}-${form.start_latitude}-${form.end_latitude}`}
                                                    center={mapCenter}
                                                    zoom={8}
                                                    style={{ height: '100%', width: '100%' }}
                                                >
                                                    <TileLayer
                                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                    />
                                                    {mapMarkers.start && <Marker position={mapMarkers.start}><Popup>Start: {form.start_location}</Popup></Marker>}
                                                    {mapMarkers.end && <Marker position={mapMarkers.end}><Popup>End: {form.end_location}</Popup></Marker>}
                                                    {mapPolyline.length > 0 && <Polyline positions={mapPolyline} color="blue" weight={3} />}
                                                </MapContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-full bg-gray-50">
                                                    <i className="ri-map-pin-line text-gray-400 text-xl"></i>
                                                    <span className="ml-2 text-sm text-gray-500">Fetching map data...</span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-semibold text-foreground-500 mb-1">Description</label>
                                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} readOnly={modalMode === 'view'} rows={3} maxLength={500} placeholder="Route description..." className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400 read-only:bg-background-50 resize-none" />
                            </div>

                            {/* Route Stops Section */}
                            <div className="border-t border-background-200 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-foreground-900 font-heading">Route Stops ({form.stops?.length || 0})</h4>
                                    {modalMode !== 'view' && (
                                        <button onClick={addStop} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent-50 text-accent-600 text-xs font-semibold hover:bg-accent-100 transition-colors cursor-pointer whitespace-nowrap">
                                            <i className="ri-add-line"></i> <span>Add Stop</span>
                                        </button>
                                    )}
                                </div>
                                {stopsLoading && <div className="flex items-center justify-center py-4"><i className="ri-loader-4-line animate-spin text-primary-500"></i><span className="ml-2 text-sm text-foreground-500">Loading stops...</span></div>}
                                {!stopsLoading && form.stops && form.stops.length > 0 && (
                                    <div className="space-y-3">
                                        {form.stops.map((stop, index) => (
                                            <div key={index} className="p-3 rounded-lg border border-background-200 bg-background-50/50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-xs font-semibold text-foreground-600">Stop #{stop.stop_order}</span>
                                                    {modalMode !== 'view' && <button onClick={() => removeStop(index)} className="text-red-400 hover:text-red-600 cursor-pointer text-xs"><i className="ri-delete-bin-line"></i></button>}
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                    <div className="sm:col-span-2"><label className="block text-[10px] text-foreground-400 mb-0.5">Stop Name *</label><input type="text" value={stop.stop_name} onChange={(e) => updateStop(index, 'stop_name', e.target.value)} readOnly={modalMode === 'view'} className="w-full px-2 py-1.5 rounded border border-background-300 text-xs text-foreground-900 read-only:bg-background-50" required /></div>
                                                    <div><label className="block text-[10px] text-foreground-400 mb-0.5">Distance (km)</label><input type="number" step="0.01" value={stop.distance_from_start} onChange={(e) => updateStop(index, 'distance_from_start', Number(e.target.value))} readOnly={modalMode === 'view'} className="w-full px-2 py-1.5 rounded border border-background-300 text-xs text-foreground-900 read-only:bg-background-50" /></div>
                                                    <div><label className="block text-[10px] text-foreground-400 mb-0.5">Wait (min)</label><input type="number" value={stop.waiting_time} onChange={(e) => updateStop(index, 'waiting_time', Number(e.target.value))} readOnly={modalMode === 'view'} className="w-full px-2 py-1.5 rounded border border-background-300 text-xs text-foreground-900 read-only:bg-background-50" /></div>
                                                    <div><label className="block text-[10px] text-foreground-400 mb-0.5">Fare to Next</label><input type="number" step="0.01" value={stop.fare_to_next} onChange={(e) => updateStop(index, 'fare_to_next', Number(e.target.value))} readOnly={modalMode === 'view'} className="w-full px-2 py-1.5 rounded border border-background-300 text-xs text-foreground-900 read-only:bg-background-50" /></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!stopsLoading && (!form.stops || form.stops.length === 0) && <p className="text-sm text-foreground-400 text-center py-4">No stops added yet.</p>}
                            </div>
                        </div>

                        {/* Modal Footer (only for create/edit) */}
                        {modalMode !== 'view' && (
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-background-200">
                                <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
                                <button onClick={handleSave} disabled={formLoading} className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {formLoading ? 'Processing...' : (modalMode === 'create' ? 'Create Route' : 'Save Changes')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setShowDeleteModal(false)} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-background-200 p-6 animate-scale-in mx-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4"><i className="ri-delete-bin-line text-red-500 text-xl"></i></div>
                        <h3 className="text-lg font-semibold text-foreground-900 text-center font-heading">Delete Route?</h3>
                        <p className="text-sm text-foreground-500 text-center mt-2">Are you sure you want to delete <strong>{deleteConfirm.route_code}</strong> — {deleteConfirm.route_name}? This action cannot be undone.</p>
                        <div className="flex items-center gap-3 mt-6">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2.5 rounded-lg border border-background-300 text-sm font-medium text-foreground-600 hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}