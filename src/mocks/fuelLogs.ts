export interface FuelLog {
  id: number;
  bus_id: number;
  bus_reg: string;
  schedule_id: number | null;
  fuel_date: string;
  fuel_type: string;
  fuel_amount: number;
  cost_per_liter: number;
  total_cost: number;
  odometer_reading: number;
  refueling_location: string;
  receipt_number: string;
  remarks: string;
  recorded_by: string;
}

export const fuelLogs: FuelLog[] = [
  { id: 1, bus_id: 1, bus_reg: 'BUS-4501', schedule_id: null, fuel_date: '2026-06-04', fuel_type: 'Diesel', fuel_amount: 120, cost_per_liter: 1.45, total_cost: 174.00, odometer_reading: 125400, refueling_location: 'Shell Pump - G-8', receipt_number: 'RCP-20260604-001', remarks: 'Full tank refill before morning shift', recorded_by: 'Admin' },
  { id: 2, bus_id: 2, bus_reg: 'BUS-2308', schedule_id: 2, fuel_date: '2026-06-03', fuel_type: 'Diesel', fuel_amount: 95, cost_per_liter: 1.45, total_cost: 137.75, odometer_reading: 98050, refueling_location: 'PSO - F-10', receipt_number: 'RCP-20260603-002', remarks: 'Mid-route refill', recorded_by: 'Admin' },
  { id: 3, bus_id: 3, bus_reg: 'BUS-7802', schedule_id: 3, fuel_date: '2026-06-04', fuel_type: 'CNG', fuel_amount: 180, cost_per_liter: 0.95, total_cost: 171.00, odometer_reading: 214500, refueling_location: 'CNG Station - I-9', receipt_number: 'RCP-20260604-003', remarks: 'CNG refill for airport shuttle', recorded_by: 'Admin' },
  { id: 4, bus_id: 4, bus_reg: 'BUS-1205', schedule_id: 4, fuel_date: '2026-06-03', fuel_type: 'Diesel', fuel_amount: 80, cost_per_liter: 1.45, total_cost: 116.00, odometer_reading: 74800, refueling_location: 'Shell Pump - G-8', receipt_number: 'RCP-20260603-004', remarks: 'Regular refill', recorded_by: 'Admin' },
  { id: 5, bus_id: 5, bus_reg: 'BUS-5601', schedule_id: 5, fuel_date: '2026-06-04', fuel_type: 'Electric', fuel_amount: 200, cost_per_liter: 0.12, total_cost: 24.00, odometer_reading: 18400, refueling_location: 'EV Charging - F-6', receipt_number: 'RCP-20260604-005', remarks: 'Full charge — 200 kWh', recorded_by: 'Admin' },
  { id: 6, bus_id: 6, bus_reg: 'BUS-3409', schedule_id: 6, fuel_date: '2026-06-04', fuel_type: 'Diesel', fuel_amount: 150, cost_per_liter: 1.45, total_cost: 217.50, odometer_reading: 167300, refueling_location: 'PSO - F-10', receipt_number: 'RCP-20260604-006', remarks: 'Full tank for suburban route', recorded_by: 'Admin' },
  { id: 7, bus_id: 3, bus_reg: 'BUS-7802', schedule_id: null, fuel_date: '2026-06-02', fuel_type: 'CNG', fuel_amount: 160, cost_per_liter: 0.95, total_cost: 152.00, odometer_reading: 214320, refueling_location: 'CNG Station - I-9', receipt_number: 'RCP-20260602-007', remarks: 'Previous CNG refill', recorded_by: 'Admin' },
  { id: 8, bus_id: 1, bus_reg: 'BUS-4501', schedule_id: 1, fuel_date: '2026-06-02', fuel_type: 'Diesel', fuel_amount: 110, cost_per_liter: 1.42, total_cost: 156.20, odometer_reading: 125280, refueling_location: 'Shell Pump - G-8', receipt_number: 'RCP-20260602-008', remarks: 'Pre-shift refill', recorded_by: 'Admin' },
  { id: 9, bus_id: 6, bus_reg: 'BUS-3409', schedule_id: null, fuel_date: '2026-06-01', fuel_type: 'Diesel', fuel_amount: 140, cost_per_liter: 1.43, total_cost: 200.20, odometer_reading: 167150, refueling_location: 'Total - H-8', receipt_number: 'RCP-20260601-009', remarks: 'Monthly bulk refill', recorded_by: 'Admin' },
  { id: 10, bus_id: 4, bus_reg: 'BUS-1205', schedule_id: null, fuel_date: '2026-06-01', fuel_type: 'Diesel', fuel_amount: 75, cost_per_liter: 1.43, total_cost: 107.25, odometer_reading: 74720, refueling_location: 'Shell Pump - G-8', receipt_number: 'RCP-20260601-010', remarks: 'Regular refill', recorded_by: 'Admin' },
];

export const fuelSummary = {
  totalCostThisMonth: 1455.90,
  averageEfficiency: [
    { bus_reg: 'BUS-4501', km_per_l: 4.8 },
    { bus_reg: 'BUS-2308', km_per_l: 5.2 },
    { bus_reg: 'BUS-7802', km_per_kg: 3.2 },
    { bus_reg: 'BUS-1205', km_per_l: 4.2 },
    { bus_reg: 'BUS-5601', km_per_kwh: 0.8 },
    { bus_reg: 'BUS-3409', km_per_l: 5.8 },
  ],
};