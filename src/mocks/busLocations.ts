export interface BusLocation {
  id: number;
  bus_id: number;
  bus_reg: string;
  route_id: number;
  route_name: string;
  schedule_id: number;
  driver_name: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: 'active' | 'stopped' | 'offline';
  next_stop_name: string;
  estimated_arrival_to_next: string;
  distance_traveled: number;
  elapsed_time: string;
  last_updated: string;
}

export const busLocations: BusLocation[] = [
  {
    id: 1, bus_id: 1, bus_reg: 'BUS-4501', route_id: 1, route_name: 'SR-001 Express Downtown',
    schedule_id: 1, driver_name: 'Ahmed Khan',
    latitude: 33.6980, longitude: 73.0525, speed: 42, heading: 145,
    status: 'active', next_stop_name: 'Tech Park',
    estimated_arrival_to_next: '8 min', distance_traveled: 8.5, elapsed_time: '18 min',
    last_updated: '2026-06-04 06:48',
  },
  {
    id: 2, bus_id: 2, bus_reg: 'BUS-2308', route_id: 2, route_name: 'SR-002 City Loop',
    schedule_id: 2, driver_name: 'Mohammed Ali',
    latitude: 33.6580, longitude: 73.0380, speed: 35, heading: 270,
    status: 'active', next_stop_name: 'Industrial Zone',
    estimated_arrival_to_next: '14 min', distance_traveled: 12.5, elapsed_time: '28 min',
    last_updated: '2026-06-04 07:28',
  },
  {
    id: 3, bus_id: 3, bus_reg: 'BUS-7802', route_id: 3, route_name: 'SR-003 Airport Shuttle',
    schedule_id: 3, driver_name: 'Usman Riaz',
    latitude: 33.6200, longitude: 73.0300, speed: 0, heading: 180,
    status: 'stopped', next_stop_name: 'International Airport',
    estimated_arrival_to_next: '20 min', distance_traveled: 20.0, elapsed_time: '35 min',
    last_updated: '2026-06-04 07:50',
  },
  {
    id: 4, bus_id: 4, bus_reg: 'BUS-1205', route_id: 4, route_name: 'SR-004 University Route',
    schedule_id: 4, driver_name: 'Bilal Hassan',
    latitude: 33.6540, longitude: 73.0220, speed: 28, heading: 45,
    status: 'active', next_stop_name: 'Main Campus',
    estimated_arrival_to_next: '8 min', distance_traveled: 8.0, elapsed_time: '18 min',
    last_updated: '2026-06-04 08:03',
  },
  {
    id: 5, bus_id: 6, bus_reg: 'BUS-3409', route_id: 6, route_name: 'SR-006 Suburban Express',
    schedule_id: 6, driver_name: 'Rashid Iqbal',
    latitude: 33.6844, longitude: 73.0479, speed: 0, heading: 0,
    status: 'offline', next_stop_name: 'City Center',
    estimated_arrival_to_next: '—', distance_traveled: 28.0, elapsed_time: '50 min',
    last_updated: '2026-06-04 09:10',
  },
  {
    id: 6, bus_id: 8, bus_reg: 'BUS-6704', route_id: 7, route_name: 'SR-007 Harbor Link',
    schedule_id: 7, driver_name: 'Farhan Saeed',
    latitude: 33.6000, longitude: 73.1000, speed: 0, heading: 0,
    status: 'stopped', next_stop_name: 'Customs Office',
    estimated_arrival_to_next: '10 min', distance_traveled: 0, elapsed_time: '0 min',
    last_updated: '2026-06-04 09:00',
  },
  {
    id: 7, bus_id: 5, bus_reg: 'BUS-5601', route_id: 5, route_name: 'SR-005 Industrial Zone Express',
    schedule_id: 5, driver_name: 'Zubair Nasir',
    latitude: 33.6340, longitude: 73.0550, speed: 0, heading: 0,
    status: 'stopped', next_stop_name: 'Old Factory Road',
    estimated_arrival_to_next: '12 min', distance_traveled: 0, elapsed_time: '0 min',
    last_updated: '2026-06-04 08:00',
  },
];