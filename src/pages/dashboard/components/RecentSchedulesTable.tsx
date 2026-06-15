import { useNavigate } from 'react-router-dom';
import { dashboardStats, tripStatusData, recentSchedules, maintenanceAlerts, licenseAlerts } from '@/mocks/dashboard';

const statusBadgeClasses: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  on_time: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-purple-100 text-purple-700',
  delayed: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function RecentSchedulesTable() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-lg border border-background-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-background-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground-900 font-heading">Recent Schedules</h3>
        <button
          onClick={() => navigate('/schedules')}
          className="text-xs text-primary-500 hover:text-primary-600 font-medium cursor-pointer whitespace-nowrap"
        >
          View All →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-background-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Route</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Bus</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Driver</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Departure</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-400 uppercase tracking-wider whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentSchedules.map((schedule, idx) => (
              <tr
                key={schedule.id}
                className="border-b border-background-50 hover:bg-background-50/50 transition-colors cursor-pointer"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => navigate('/schedules')}
              >
                <td className="px-5 py-3 text-foreground-800 font-medium whitespace-nowrap">{schedule.routeName}</td>
                <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{schedule.busReg}</td>
                <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{schedule.driverName}</td>
                <td className="px-5 py-3 text-foreground-600 whitespace-nowrap">{schedule.departureTime}</td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${statusBadgeClasses[schedule.status] || 'bg-gray-100 text-gray-600'}`}>
                    {schedule.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}