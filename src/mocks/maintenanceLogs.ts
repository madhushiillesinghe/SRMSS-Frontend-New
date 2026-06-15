export interface MaintenanceLog {
  id: number;
  bus_id: number;
  bus_reg: string;
  maintenance_date: string;
  maintenance_type: 'routine' | 'corrective' | 'emergency' | 'preventive';
  maintenance_category: 'engine' | 'brake' | 'tire' | 'electrical' | 'body' | 'AC' | 'other';
  description: string;
  odometer_at_service: number;
  cost: number;
  vendor_name: string;
  invoice_number: string;
  next_due_date: string;
  next_due_odometer: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  completed_by: string;
  remarks: string;
}

export const maintenanceLogs: MaintenanceLog[] = [
  { id: 1, bus_id: 1, bus_reg: 'BUS-4501', maintenance_date: '2026-05-04', maintenance_type: 'routine', maintenance_category: 'engine', description: 'Oil change + filter replacement', odometer_at_service: 124500, cost: 450, vendor_name: 'AutoCare Workshop G-8', invoice_number: 'INV-20260504-001', next_due_date: '2026-06-04', next_due_odometer: 134500, status: 'completed', completed_by: 'Mechanic Rafiq', remarks: 'All filters replaced. Engine running smooth.' },
  { id: 2, bus_id: 2, bus_reg: 'BUS-2308', maintenance_date: '2026-04-28', maintenance_type: 'corrective', maintenance_category: 'engine', description: 'Engine diagnostics — misfire detected in cylinder 3', odometer_at_service: 97500, cost: 1250, vendor_name: 'Mercedes Service Center', invoice_number: 'INV-20260428-002', next_due_date: '2026-05-28', next_due_odometer: 105500, status: 'completed', completed_by: 'Mercedes Tech Team', remarks: 'Ignition coil replaced. Spark plugs changed.' },
  { id: 3, bus_id: 7, bus_reg: 'BUS-8903', maintenance_date: '2026-05-20', maintenance_type: 'emergency', maintenance_category: 'brake', description: 'Brake pad replacement — urgent', odometer_at_service: 238500, cost: 850, vendor_name: 'Yutong Service Center', invoice_number: 'INV-20260520-003', next_due_date: '2026-06-20', next_due_odometer: 250500, status: 'in_progress', completed_by: '', remarks: 'Both front and rear brake pads being replaced. Rotors resurfaced.' },
  { id: 4, bus_id: 5, bus_reg: 'BUS-5601', maintenance_date: '2026-05-05', maintenance_type: 'routine', maintenance_category: 'electrical', description: 'Battery health check + software update', odometer_at_service: 18000, cost: 200, vendor_name: 'Volvo Electric Division', invoice_number: 'INV-20260505-004', next_due_date: '2026-06-05', next_due_odometer: 23000, status: 'completed', completed_by: 'EV Tech Salman', remarks: 'Battery at 98% health. BMS software updated to v2.3.' },
  { id: 5, bus_id: 3, bus_reg: 'BUS-7802', maintenance_date: '2026-05-15', maintenance_type: 'preventive', maintenance_category: 'AC', description: 'AC compressor service + gas refill', odometer_at_service: 213500, cost: 380, vendor_name: 'CoolRide AC Service', invoice_number: 'INV-20260515-005', next_due_date: '2026-08-15', next_due_odometer: 225500, status: 'completed', completed_by: 'AC Tech Imran', remarks: 'AC gas topped up. Cooling fins cleaned.' },
  { id: 6, bus_id: 4, bus_reg: 'BUS-1205', maintenance_date: '2026-05-20', maintenance_type: 'routine', maintenance_category: 'tire', description: 'Tire rotation + wheel alignment', odometer_at_service: 74500, cost: 150, vendor_name: 'TirePro - I-10', invoice_number: 'INV-20260520-006', next_due_date: '2026-08-20', next_due_odometer: 84500, status: 'completed', completed_by: 'Tire Tech Asif', remarks: 'All 6 tires rotated. Alignment corrected.' },
  { id: 7, bus_id: 6, bus_reg: 'BUS-3409', maintenance_date: '2026-06-01', maintenance_type: 'preventive', maintenance_category: 'engine', description: 'Full engine tune-up + belt replacement', odometer_at_service: 166800, cost: 680, vendor_name: 'Mercedes Service Center', invoice_number: 'INV-20260601-007', next_due_date: '2026-09-01', next_due_odometer: 176800, status: 'completed', completed_by: 'Mercedes Tech Team', remarks: 'Timing belt replaced. All fluids changed.' },
  { id: 8, bus_id: 8, bus_reg: 'BUS-6704', maintenance_date: '2026-05-10', maintenance_type: 'routine', maintenance_category: 'body', description: 'Body panel repair + repaint left side', odometer_at_service: 44000, cost: 920, vendor_name: 'AutoBody Pro', invoice_number: 'INV-20260510-008', next_due_date: '2026-08-10', next_due_odometer: 52000, status: 'completed', completed_by: 'Body Shop Team', remarks: 'Scratch repair after minor parking incident.' },
  { id: 9, bus_id: 9, bus_reg: 'BUS-1506', maintenance_date: '2026-05-22', maintenance_type: 'corrective', maintenance_category: 'AC', description: 'AC not cooling — condenser issue', odometer_at_service: 88500, cost: 550, vendor_name: 'CoolRide AC Service', invoice_number: 'INV-20260522-009', next_due_date: '2026-08-22', next_due_odometer: 98500, status: 'completed', completed_by: 'AC Tech Imran', remarks: 'Condenser unit replaced. Now cooling properly.' },
  { id: 10, bus_id: 10, bus_reg: 'BUS-4207', maintenance_date: '2026-06-02', maintenance_type: 'routine', maintenance_category: 'engine', description: 'Oil change + general inspection', odometer_at_service: 145000, cost: 320, vendor_name: 'AutoCare Workshop G-8', invoice_number: 'INV-20260602-010', next_due_date: '2026-09-02', next_due_odometer: 155000, status: 'completed', completed_by: 'Mechanic Rafiq', remarks: 'All fluids topped. Bus ready for service.' },
  { id: 11, bus_id: 2, bus_reg: 'BUS-2308', maintenance_date: '2026-06-10', maintenance_type: 'preventive', maintenance_category: 'brake', description: 'Scheduled brake system inspection', odometer_at_service: 98500, cost: 0, vendor_name: 'Mercedes Service Center', invoice_number: '', next_due_date: '2026-09-10', next_due_odometer: 106500, status: 'scheduled', completed_by: '', remarks: 'Scheduled inspection — awaiting service date.' },
  { id: 12, bus_id: 1, bus_reg: 'BUS-4501', maintenance_date: '2026-06-15', maintenance_type: 'routine', maintenance_category: 'tire', description: 'Tire replacement — front axle', odometer_at_service: 126000, cost: 0, vendor_name: 'TirePro - I-10', invoice_number: '', next_due_date: '2026-09-15', next_due_odometer: 136000, status: 'scheduled', completed_by: '', remarks: 'Tires showing wear — scheduled for replacement.' },
];