import { useState, useEffect, useMemo } from 'react';
import Layout from '@/components/feature/Layout';
import { toast } from 'react-hot-toast';
import api from '@/api/axios';

interface Ticket {
    ticket_id: number;
    ticket_number: string;
    schedule_id: number;
    passenger_name: string;
    passenger_nic: string;
    passenger_phone: string;
    seat_number: string;
    from_stop_id: number;
    to_stop_id: number;
    from_stop_name: string;
    to_stop_name: string;
    fare_amount: number;
    booking_date: string;
    travel_date: string;
    booking_status: 'confirmed' | 'cancelled' | 'used' | 'refunded';
    payment_method: 'cash' | 'card' | 'mobile_payment';
    payment_status: 'pending' | 'paid' | 'refunded';
    payment_reference: string;
    cancelled_at: string | null;
    cancellation_reason: string | null;
    schedule?: {
        schedule_code: string;
        departure_time: string;
        route?: {
            route_id: number;
            route_name: string;
            route_code: string;
        };
    };
}

interface Schedule {
    schedule_id: number;
    schedule_code: string;
    departure_time: string;
    arrival_time: string;
    route_id: number;
    route_name?: string;
    trip_type: string;
    trip_status: string;
}

interface RouteStop {
    stop_id: number;
    stop_name: string;
    stop_order: number;
    distance_from_start: number;
    fare_to_next: number;
}

interface Route {
    route_id: number;
    route_code: string;
    route_name: string;
    stops: RouteStop[];
}

const bookingStatusBadge: Record<string, string> = {
    confirmed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    used: 'bg-blue-100 text-blue-700',
    refunded: 'bg-amber-100 text-amber-700',
};

const paymentStatusBadge: Record<string, string> = {
    paid: 'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    refunded: 'bg-red-100 text-red-700',
};

const paymentMethodIcon: Record<string, string> = {
    cash: 'ri-money-dollar-circle-line',
    card: 'ri-bank-card-line',
    mobile_payment: 'ri-smartphone-line',
};

function isRefundable(ticket: Ticket): boolean {
    if (ticket.booking_status !== 'confirmed') return false;
    if (ticket.payment_status === 'refunded') return false;
    const travelDate = new Date(ticket.travel_date);
    const now = new Date();
    const daysUntil = Math.ceil((travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 1;
}

export default function TicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [loading, setLoading] = useState(true);
    const [schedulesLoading, setSchedulesLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [modalMode, setModalMode] = useState<'view' | 'book' | 'cancel' | 'refund' | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [form, setForm] = useState<any>({
        schedule_id: '',
        passenger_name: '',
        passenger_nic: '',
        passenger_phone: '',
        seat_number: '',
        from_stop_id: '',
        to_stop_id: '',
        from_stop_name: '',
        to_stop_name: '',
        fare_amount: 0,
        travel_date: '',
        payment_method: 'cash',
        payment_reference: '',
    });
    const [cancelReason, setCancelReason] = useState('');
    const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
    const [routeStops, setRouteStops] = useState<RouteStop[]>([]);
    const [bookingLoading, setBookingLoading] = useState(false);

    // Fetch all tickets
    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/tickets');
            if (response.data.success) {
                setTickets(response.data.data);
            } else {
                toast.error('Failed to load tickets');
            }
        } catch (error) {
            console.error("Error fetching tickets:", error);
            toast.error('Failed to load tickets');
        } finally {
            setLoading(false);
        }
    };

    // Fetch active schedules for booking
    const fetchSchedules = async () => {
        try {
            setSchedulesLoading(true);
            const response = await api.get('/schedules?status=scheduled&status=on_time&status=in_progress');
            if (response.data.success) {
                setSchedules(response.data.data || []);
            } else {
                setSchedules([]);
            }
        } catch (error: any) {
            console.error("Error fetching schedules:", error);
            setSchedules([]);
        } finally {
            setSchedulesLoading(false);
        }
    };

    // Fetch routes for stops
    const fetchRoutes = async () => {
        try {
            const response = await api.get('/routes/active');
            if (response.data.success) {
                setRoutes(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching routes:", error);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchSchedules();
        fetchRoutes();
    }, []);

    const filteredTickets = tickets.filter(
        (t) =>
            t.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
            t.passenger_name?.toLowerCase().includes(search.toLowerCase()) ||
            t.from_stop_name?.toLowerCase().includes(search.toLowerCase()) ||
            t.to_stop_name?.toLowerCase().includes(search.toLowerCase()) ||
            t.passenger_phone?.includes(search)
    );

    const activeSchedules = useMemo(() =>
            schedules.filter((s) => s.trip_status !== 'cancelled' && s.trip_status !== 'completed'),
        [schedules]
    );

    const openBookModal = () => {
        fetchSchedules();
        setSelectedTicket(null);
        setForm({
            schedule_id: '',
            passenger_name: '',
            passenger_nic: '',
            passenger_phone: '',
            seat_number: '',
            from_stop_id: '',
            to_stop_id: '',
            from_stop_name: '',
            to_stop_name: '',
            fare_amount: 0,
            travel_date: '',
            payment_method: 'cash',
            payment_reference: '',
        });
        setSelectedRoute(null);
        setRouteStops([]);
        setModalMode('book');
    };

    const openViewModal = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setModalMode('view');
    };

    const openCancelModal = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setCancelReason('');
        setModalMode('cancel');
    };

    const openRefundModal = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setModalMode('refund');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedTicket(null);
        setSelectedRoute(null);
        setRouteStops([]);
    };

    // Handle schedule selection
    const handleScheduleSelect = async (scheduleId: number) => {
        const schedule = schedules.find((s) => s.schedule_id === scheduleId);
        if (schedule) {
            setForm({
                ...form,
                schedule_id: scheduleId,
                travel_date: schedule.departure_time?.split('T')[0] || new Date().toISOString().split('T')[0],
            });

            // Fetch route stops if route exists
            if (schedule.route_id) {
                try {
                    const response = await api.get(`/routes/${schedule.route_id}/stops`);
                    if (response.data.success) {
                        const routeData = response.data.data;
                        const stops = routeData.stops || [];
                        setSelectedRoute(routeData);
                        setRouteStops(stops);

                        // Debug log
                        console.log("Route Stops loaded:", stops.map(s => ({ id: s.stop_id, name: s.stop_name, order: s.stop_order })));
                    }
                } catch (error) {
                    console.error("Error fetching route stops:", error);
                    toast.error("Failed to load route stops");
                }
            }
        }
    };

    // Calculate fare based on selected stops
    const calculateFare = (fromStopId: number, toStopId: number) => {
        // If no from stop selected, just update
        if (!fromStopId) {
            setForm({ ...form, from_stop_id: '', to_stop_id: '', fare_amount: 0 });
            return;
        }

        // If same stop, show error
        if (fromStopId === toStopId) {
            setForm({
                ...form,
                from_stop_id: fromStopId,
                to_stop_id: toStopId,
                from_stop_name: routeStops.find(s => s.stop_id === fromStopId)?.stop_name || '',
                to_stop_name: routeStops.find(s => s.stop_id === toStopId)?.stop_name || '',
                fare_amount: 0
            });
            toast.error('Departure and arrival stops cannot be the same');
            return;
        }

        const fromStop = routeStops.find((s) => s.stop_id === fromStopId);
        const toStop = routeStops.find((s) => s.stop_id === toStopId);

        if (fromStop && toStop && toStop.stop_order > fromStop.stop_order) {
            let totalFare = 0;
            for (let i = fromStop.stop_order; i < toStop.stop_order; i++) {
                totalFare += Number(routeStops[i]?.fare_to_next || 0);
            }
            setForm({
                ...form,
                from_stop_id: fromStopId,
                to_stop_id: toStopId,
                from_stop_name: fromStop.stop_name,
                to_stop_name: toStop.stop_name,
                fare_amount: totalFare
            });
        } else if (toStopId && toStop && toStop.stop_order <= fromStop.stop_order) {
            setForm({
                ...form,
                from_stop_id: fromStopId,
                to_stop_id: toStopId,
                from_stop_name: fromStop?.stop_name || '',
                to_stop_name: toStop?.stop_name || '',
                fare_amount: 0
            });
            toast.error('Arrival stop must be after departure stop');
        } else {
            setForm({
                ...form,
                from_stop_id: fromStopId,
                to_stop_id: toStopId,
                from_stop_name: fromStop?.stop_name || '',
                to_stop_name: '',
                fare_amount: 0
            });
        }
    };

    // Create new ticket
    const handleBook = async () => {
        // Validation
        if (!form.schedule_id) {
            toast.error('Please select a schedule');
            return;
        }
        if (!form.passenger_name) {
            toast.error('Please enter passenger name');
            return;
        }
        if (!form.passenger_phone) {
            toast.error('Please enter passenger phone');
            return;
        }
        if (!form.seat_number) {
            toast.error('Please enter seat number');
            return;
        }
        if (!form.from_stop_id) {
            toast.error('Please select departure stop');
            return;
        }
        if (!form.to_stop_id) {
            toast.error('Please select arrival stop');
            return;
        }
        if (form.from_stop_id === form.to_stop_id) {
            toast.error('Departure and arrival stops cannot be the same');
            return;
        }
        if (form.fare_amount <= 0) {
            toast.error('Invalid fare amount');
            return;
        }

        setBookingLoading(true);
        try {
            const payload = {
                schedule_id: parseInt(form.schedule_id),
                passenger_name: form.passenger_name,
                passenger_nic: form.passenger_nic || null,
                passenger_phone: form.passenger_phone,
                seat_number: form.seat_number,
                from_stop_id: parseInt(form.from_stop_id),
                to_stop_id: parseInt(form.to_stop_id),
                from_stop_name: form.from_stop_name,
                to_stop_name: form.to_stop_name,
                fare_amount: form.fare_amount,
                travel_date: form.travel_date,
                payment_method: form.payment_method,
                payment_reference: form.payment_reference || null,
            };

            const response = await api.post('/tickets', payload);
            if (response.data.success) {
                toast.success('Ticket booked successfully');
                fetchTickets();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to book ticket');
            }
        } catch (error: any) {
            console.error("Booking error:", error);
            toast.error(error.response?.data?.message || 'Failed to book ticket');
        } finally {
            setBookingLoading(false);
        }
    };

    // Cancel ticket
    const handleCancel = async () => {
        if (!selectedTicket) return;

        try {
            const response = await api.put(`/tickets/${selectedTicket.ticket_id}/cancel`, {
                reason: cancelReason
            });
            if (response.data.success) {
                toast.success('Ticket cancelled successfully');
                fetchTickets();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to cancel ticket');
            }
        } catch (error: any) {
            console.error("Cancel error:", error);
            toast.error(error.response?.data?.message || 'Failed to cancel ticket');
        }
    };

    // Mark ticket as used
    const markAsUsed = async (ticketId: number) => {
        try {
            const response = await api.put(`/tickets/${ticketId}/use`);
            if (response.data.success) {
                toast.success('Ticket marked as used');
                fetchTickets();
            } else {
                toast.error(response.data.message || 'Failed to mark ticket');
            }
        } catch (error: any) {
            console.error("Mark used error:", error);
            toast.error(error.response?.data?.message || 'Failed to mark ticket');
        }
    };

    // Process refund
    const handleRefund = async () => {
        if (!selectedTicket) return;

        try {
            const response = await api.put(`/tickets/${selectedTicket.ticket_id}/refund`);
            if (response.data.success) {
                toast.success('Refund processed successfully');
                fetchTickets();
                closeModal();
            } else {
                toast.error(response.data.message || 'Failed to process refund');
            }
        } catch (error: any) {
            console.error("Refund error:", error);
            toast.error(error.response?.data?.message || 'Failed to process refund');
        }
    };

    // Get available stops for dropdown (stops after selected from stop)
    const availableToStops = useMemo(() => {
        if (!form.from_stop_id || !routeStops.length) return [];
        const fromStop = routeStops.find(s => s.stop_id === parseInt(form.from_stop_id));
        if (!fromStop) return [];
        return routeStops.filter(s => s.stop_order > fromStop.stop_order);
    }, [form.from_stop_id, routeStops]);

    // Get from stops (all stops except last one)
    const availableFromStops = useMemo(() => {
        if (!routeStops.length) return [];
        return routeStops.filter(s => s.stop_order < routeStops.length);
    }, [routeStops]);

    return (
        <Layout>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground-900 font-heading">Tickets</h1>
                    <p className="text-sm text-foreground-400 mt-1">Book, manage, and track passenger tickets</p>
                </div>
                <button
                    onClick={openBookModal}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold text-sm transition-all cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20"
                >
                    <i className="ri-add-line"></i>
                    <span>Book Ticket</span>
                </button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-400 text-sm"></i>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by ticket number, passenger name, phone or stops..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-background-300 bg-white text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <i className="ri-loader-4-line animate-spin text-4xl text-primary-500"></i>
                    <span className="ml-2 text-foreground-500">Loading tickets...</span>
                </div>
            )}

            {/* Table */}
            {!loading && (
                <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-background-100 bg-background-50/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Ticket No</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Passenger</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">From → To</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Seat</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Fare</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Payment</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Travel Date</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredTickets.map((ticket) => (
                                <tr key={ticket.ticket_id} className="border-b border-background-50 hover:bg-background-50/50 transition-colors">
                                    <td className="px-4 py-3 text-foreground-900 font-mono font-semibold text-[10px] whitespace-nowrap">{ticket.ticket_number}</td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className="font-medium text-foreground-800">{ticket.passenger_name}</div>
                                            <div className="text-xs text-foreground-400">{ticket.passenger_phone}</div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap text-xs">{ticket.from_stop_name} → {ticket.to_stop_name}</td>
                                    <td className="px-4 py-3 text-foreground-900 font-mono font-semibold text-xs whitespace-nowrap">{ticket.seat_number}</td>
                                    <td className="px-4 py-3 text-foreground-800 font-semibold whitespace-nowrap">
                                        LKR {Number(ticket.fare_amount).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <i className={`${paymentMethodIcon[ticket.payment_method]} text-foreground-400 text-xs`}></i>
                                            <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${paymentStatusBadge[ticket.payment_status]}`}>
                                                    {ticket.payment_status}
                                                </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${bookingStatusBadge[ticket.booking_status]}`}>
                                                {ticket.booking_status}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 text-foreground-600 whitespace-nowrap text-xs">{ticket.travel_date}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => openViewModal(ticket)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-accent-600 hover:bg-accent-50 transition-colors cursor-pointer">
                                                <i className="ri-eye-line text-sm"></i>
                                            </button>
                                            {ticket.booking_status === 'confirmed' && (
                                                <button onClick={() => openCancelModal(ticket)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                                                    <i className="ri-close-circle-line text-sm"></i>
                                                </button>
                                            )}
                                            {ticket.booking_status === 'confirmed' && (
                                                <button onClick={() => markAsUsed(ticket.ticket_id)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer">
                                                    <i className="ri-checkbox-circle-line text-sm"></i>
                                                </button>
                                            )}
                                            {isRefundable(ticket) && (
                                                <button onClick={() => openRefundModal(ticket)} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer">
                                                    <i className="ri-refund-2-line text-sm"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTickets.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-5 py-12 text-center text-foreground-400">No tickets found</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Book Ticket Modal */}
            {modalMode === 'book' && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative z-10 w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-background-200 animate-scale-in mx-4">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-background-200">
                            <h2 className="text-lg font-semibold text-foreground-900 font-heading">Book New Ticket</h2>
                            <button onClick={closeModal} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:bg-background-100 transition-colors cursor-pointer">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                            {/* Schedule Selection */}
                            <div>
                                <label className="block text-xs font-semibold text-foreground-500 mb-1">Select Schedule *</label>
                                {schedulesLoading ? (
                                    <div className="flex items-center gap-2 text-foreground-500">
                                        <i className="ri-loader-4-line animate-spin"></i>
                                        <span className="text-sm">Loading schedules...</span>
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            value={form.schedule_id}
                                            onChange={(e) => handleScheduleSelect(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                            required
                                        >
                                            <option value="">Select schedule...</option>
                                            {activeSchedules.map((s) => (
                                                <option key={s.schedule_id} value={s.schedule_id}>
                                                    {s.schedule_code} - {s.route_name || `Route ${s.route_id}`} - {s.departure_time ? new Date(s.departure_time).toLocaleString() : 'Date TBD'}
                                                </option>
                                            ))}
                                        </select>
                                        {activeSchedules.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1">
                                                No active schedules available. Please create a schedule first.
                                            </p>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Passenger Information */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-user-line text-primary-500"></i>
                                    Passenger Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Full Name *</label>
                                        <input
                                            type="text"
                                            value={form.passenger_name}
                                            onChange={(e) => setForm({ ...form, passenger_name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">NIC Number</label>
                                        <input
                                            type="text"
                                            value={form.passenger_nic}
                                            onChange={(e) => setForm({ ...form, passenger_nic: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Phone Number *</label>
                                        <input
                                            type="tel"
                                            value={form.passenger_phone}
                                            onChange={(e) => setForm({ ...form, passenger_phone: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Seat Number *</label>
                                        <input
                                            type="text"
                                            value={form.seat_number}
                                            onChange={(e) => setForm({ ...form, seat_number: e.target.value })}
                                            placeholder="e.g., A12, B05"
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Journey Details */}
                            {routeStops.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                        <i className="ri-map-pin-line text-primary-500"></i>
                                        Journey Details
                                    </h3>
                                    <div className="p-4 rounded-xl bg-background-50 border border-background-200">
                                        <p className="text-xs font-medium text-foreground-500 mb-3">
                                            Route: {selectedRoute?.route_name} ({selectedRoute?.route_code})
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[11px] font-semibold text-foreground-400 mb-1">From Stop *</label>
                                                <select
                                                    value={form.from_stop_id}
                                                    onChange={(e) => calculateFare(Number(e.target.value), form.to_stop_id)}
                                                    className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                                >
                                                    <option value="">Select boarding stop...</option>
                                                    {availableFromStops.map((s) => (
                                                        <option key={s.stop_id} value={s.stop_id}>
                                                            {s.stop_name} (Stop #{s.stop_order})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-semibold text-foreground-400 mb-1">To Stop *</label>
                                                <select
                                                    value={form.to_stop_id}
                                                    onChange={(e) => calculateFare(form.from_stop_id, Number(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                                    disabled={!form.from_stop_id}
                                                >
                                                    <option value="">Select destination...</option>
                                                    {availableToStops.map((s) => (
                                                        <option key={s.stop_id} value={s.stop_id}>
                                                            {s.stop_name} (Stop #{s.stop_order})
                                                        </option>
                                                    ))}
                                                </select>
                                                {!form.from_stop_id && (
                                                    <p className="text-xs text-amber-600 mt-1">Please select departure stop first</p>
                                                )}
                                                {form.from_stop_id && availableToStops.length === 0 && (
                                                    <p className="text-xs text-red-600 mt-1">No stops available after selected departure stop</p>
                                                )}
                                            </div>
                                        </div>
                                        {form.fare_amount > 0 && (
                                            <div className="mt-3 pt-3 border-t border-background-200 flex items-center justify-between">
                                                <span className="text-sm text-foreground-600">Ticket Fare</span>
                                                <span className="text-lg font-bold text-primary-600 font-heading">LKR {form.fare_amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Payment Details */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground-700 mb-3 flex items-center gap-2">
                                    <i className="ri-bank-card-line text-primary-500"></i>
                                    Payment Details
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Payment Method *</label>
                                        <select
                                            value={form.payment_method}
                                            onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="card">Card</option>
                                            <option value="mobile_payment">Mobile Payment</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-foreground-500 mb-1">Payment Reference</label>
                                        <input
                                            type="text"
                                            value={form.payment_reference}
                                            onChange={(e) => setForm({ ...form, payment_reference: e.target.value })}
                                            placeholder="Transaction ID / Reference No"
                                            className="w-full px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 focus:outline-none focus:border-primary-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-background-200">
                            <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer whitespace-nowrap">
                                Cancel
                            </button>
                            <button
                                onClick={handleBook}
                                disabled={
                                    !form.schedule_id ||
                                    !form.passenger_name ||
                                    !form.passenger_phone ||
                                    !form.seat_number ||
                                    !form.from_stop_id ||
                                    !form.to_stop_id ||
                                    form.fare_amount <= 0 ||
                                    bookingLoading ||
                                    activeSchedules.length === 0
                                }
                                className="px-5 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {bookingLoading ? 'Processing...' : `Confirm Booking (LKR ${form.fare_amount.toFixed(2)})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Ticket Modal */}
            {modalMode === 'view' && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-background-200 p-6 animate-scale-in mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground-900 font-heading">Ticket Details</h2>
                            <button onClick={closeModal} className="w-8 h-8 rounded-md flex items-center justify-center text-foreground-400 hover:bg-background-100 transition-colors cursor-pointer">
                                <i className="ri-close-line"></i>
                            </button>
                        </div>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Ticket No</span>
                                <span className="font-mono font-semibold text-foreground-900">{selectedTicket.ticket_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Booking Date</span>
                                <span className="text-foreground-600">{new Date(selectedTicket.booking_date).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-background-100 my-2"></div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Passenger</span>
                                <span className="font-medium text-foreground-900">{selectedTicket.passenger_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">NIC</span>
                                <span className="text-foreground-600">{selectedTicket.passenger_nic || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Phone</span>
                                <span className="text-foreground-600">{selectedTicket.passenger_phone}</span>
                            </div>
                            <div className="border-t border-background-100 my-2"></div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Journey</span>
                                <span className="text-foreground-600">{selectedTicket.from_stop_name} → {selectedTicket.to_stop_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Seat</span>
                                <span className="font-mono font-semibold text-foreground-900">{selectedTicket.seat_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Travel Date</span>
                                <span className="text-foreground-600">{selectedTicket.travel_date}</span>
                            </div>
                            <div className="border-t border-background-100 my-2"></div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Fare</span>
                                <span className="font-bold text-primary-600">
                                    LKR {Number(selectedTicket.fare_amount).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Payment</span>
                                <span className="capitalize text-foreground-600">{selectedTicket.payment_method} / {selectedTicket.payment_status}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-foreground-400">Status</span>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${bookingStatusBadge[selectedTicket.booking_status]}`}>
                                    {selectedTicket.booking_status}
                                </span>
                            </div>
                            {selectedTicket.cancellation_reason && (
                                <div className="flex justify-between">
                                    <span className="text-foreground-400">Cancel Reason</span>
                                    <span className="text-red-600 text-xs max-w-[200px] text-right">{selectedTicket.cancellation_reason}</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 pt-4 border-t border-background-200">
                            <button onClick={closeModal} className="w-full px-4 py-2 rounded-lg bg-background-100 hover:bg-background-200 text-foreground-700 text-sm font-medium transition-colors cursor-pointer">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Ticket Modal */}
            {modalMode === 'cancel' && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-background-200 p-6 animate-scale-in mx-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <i className="ri-close-circle-line text-red-500 text-xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground-900 text-center font-heading">Cancel Ticket?</h3>
                        <p className="text-sm text-foreground-500 text-center mt-2">
                            {selectedTicket.ticket_number} — {selectedTicket.passenger_name}
                        </p>
                        <p className="text-xs text-foreground-400 text-center mt-1">
                            Fare: LKR {Number(selectedTicket.fare_amount).toFixed(2)}
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Cancellation reason (optional)..."
                            rows={3}
                            maxLength={500}
                            className="w-full mt-4 px-3 py-2 rounded-lg border border-background-300 text-sm text-foreground-900 placeholder:text-foreground-300 focus:outline-none focus:border-red-400 resize-none"
                        />
                        <div className="flex items-center gap-3 mt-4">
                            <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-lg border border-background-300 text-sm font-medium text-foreground-600 hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap">
                                Back
                            </button>
                            <button onClick={handleCancel} className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap">
                                Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {modalMode === 'refund' && selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
                    <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-background-200 p-6 animate-scale-in mx-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                            <i className="ri-refund-2-line text-amber-500 text-xl"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground-900 text-center font-heading">Process Refund?</h3>
                        <p className="text-sm text-foreground-500 text-center mt-2">
                            Refund <strong>LKR {Number(selectedTicket.fare_amount).toFixed(2)}</strong> for ticket {selectedTicket.ticket_number}?
                        </p>
                        <p className="text-xs text-foreground-400 text-center mt-1">
                            Payment will be returned via {selectedTicket.payment_method.replace('_', ' ')}
                        </p>
                        <div className="flex items-center gap-3 mt-6">
                            <button onClick={closeModal} className="flex-1 px-4 py-2.5 rounded-lg border border-background-300 text-sm font-medium text-foreground-600 hover:bg-background-50 transition-colors cursor-pointer whitespace-nowrap">
                                Cancel
                            </button>
                            <button onClick={handleRefund} className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap">
                                Refund LKR {Number(selectedTicket.fare_amount).toFixed(2)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}