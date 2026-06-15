export interface RouteStop {
  id: number;
  stop_name: string;
  stop_order: number;
  distance_from_start: number;
  estimated_arrival_time: string;
  waiting_time: number;
  fare_to_next: number;
  latitude: number;
  longitude: number;
}

export interface Route {
  id: number;
  route_code: string;
  route_name: string;
  start_location: string;
  end_location: string;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number;
  end_longitude: number;
  total_distance: number;
  estimated_duration: number;
  base_fare: number;
  fare_per_km: number;
  status: 'active' | 'inactive' | 'suspended';
  description: string;
  stops: RouteStop[];
}

export const routesList: Route[] = [
  {
    id: 1,
    route_code: 'SR-001',
    route_name: 'Express Downtown',
    start_location: 'Central Station',
    end_location: 'Downtown Hub',
    start_latitude: 33.6844,
    start_longitude: 73.0479,
    end_latitude: 33.7098,
    end_longitude: 73.0552,
    total_distance: 18.5,
    estimated_duration: 45,
    base_fare: 2.50,
    fare_per_km: 0.15,
    status: 'active',
    description: 'Main express route connecting Central Station to Downtown Hub through the city center.',
    stops: [
      { id: 101, stop_name: 'Central Station', stop_order: 1, distance_from_start: 0, estimated_arrival_time: '0 min', waiting_time: 0, fare_to_next: 0.50, latitude: 33.6844, longitude: 73.0479 },
      { id: 102, stop_name: 'Mall Road', stop_order: 2, distance_from_start: 4.2, estimated_arrival_time: '10 min', waiting_time: 2, fare_to_next: 0.30, latitude: 33.6912, longitude: 73.0502 },
      { id: 103, stop_name: 'City Hospital', stop_order: 3, distance_from_start: 8.5, estimated_arrival_time: '18 min', waiting_time: 3, fare_to_next: 0.40, latitude: 33.6980, longitude: 73.0525 },
      { id: 104, stop_name: 'Tech Park', stop_order: 4, distance_from_start: 13.0, estimated_arrival_time: '28 min', waiting_time: 2, fare_to_next: 0.35, latitude: 33.7035, longitude: 73.0538 },
      { id: 105, stop_name: 'Downtown Hub', stop_order: 5, distance_from_start: 18.5, estimated_arrival_time: '38 min', waiting_time: 0, fare_to_next: 0, latitude: 33.7098, longitude: 73.0552 },
    ],
  },
  {
    id: 2,
    route_code: 'SR-002',
    route_name: 'City Loop',
    start_location: 'Green Park Terminal',
    end_location: 'Green Park Terminal',
    start_latitude: 33.6520,
    start_longitude: 73.0200,
    end_latitude: 33.6520,
    end_longitude: 73.0200,
    total_distance: 25.0,
    estimated_duration: 60,
    base_fare: 3.00,
    fare_per_km: 0.12,
    status: 'active',
    description: 'Circular route covering major residential and commercial areas of the city.',
    stops: [
      { id: 201, stop_name: 'Green Park Terminal', stop_order: 1, distance_from_start: 0, estimated_arrival_time: '0 min', waiting_time: 0, fare_to_next: 0.60, latitude: 33.6520, longitude: 73.0200 },
      { id: 202, stop_name: 'University Gate', stop_order: 2, distance_from_start: 6.0, estimated_arrival_time: '14 min', waiting_time: 3, fare_to_next: 0.50, latitude: 33.6610, longitude: 73.0280 },
      { id: 203, stop_name: 'Market Square', stop_order: 3, distance_from_start: 12.5, estimated_arrival_time: '28 min', waiting_time: 2, fare_to_next: 0.40, latitude: 33.6580, longitude: 73.0380 },
      { id: 204, stop_name: 'Industrial Zone', stop_order: 4, distance_from_start: 19.0, estimated_arrival_time: '42 min', waiting_time: 2, fare_to_next: 0.50, latitude: 33.6480, longitude: 73.0320 },
      { id: 205, stop_name: 'Green Park Terminal', stop_order: 5, distance_from_start: 25.0, estimated_arrival_time: '56 min', waiting_time: 0, fare_to_next: 0, latitude: 33.6520, longitude: 73.0200 },
    ],
  },
  {
    id: 3,
    route_code: 'SR-003',
    route_name: 'Airport Shuttle',
    start_location: 'City Center',
    end_location: 'International Airport',
    start_latitude: 33.6844,
    start_longitude: 73.0479,
    end_latitude: 33.5607,
    end_longitude: 73.0230,
    total_distance: 35.0,
    estimated_duration: 75,
    base_fare: 5.00,
    fare_per_km: 0.18,
    status: 'active',
    description: 'Dedicated airport shuttle service with luggage compartments and express lanes.',
    stops: [
      { id: 301, stop_name: 'City Center', stop_order: 1, distance_from_start: 0, estimated_arrival_time: '0 min', waiting_time: 0, fare_to_next: 1.50, latitude: 33.6844, longitude: 73.0479 },
      { id: 302, stop_name: 'Gulshan Colony', stop_order: 2, distance_from_start: 8.0, estimated_arrival_time: '16 min', waiting_time: 2, fare_to_next: 1.50, latitude: 33.6700, longitude: 73.0400 },
      { id: 303, stop_name: 'Motorway Interchange', stop_order: 3, distance_from_start: 20.0, estimated_arrival_time: '35 min', waiting_time: 5, fare_to_next: 1.80, latitude: 33.6200, longitude: 73.0300 },
      { id: 304, stop_name: 'International Airport', stop_order: 4, distance_from_start: 35.0, estimated_arrival_time: '65 min', waiting_time: 0, fare_to_next: 0, latitude: 33.5607, longitude: 73.0230 },
    ],
  },
  {
    id: 4,
    route_code: 'SR-004',
    route_name: 'University Route',
    start_location: 'Student Housing',
    end_location: 'Main Campus',
    start_latitude: 33.6400,
    start_longitude: 73.0100,
    end_latitude: 33.6610,
    end_longitude: 73.0280,
    total_distance: 12.0,
    estimated_duration: 30,
    base_fare: 1.50,
    fare_per_km: 0.12,
    status: 'active',
    description: 'Campus shuttle connecting student housing areas to the main university campus.',
    stops: [
      { id: 401, stop_name: 'Student Housing', stop_order: 1, distance_from_start: 0, estimated_arrival_time: '0 min', waiting_time: 0, fare_to_next: 0.40, latitude: 33.6400, longitude: 73.0100 },
      { id: 402, stop_name: 'Library Junction', stop_order: 2, distance_from_start: 4.5, estimated_arrival_time: '10 min', waiting_time: 2, fare_to_next: 0.30, latitude: 33.6480, longitude: 73.0160 },
      { id: 403, stop_name: 'Sports Complex', stop_order: 3, distance_from_start: 8.0, estimated_arrival_time: '18 min', waiting_time: 1, fare_to_next: 0.30, latitude: 33.6540, longitude: 73.0220 },
      { id: 404, stop_name: 'Main Campus', stop_order: 4, distance_from_start: 12.0, estimated_arrival_time: '26 min', waiting_time: 0, fare_to_next: 0, latitude: 33.6610, longitude: 73.0280 },
    ],
  },
  {
    id: 5,
    route_code: 'SR-005',
    route_name: 'Industrial Zone Express',
    start_location: 'Labour Colony',
    end_location: 'Industrial Area Gate 3',
    start_latitude: 33.6340,
    start_longitude: 73.0550,
    end_latitude: 33.6480,
    end_longitude: 73.0780,
    total_distance: 22.0,
    estimated_duration: 50,
    base_fare: 2.00,
    fare_per_km: 0.10,
    status: 'active',
    description: 'Worker transport route connecting labour colonies to the industrial zone.',
    stops: [
      { id: 501, stop_name: 'Labour Colony', stop_order: 1, distance_from_start: 0, estimated_arrival_time: '0 min', waiting_time: 0, fare_to_next: 0.25, latitude: 33.6340, longitude: 73.0550 },
      { id: 502, stop_name: 'Old Factory Road', stop_order: 2, distance_from_start: 5.5, estimated_arrival_time: '12 min', waiting_time: 3, fare_to_next: 0.30, latitude: 33.6390, longitude: 73.0620 },
      { id: 503, stop_name: 'Warehouse District', stop_order: 3, distance_from_start: 11.0, estimated_arrival_time: '24 min', waiting_time: 2, fare_to_next: 0.35, latitude: 33.6430, longitude: 73.0700 },
      { id: 504, stop_name: 'Industrial Area Gate 3', stop_order: 4, distance_from_start: 22.0, estimated_arrival_time: '45 min', waiting_time: 0, fare_to_next: 0, latitude: 33.6480, longitude: 73.0780 },
    ],
  },
  {
    id: 6,
    route_code: 'SR-006',
    route_name: 'Suburban Express',
    start_location: 'Suburb Terminal',
    end_location: 'City Center',
    start_latitude: 33.7200,
    start_longitude: 73.0100,
    end_latitude: 33.6844,
    end_longitude: 73.0479,
    total_distance: 28.0,
    estimated_duration: 55,
    base_fare: 3.50,
    fare_per_km: 0.14,
    status: 'active',
    description: 'Long-distance suburban commuter route with limited stops for faster transit.',
    stops: [
      { id: 601, stop_name: 'Suburb Terminal', stop_order: 1, distance_from_start: 0, estimated_arrival_time: '0 min', waiting_time: 0, fare_to_next: 1.00, latitude: 33.7200, longitude: 73.0100 },
      { id: 602, stop_name: 'Highway Rest Area', stop_order: 2, distance_from_start: 10.0, estimated_arrival_time: '18 min', waiting_time: 5, fare_to_next: 0.80, latitude: 33.7080, longitude: 73.0250 },
      { id: 603, stop_name: 'Ring Road Junction', stop_order: 3, distance_from_start: 19.0, estimated_arrival_time: '35 min', waiting_time: 2, fare_to_next: 1.00, latitude: 33.6950, longitude: 73.0380 },
      { id: 604, stop_name: 'City Center', stop_order: 4, distance_from_start: 28.0, estimated_arrival_time: '50 min', waiting_time: 0, fare_to_next: 0, latitude: 33.6844, longitude: 73.0479 },
    ],
  },
  {
    id: 7,
    route_code: 'SR-007',
    route_name: 'Harbor Link',
    start_location: 'Dry Port',
    end_location: 'Seaside Market',
    start_latitude: 33.6000,
    start_longitude: 73.1000,
    end_latitude: 33.5500,
    end_longitude: 73.0800,
    total_distance: 16.0,
    estimated_duration: 35,
    base_fare: 2.00,
    fare_per_km: 0.13,
    status: 'inactive',
    description: 'Connects the dry port logistics hub to the seaside commercial market area.',
    stops: [
      { id: 701, stop_name: 'Dry Port', stop_order: 1, distance_from_start: 0, estimated_arrival_time: '0 min', waiting_time: 0, fare_to_next: 0.50, latitude: 33.6000, longitude: 73.1000 },
      { id: 702, stop_name: 'Customs Office', stop_order: 2, distance_from_start: 5.0, estimated_arrival_time: '10 min', waiting_time: 3, fare_to_next: 0.50, latitude: 33.5850, longitude: 73.0920 },
      { id: 703, stop_name: 'Seaside Market', stop_order: 3, distance_from_start: 16.0, estimated_arrival_time: '30 min', waiting_time: 0, fare_to_next: 0, latitude: 33.5500, longitude: 73.0800 },
    ],
  },
  {
    id: 8,
    route_code: 'SR-008',
    route_name: 'Mall Circuit',
    start_location: 'Central Station',
    end_location: 'Grand Mall',
    start_latitude: 33.6844,
    start_longitude: 73.0479,
    end_latitude: 33.7000,
    end_longitude: 73.0600,
    total_distance: 10.0,
    estimated_duration: 25,
    base_fare: 1.00,
    fare_per_km: 0.10,
    status: 'suspended',
    description: 'Shopping district connector currently suspended due to road construction.',
    stops: [
      { id: 801, stop_name: 'Central Station', stop_order: 1, distance_from_start: 0, estimated_arrival_time: '0 min', waiting_time: 0, fare_to_next: 0.25, latitude: 33.6844, longitude: 73.0479 },
      { id: 802, stop_name: 'Fashion Street', stop_order: 2, distance_from_start: 3.5, estimated_arrival_time: '8 min', waiting_time: 2, fare_to_next: 0.25, latitude: 33.6910, longitude: 73.0520 },
      { id: 803, stop_name: 'Food Court Area', stop_order: 3, distance_from_start: 7.0, estimated_arrival_time: '16 min', waiting_time: 2, fare_to_next: 0.25, latitude: 33.6960, longitude: 73.0560 },
      { id: 804, stop_name: 'Grand Mall', stop_order: 4, distance_from_start: 10.0, estimated_arrival_time: '22 min', waiting_time: 0, fare_to_next: 0, latitude: 33.7000, longitude: 73.0600 },
    ],
  },
];