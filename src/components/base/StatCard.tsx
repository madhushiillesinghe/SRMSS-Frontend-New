import { type ReactNode } from 'react';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  accentClass?: string;
}

export default function StatCard({ icon, label, value, subtext, accentClass = 'bg-accent-100 text-accent-700' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg p-5 flex items-start gap-4 animate-fade-in-up hover:scale-[1.02] transition-transform duration-200 cursor-default">
      <div className={`w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0 ${accentClass}`}>
        <i className={`${icon} text-xl`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-foreground-900 mt-0.5 font-heading">{value}</p>
        {subtext && (
          <p className="text-xs text-foreground-400 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}