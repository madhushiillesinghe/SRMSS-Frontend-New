export interface Ticket {
  id: number;
  ticket_no: string;
  schedule_id: number;
  schedule_label: string;
  route_name: string;
  passenger_name: string;
  passenger_nic: string;
  passenger_phone: string;
  seat_number: string;
  from_stop: string;
  to_stop: string;
  fare_amount: number;
  travel_date: string;
  payment_method: 'cash' | 'card' | 'mobile_payment';
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_reference: string;
  booking_status: 'confirmed' | 'cancelled' | 'refunded';
  cancellation_reason: string;
  cancelled_at: string;
}

export const ticketsList: Ticket[] = [
  {
    id: 1, ticket_no: 'TKT-20260604-001', schedule_id: 1,
    schedule_label: 'SCH-001 / 06:30', route_name: 'SR-001 Express Downtown',
    passenger_name: 'Sara Ahmed', passenger_nic: '35202-1111111-2', passenger_phone: '+92-311-1111111',
    seat_number: 'A12', from_stop: 'Central Station', to_stop: 'Downtown Hub',
    fare_amount: 2.50, travel_date: '2026-06-04',
    payment_method: 'mobile_payment', payment_status: 'paid', payment_reference: 'MP-20260604-A1B2',
    booking_status: 'confirmed', cancellation_reason: '', cancelled_at: '',
  },
  {
    id: 2, ticket_no: 'TKT-20260604-002', schedule_id: 1,
    schedule_label: 'SCH-001 / 06:30', route_name: 'SR-001 Express Downtown',
    passenger_name: 'Ali Raza', passenger_nic: '35202-2222222-3', passenger_phone: '+92-312-2222222',
    seat_number: 'A14', from_stop: 'Mall Road', to_stop: 'Tech Park',
    fare_amount: 0.70, travel_date: '2026-06-04',
    payment_method: 'cash', payment_status: 'paid', payment_reference: 'CASH-001',
    booking_status: 'confirmed', cancellation_reason: '', cancelled_at: '',
  },
  {
    id: 3, ticket_no: 'TKT-20260604-003', schedule_id: 3,
    schedule_label: 'SCH-003 / 07:15', route_name: 'SR-003 Airport Shuttle',
    passenger_name: 'John Smith', passenger_nic: '35202-3333333-4', passenger_phone: '+92-313-3333333',
    seat_number: 'B03', from_stop: 'City Center', to_stop: 'International Airport',
    fare_amount: 5.00, travel_date: '2026-06-04',
    payment_method: 'card', payment_status: 'paid', payment_reference: 'CARD-20260604-C3D4',
    booking_status: 'confirmed', cancellation_reason: '', cancelled_at: '',
  },
  {
    id: 4, ticket_no: 'TKT-20260604-004', schedule_id: 6,
    schedule_label: 'SCH-006 / 08:20', route_name: 'SR-006 Suburban Express',
    passenger_name: 'Fatima Noor', passenger_nic: '35202-4444444-5', passenger_phone: '+92-314-4444444',
    seat_number: 'C05', from_stop: 'Suburb Terminal', to_stop: 'City Center',
    fare_amount: 3.50, travel_date: '2026-06-04',
    payment_method: 'mobile_payment', payment_status: 'paid', payment_reference: 'MP-20260604-E5F6',
    booking_status: 'confirmed', cancellation_reason: '', cancelled_at: '',
  },
  {
    id: 5, ticket_no: 'TKT-20260604-005', schedule_id: 4,
    schedule_label: 'SCH-004 / 07:45', route_name: 'SR-004 University Route',
    passenger_name: 'Hassan Ali', passenger_nic: '35202-5555555-6', passenger_phone: '+92-315-5555555',
    seat_number: 'D08', from_stop: 'Student Housing', to_stop: 'Main Campus',
    fare_amount: 1.50, travel_date: '2026-06-04',
    payment_method: 'cash', payment_status: 'paid', payment_reference: 'CASH-002',
    booking_status: 'confirmed', cancellation_reason: '', cancelled_at: '',
  },
  {
    id: 6, ticket_no: 'TKT-20260604-006', schedule_id: 1,
    schedule_label: 'SCH-001 / 06:30', route_name: 'SR-001 Express Downtown',
    passenger_name: 'Zainab Khalid', passenger_nic: '35202-6666666-7', passenger_phone: '+92-316-6666666',
    seat_number: 'B07', from_stop: 'City Hospital', to_stop: 'Downtown Hub',
    fare_amount: 0.75, travel_date: '2026-06-04',
    payment_method: 'mobile_payment', payment_status: 'pending', payment_reference: '',
    booking_status: 'confirmed', cancellation_reason: '', cancelled_at: '',
  },
  {
    id: 7, ticket_no: 'TKT-20260603-007', schedule_id: 11,
    schedule_label: 'SCH-011 / 08:20', route_name: 'SR-006 Suburban Express',
    passenger_name: 'Omar Farooq', passenger_nic: '35202-7777777-8', passenger_phone: '+92-317-7777777',
    seat_number: 'A01', from_stop: 'Suburb Terminal', to_stop: 'Highway Rest Area',
    fare_amount: 1.00, travel_date: '2026-06-03',
    payment_method: 'card', payment_status: 'refunded', payment_reference: 'CARD-20260603-G7H8',
    booking_status: 'refunded', cancellation_reason: 'Change of plans — rescheduled for next day', cancelled_at: '2026-06-02 14:30',
  },
  {
    id: 8, ticket_no: 'TKT-20260604-008', schedule_id: 3,
    schedule_label: 'SCH-003 / 07:15', route_name: 'SR-003 Airport Shuttle',
    passenger_name: 'Nadia Hussain', passenger_nic: '35202-8888888-9', passenger_phone: '+92-318-8888888',
    seat_number: 'B11', from_stop: 'Gulshan Colony', to_stop: 'International Airport',
    fare_amount: 3.30, travel_date: '2026-06-04',
    payment_method: 'mobile_payment', payment_status: 'paid', payment_reference: 'MP-20260604-I9J0',
    booking_status: 'cancelled', cancellation_reason: 'Flight rescheduled to tomorrow', cancelled_at: '2026-06-04 06:00',
  },
  {
    id: 9, ticket_no: 'TKT-20260604-009', schedule_id: 2,
    schedule_label: 'SCH-002 / 07:00', route_name: 'SR-002 City Loop',
    passenger_name: 'Kamran Tariq', passenger_nic: '35202-9999999-0', passenger_phone: '+92-319-9999999',
    seat_number: 'C12', from_stop: 'Green Park Terminal', to_stop: 'Market Square',
    fare_amount: 1.10, travel_date: '2026-06-04',
    payment_method: 'cash', payment_status: 'paid', payment_reference: 'CASH-003',
    booking_status: 'confirmed', cancellation_reason: '', cancelled_at: '',
  },
  {
    id: 10, ticket_no: 'TKT-20260605-010', schedule_id: 8,
    schedule_label: 'SCH-008 / 10:00', route_name: 'SR-001 Express Downtown',
    passenger_name: 'Amina Sheikh', passenger_nic: '35202-0000000-1', passenger_phone: '+92-310-0000000',
    seat_number: 'A05', from_stop: 'Central Station', to_stop: 'Tech Park',
    fare_amount: 1.10, travel_date: '2026-06-05',
    payment_method: 'card', payment_status: 'pending', payment_reference: '',
    booking_status: 'confirmed', cancellation_reason: '', cancelled_at: '',
  },
];