import type { DriverUser, Route } from '../types';

export const ROUTES: Route[] = [
    {
        id: 1, route_code: 'SR-001', route_name: 'Express Downtown',
        start_location: 'Central Station', end_location: 'Downtown Hub',
        total_distance: 18.5, estimated_duration: 45,
        stops: [
            { id: 101, stop_name: 'Central Station',  stop_order: 1, distance_from_start: 0,    estimated_arrival_time: '0 min',  waiting_time: 0, fare_to_next: 0.50, latitude: 33.6844, longitude: 73.0479 },
            { id: 102, stop_name: 'Mall Road',         stop_order: 2, distance_from_start: 4.2,  estimated_arrival_time: '10 min', waiting_time: 2, fare_to_next: 0.30, latitude: 33.6912, longitude: 73.0502 },
            { id: 103, stop_name: 'City Hospital',     stop_order: 3, distance_from_start: 8.5,  estimated_arrival_time: '18 min', waiting_time: 3, fare_to_next: 0.40, latitude: 33.6980, longitude: 73.0525 },
            { id: 104, stop_name: 'Tech Park',         stop_order: 4, distance_from_start: 13.0, estimated_arrival_time: '28 min', waiting_time: 2, fare_to_next: 0.35, latitude: 33.7035, longitude: 73.0538 },
            { id: 105, stop_name: 'Downtown Hub',      stop_order: 5, distance_from_start: 18.5, estimated_arrival_time: '38 min', waiting_time: 0, fare_to_next: 0,    latitude: 33.7098, longitude: 73.0552 },
        ],
    },
    {
        id: 2, route_code: 'SR-002', route_name: 'City Loop',
        start_location: 'Green Park Terminal', end_location: 'Green Park Terminal',
        total_distance: 25.0, estimated_duration: 60,
        stops: [
            { id: 201, stop_name: 'Green Park Terminal', stop_order: 1, distance_from_start: 0,    estimated_arrival_time: '0 min',  waiting_time: 0, fare_to_next: 0.60, latitude: 33.6520, longitude: 73.0200 },
            { id: 202, stop_name: 'University Gate',     stop_order: 2, distance_from_start: 6.0,  estimated_arrival_time: '14 min', waiting_time: 3, fare_to_next: 0.50, latitude: 33.6610, longitude: 73.0280 },
            { id: 203, stop_name: 'Market Square',       stop_order: 3, distance_from_start: 12.5, estimated_arrival_time: '28 min', waiting_time: 2, fare_to_next: 0.40, latitude: 33.6580, longitude: 73.0380 },
            { id: 204, stop_name: 'Industrial Zone',     stop_order: 4, distance_from_start: 19.0, estimated_arrival_time: '42 min', waiting_time: 2, fare_to_next: 0.50, latitude: 33.6480, longitude: 73.0320 },
            { id: 205, stop_name: 'Green Park Terminal', stop_order: 5, distance_from_start: 25.0, estimated_arrival_time: '56 min', waiting_time: 0, fare_to_next: 0,    latitude: 33.6520, longitude: 73.0200 },
        ],
    },
    {
        id: 3, route_code: 'SR-003', route_name: 'Airport Shuttle',
        start_location: 'City Center', end_location: 'International Airport',
        total_distance: 35.0, estimated_duration: 75,
        stops: [
            { id: 301, stop_name: 'City Center',           stop_order: 1, distance_from_start: 0,    estimated_arrival_time: '0 min',  waiting_time: 0, fare_to_next: 1.50, latitude: 33.6844, longitude: 73.0479 },
            { id: 302, stop_name: 'Gulshan Colony',        stop_order: 2, distance_from_start: 8.0,  estimated_arrival_time: '16 min', waiting_time: 2, fare_to_next: 1.50, latitude: 33.6700, longitude: 73.0400 },
            { id: 303, stop_name: 'Motorway Interchange',  stop_order: 3, distance_from_start: 20.0, estimated_arrival_time: '35 min', waiting_time: 5, fare_to_next: 1.80, latitude: 33.6200, longitude: 73.0300 },
            { id: 304, stop_name: 'International Airport', stop_order: 4, distance_from_start: 35.0, estimated_arrival_time: '65 min', waiting_time: 0, fare_to_next: 0,    latitude: 33.5607, longitude: 73.0230 },
        ],
    },
    {
        id: 4, route_code: 'SR-004', route_name: 'University Route',
        start_location: 'Student Housing', end_location: 'Main Campus',
        total_distance: 12.0, estimated_duration: 30,
        stops: [
            { id: 401, stop_name: 'Student Housing', stop_order: 1, distance_from_start: 0,    estimated_arrival_time: '0 min',  waiting_time: 0, fare_to_next: 0.40, latitude: 33.6400, longitude: 73.0100 },
            { id: 402, stop_name: 'Library Junction',stop_order: 2, distance_from_start: 4.5,  estimated_arrival_time: '10 min', waiting_time: 2, fare_to_next: 0.30, latitude: 33.6480, longitude: 73.0160 },
            { id: 403, stop_name: 'Sports Complex',  stop_order: 3, distance_from_start: 8.0,  estimated_arrival_time: '18 min', waiting_time: 1, fare_to_next: 0.30, latitude: 33.6540, longitude: 73.0220 },
            { id: 404, stop_name: 'Main Campus',     stop_order: 4, distance_from_start: 12.0, estimated_arrival_time: '26 min', waiting_time: 0, fare_to_next: 0,    latitude: 33.6610, longitude: 73.0280 },
        ],
    },
    {
        id: 5, route_code: 'SR-005', route_name: 'Industrial Zone Express',
        start_location: 'Labour Colony', end_location: 'Industrial Area Gate 3',
        total_distance: 22.0, estimated_duration: 50,
        stops: [
            { id: 501, stop_name: 'Labour Colony',          stop_order: 1, distance_from_start: 0,    estimated_arrival_time: '0 min',  waiting_time: 0, fare_to_next: 0.25, latitude: 33.6340, longitude: 73.0550 },
            { id: 502, stop_name: 'Old Factory Road',       stop_order: 2, distance_from_start: 5.5,  estimated_arrival_time: '12 min', waiting_time: 3, fare_to_next: 0.30, latitude: 33.6390, longitude: 73.0620 },
            { id: 503, stop_name: 'Warehouse District',     stop_order: 3, distance_from_start: 11.0, estimated_arrival_time: '24 min', waiting_time: 2, fare_to_next: 0.35, latitude: 33.6430, longitude: 73.0700 },
            { id: 504, stop_name: 'Industrial Area Gate 3', stop_order: 4, distance_from_start: 22.0, estimated_arrival_time: '45 min', waiting_time: 0, fare_to_next: 0,    latitude: 33.6480, longitude: 73.0780 },
        ],
    },
    {
        id: 6, route_code: 'SR-006', route_name: 'Suburban Express',
        start_location: 'Suburb Terminal', end_location: 'City Center',
        total_distance: 28.0, estimated_duration: 55,
        stops: [
            { id: 601, stop_name: 'Suburb Terminal',    stop_order: 1, distance_from_start: 0,    estimated_arrival_time: '0 min',  waiting_time: 0, fare_to_next: 1.00, latitude: 33.7200, longitude: 73.0100 },
            { id: 602, stop_name: 'Highway Rest Area',  stop_order: 2, distance_from_start: 10.0, estimated_arrival_time: '18 min', waiting_time: 5, fare_to_next: 0.80, latitude: 33.7080, longitude: 73.0250 },
            { id: 603, stop_name: 'Ring Road Junction', stop_order: 3, distance_from_start: 19.0, estimated_arrival_time: '35 min', waiting_time: 2, fare_to_next: 1.00, latitude: 33.6950, longitude: 73.0380 },
            { id: 604, stop_name: 'City Center',        stop_order: 4, distance_from_start: 28.0, estimated_arrival_time: '50 min', waiting_time: 0, fare_to_next: 0,    latitude: 33.6844, longitude: 73.0479 },
        ],
    },
];

export const MOCK_DRIVERS: { driverCode: string; pin: string; user: DriverUser }[] = [
    { driverCode: 'DRV-089', pin: '1234', user: { id: 1, driver_code: 'DRV-089', name: 'Ahmed Khan',    busId: 1, busReg: 'BUS-4501', routeId: 1, routeName: 'SR-001 Express Downtown',      scheduleId: 1 } },
    { driverCode: 'DRV-112', pin: '1234', user: { id: 2, driver_code: 'DRV-112', name: 'Mohammed Ali',  busId: 2, busReg: 'BUS-2308', routeId: 2, routeName: 'SR-002 City Loop',             scheduleId: 2 } },
    { driverCode: 'DRV-134', pin: '1234', user: { id: 3, driver_code: 'DRV-134', name: 'Rashid Iqbal',  busId: 6, busReg: 'BUS-3409', routeId: 6, routeName: 'SR-006 Suburban Express',      scheduleId: 6 } },
    { driverCode: 'DRV-178', pin: '1234', user: { id: 4, driver_code: 'DRV-178', name: 'Usman Riaz',    busId: 3, busReg: 'BUS-7802', routeId: 3, routeName: 'SR-003 Airport Shuttle',       scheduleId: 3 } },
    { driverCode: 'DRV-201', pin: '1234', user: { id: 5, driver_code: 'DRV-201', name: 'Bilal Hassan',  busId: 4, busReg: 'BUS-1205', routeId: 4, routeName: 'SR-004 University Route',      scheduleId: 4 } },
    { driverCode: 'DRV-356', pin: '1234', user: { id: 10,driver_code: 'DRV-356', name: 'Zubair Nasir',  busId: 5, busReg: 'BUS-5601', routeId: 5, routeName: 'SR-005 Industrial Zone Express',scheduleId: 5 } },
];

export const driverLogin = (driverCode: string): DriverUser | null => {
    const found = MOCK_DRIVERS.find(
        (a) => a.driverCode.toLowerCase() === driverCode.trim().toLowerCase()
    );
    return found ? found.user : null;
};

export const getRoute = (routeId: number): Route | null =>
    ROUTES.find((r) => r.id === routeId) ?? null;
