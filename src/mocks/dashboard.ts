export const dashboardStats = {
  totalActiveRoutes: 12,
  busesAvailable: 28,
  driversOnDuty: 35,
  tripsToday: 47,
  revenueToday: 8450,
};

export const tripStatusData = [
  { name: 'Scheduled', value: 15, color: '#60a5fa' },
  { name: 'On Time', value: 12, color: '#34d399' },
  { name: 'In Progress', value: 10, color: '#c084fc' },
  { name: 'Delayed', value: 5, color: '#fb923c' },
  { name: 'Completed', value: 18, color: '#059669' },
  { name: 'Cancelled', value: 3, color: '#f87171' },
];

export const recentSchedules = [
  { id: 1, routeName: 'SR-001 Express Downtown', busReg: 'BUS-4501', driverName: 'Ahmed Khan', departureTime: '2026-06-04 06:30 AM', status: 'on_time' },
  { id: 2, routeName: 'SR-002 City Loop', busReg: 'BUS-2308', driverName: 'Mohammed Ali', departureTime: '2026-06-04 07:00 AM', status: 'in_progress' },
  { id: 3, routeName: 'SR-003 Airport Shuttle', busReg: 'BUS-7802', driverName: 'Usman Riaz', departureTime: '2026-06-04 07:15 AM', status: 'delayed' },
  { id: 4, routeName: 'SR-004 University Route', busReg: 'BUS-1205', driverName: 'Bilal Hassan', departureTime: '2026-06-04 07:45 AM', status: 'on_time' },
  { id: 5, routeName: 'SR-005 Industrial Zone', busReg: 'BUS-5601', driverName: 'Tariq Mahmood', departureTime: '2026-06-04 08:00 AM', status: 'scheduled' },
  { id: 6, routeName: 'SR-006 Suburban Express', busReg: 'BUS-3409', driverName: 'Rashid Iqbal', departureTime: '2026-06-04 08:20 AM', status: 'completed' },
  { id: 7, routeName: 'SR-007 Harbor Link', busReg: 'BUS-8903', driverName: 'Farhan Saeed', departureTime: '2026-06-04 08:45 AM', status: 'in_progress' },
  { id: 8, routeName: 'SR-008 Mall Circuit', busReg: 'BUS-6704', driverName: 'Kamran Shahid', departureTime: '2026-06-04 09:10 AM', status: 'scheduled' },
  { id: 9, routeName: 'SR-009 Tech Park Route', busReg: 'BUS-1506', driverName: 'Shahzad Akram', departureTime: '2026-06-04 09:30 AM', status: 'delayed' },
  { id: 10, routeName: 'SR-010 Night Owl', busReg: 'BUS-4207', driverName: 'Zubair Nasir', departureTime: '2026-06-04 10:00 PM', status: 'cancelled' },
];

export const maintenanceAlerts = [
  { id: 1, busReg: 'BUS-4501', model: 'Volvo 9400', nextDue: '2026-06-04', daysOverdue: 0, issue: 'Routine oil change + brake inspection' },
  { id: 2, busReg: 'BUS-2308', model: 'Mercedes-Benz O500', nextDue: '2026-05-28', daysOverdue: 7, issue: 'Engine diagnostics + AC service' },
  { id: 3, busReg: 'BUS-5601', model: 'Scania K410', nextDue: '2026-06-05', daysOverdue: -1, issue: 'Tire rotation + alignment check' },
  { id: 4, busReg: 'BUS-8903', model: 'Yutong ZK6128', nextDue: '2026-05-20', daysOverdue: 15, issue: 'Brake pad replacement urgent' },
];

export const licenseAlerts = [
  { id: 1, driverCode: 'DRV-089', driverName: 'Ahmed Khan', licenseNo: 'DL-2018-45672', expiryDate: '2026-06-15', daysLeft: 11 },
  { id: 2, driverCode: 'DRV-134', driverName: 'Rashid Iqbal', licenseNo: 'DL-2019-89341', expiryDate: '2026-06-10', daysLeft: 6 },
  { id: 3, driverCode: 'DRV-267', driverName: 'Kamran Shahid', licenseNo: 'DL-2021-23456', expiryDate: '2026-07-02', daysLeft: 28 },
];