// src/pages/portal/page.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriver } from '@/context/DriverContext';
import api from '@/api/axios';
import { toast } from 'react-hot-toast';

interface Stop {
    stop_id: number;
    stop_name: string;
    stop_order: number;
    distance_from_start: number;
    estimated_arrival_time: number;
    is_passed: boolean;
    is_current: boolean;
    is_next: boolean;
}

interface ScheduleData {
    schedule_id: number;
    route: {
        route_id: number;
        route_name: string;
        total_distance: string;
        estimated_duration: number;
    };
    departure_time: string;
    arrival_time: string;
    current_stop_id: number | null;
    next_stop_id: number | null;
}

export default function PortalPage() {
    const navigate = useNavigate();
    const { driver, logoutDriver } = useDriver();

    const [schedule, setSchedule] = useState<ScheduleData | null>(null);
    const [stops, setStops] = useState<Stop[]>([]);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState<number | null>(null);
    const [justArrived, setJustArrived] = useState<number | null>(null);
    const [now, setNow] = useState(new Date());
    const [showAllStops, setShowAllStops] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const scheduleRes = await api.get('/drivers/me/schedule');
            if (!scheduleRes.data.success) throw new Error('No active schedule');
            const sched = scheduleRes.data.data;
            setSchedule(sched);

            const stopsRes = await api.get(`/schedules/${sched.schedule_id}/stops`);
            if (stopsRes.data.success) {
                setStops(stopsRes.data.data);
            } else {
                throw new Error('Failed to load stops');
            }
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || 'Failed to load route data';
            toast.error(msg);
            if (msg.includes('No active schedule')) {
                setTimeout(() => navigate('/driver-login'), 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    const markArrival = async (stopId: number) => {
        try {
            if (!schedule) return;
            await api.post(`/schedules/${schedule.schedule_id}/arrive`, { stopId });
            toast.success('Arrival recorded');
            await fetchData();
            setJustArrived(stopId);
            setTimeout(() => setJustArrived(null), 2500);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to record arrival');
        }
    };

    const handleArrive = (stopId: number) => {
        if (confirming === stopId) {
            markArrival(stopId);
            setConfirming(null);
        } else {
            setConfirming(stopId);
            setTimeout(() => setConfirming((c) => (c === stopId ? null : c)), 5000);
        }
    };

    const handleEndShift = () => {
        logoutDriver();
        navigate('/driver-login');
    };

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (!driver) {
            navigate('/driver-login');
            return;
        }
        fetchData();
    }, [driver]);

    if (!driver) return null;
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <p className="text-gray-500 mt-2">Loading route data...</p>
                </div>
            </div>
        );
    }

    const total = stops.length;
    const completed = stops.filter(s => s.is_passed).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Compute next stop: first not-passed stop ordered by stop_order
    const nextStop = stops
        .filter(s => !s.is_passed)
        .sort((a, b) => a.stop_order - b.stop_order)[0] || null;

    // Compute previous (last passed) stop
    const prevStop = stops
        .filter(s => s.is_passed)
        .sort((a, b) => b.stop_order - a.stop_order)[0] || null;

    const tripComplete = completed === total && total > 0;

    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                                <i className="ri-steering-2-line text-primary-600 text-xl"></i>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 font-heading">Driver Portal</h1>
                                <p className="text-xs text-gray-500">{driver.name} · {driver.driver_code}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-mono font-bold text-gray-900">{timeStr}</p>
                                <p className="text-[11px] text-gray-500">{dateStr}</p>
                            </div>
                            <button
                                onClick={() => setShowEndConfirm(true)}
                                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <i className="ri-logout-box-r-line"></i>
                                <span className="hidden sm:inline">End Shift</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Route Progress Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <i className="ri-route-line text-primary-500 text-lg"></i>
                            <h2 className="text-lg font-semibold text-gray-900">{schedule?.route?.route_name || 'Route'}</h2>
                        </div>
                        <span className="text-sm font-bold text-primary-600">{completed}/{total} halts completed</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${pct}%`,
                                background: tripComplete
                                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                                    : 'linear-gradient(90deg, #ef4444, #f97316)',
                            }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-right">{pct}% complete</p>
                </div>

                {tripComplete && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center mb-6">
                        <i className="ri-checkbox-circle-line text-emerald-500 text-5xl mb-3 block"></i>
                        <h2 className="text-xl font-bold text-emerald-700 mb-1">Trip Complete!</h2>
                        <p className="text-emerald-600 text-sm">All {total} halts covered successfully.</p>
                        <button
                            onClick={handleEndShift}
                            className="mt-4 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
                        >
                            End Shift & Sign Out
                        </button>
                    </div>
                )}

                {!tripComplete && nextStop && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Stop</span>
                        </div>
                        <div className="flex items-start justify-between flex-wrap gap-4">
                            <div>
                                <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Stop {nextStop.stop_order}</span>
                                <h2 className="text-2xl font-bold text-gray-900 mt-2">{nextStop.stop_name}</h2>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <i className="ri-time-line"></i> ETA: {nextStop.estimated_arrival_time} min · {nextStop.distance_from_start} km
                                </p>
                            </div>
                            <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
                                <i className="ri-map-pin-2-line text-red-500 text-2xl"></i>
                            </div>
                        </div>

                        {prevStop && (
                            <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                                <i className="ri-check-line text-emerald-500"></i>
                                <span>Last stop: <span className="font-medium text-gray-700">{prevStop.stop_name}</span></span>
                                <span className="ml-auto text-emerald-600">Completed</span>
                            </div>
                        )}

                        <button
                            onClick={() => handleArrive(nextStop.stop_id)}
                            className={`w-full mt-5 py-3 rounded-lg font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                                confirming === nextStop.stop_id
                                    ? 'bg-red-600 text-white shadow-lg'
                                    : 'bg-red-500 hover:bg-red-600 text-white shadow-md'
                            }`}
                        >
                            {confirming === nextStop.stop_id ? (
                                <>
                                    <i className="ri-check-double-line text-xl"></i>
                                    Tap again to confirm
                                </>
                            ) : (
                                <>
                                    <i className="ri-map-pin-add-line text-xl"></i>
                                    Arrived at this halt
                                </>
                            )}
                        </button>
                        {confirming === nextStop.stop_id && (
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Tap once more to confirm arrival at <strong>{nextStop.stop_name}</strong>
                            </p>
                        )}
                    </div>
                )}

                {!tripComplete && stops.length > 0 && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <button
                            onClick={() => setShowAllStops(!showAllStops)}
                            className="w-full flex items-center justify-between mb-4 group"
                        >
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-700">
                                All Halts ({completed} done · {total - completed} remaining)
                            </span>
                            <i className={`ri-arrow-${showAllStops ? 'up' : 'down'}-s-line text-gray-400 group-hover:text-gray-600`}></i>
                        </button>

                        <div className="space-y-2">
                            {stops
                                .filter((_, idx) => showAllStops || idx >= Math.max(0, stops.findIndex(s => s.stop_id === nextStop?.stop_id) - 1))
                                .map((stop) => {
                                    const isDone = stop.is_passed;
                                    const isNext = stop.stop_id === nextStop?.stop_id;
                                    const isJustArrived = justArrived === stop.stop_id;
                                    return (
                                        <div
                                            key={stop.stop_id}
                                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                                isJustArrived
                                                    ? 'bg-red-50 border-red-200'
                                                    : isDone
                                                        ? 'bg-gray-50 border-gray-200'
                                                        : isNext
                                                            ? 'bg-red-50 border-red-200'
                                                            : 'bg-white border-gray-200'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                                isJustArrived
                                                    ? 'bg-red-500 text-white shadow-md'
                                                    : isDone
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : isNext
                                                            ? 'bg-red-500 text-white shadow-md'
                                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {isDone
                                                    ? <i className="ri-check-line text-base"></i>
                                                    : isNext
                                                        ? <i className="ri-navigation-line text-base"></i>
                                                        : stop.stop_order
                                                }
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-semibold ${isDone ? 'text-gray-500' : 'text-gray-800'}`}>
                                                    {stop.stop_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {isDone
                                                        ? 'Completed'
                                                        : isNext
                                                            ? 'Next Stop'
                                                            : `${stop.distance_from_start} km · ETA ${stop.estimated_arrival_time} min`
                                                    }
                                                </p>
                                            </div>
                                            {!isDone && !isNext && (
                                                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                                                    {stop.distance_from_start} km
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            {!showAllStops && total - completed > 2 && (
                                <button
                                    onClick={() => setShowAllStops(true)}
                                    className="w-full py-2 text-xs text-primary-600 hover:text-primary-700 transition-colors text-center"
                                >
                                    + {total - completed - 1} more halts · tap to show all
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {tripComplete && (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <i className="ri-history-line"></i> Trip Summary
                        </h3>
                        <div className="space-y-2">
                            {stops.map((stop) => (
                                <div key={stop.stop_id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <i className="ri-check-line text-emerald-600 text-sm"></i>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-800">{stop.stop_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* End Shift Confirmation Modal */}
            {showEndConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <i className="ri-logout-box-r-line text-red-500 text-xl"></i>
                        </div>
                        <h3 className="text-lg font-bold text-center text-gray-900 mb-1">End Shift?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            {completed < total
                                ? `You've completed ${completed} of ${total} halts. Progress will be lost.`
                                : 'All halts complete. Ready to sign out?'
                            }
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowEndConfirm(false)}
                                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEndShift}
                                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold transition-colors"
                            >
                                End Shift
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}