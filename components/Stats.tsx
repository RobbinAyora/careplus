"use client";

import { getAppointmentStats } from "@/lib/mock-data/appointments";
import { getPendingLabResultsCount } from "@/lib/mock-data/lab-results";
import { useAuth } from "@/lib/auth/session";

export function Stats() {
  const { user } = useAuth();
  const doctorId = user?.id || "user-stmarys-doctor";

  const apptStats = getAppointmentStats(doctorId);
  const pendingLabs = getPendingLabResultsCount(doctorId);
  const patientsSeen = apptStats.completed;

  const stats = [
    {
      label: "Today's Appointments",
      value: apptStats.total,
      subtext: `${apptStats.upcoming} upcoming · ${apptStats.inProgress} in progress`,
      icon: "Calendar",
    },
    {
      label: "Pending Lab Results",
      value: pendingLabs,
      subtext: "Awaiting review",
      icon: "FlaskConical",
    },
    {
      label: "Patients Seen Today",
      value: patientsSeen,
      subtext: "Completed visits",
      icon: "Users",
    },
  ];

  return (
    <section aria-labelledby="stats-heading" className="mb-8">
      <h2 id="stats-heading" className="sr-only">At a Glance</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-4 rounded-2xl bg-white p-5 border border-slate-100"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue flex-shrink-0">
              <StatIcon name={stat.icon} className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-bold text-brand-navy">{stat.value}</p>
              <p className="text-sm text-slate-500 truncate">{stat.label}</p>
              <p className="text-xs text-slate-400 truncate">{stat.subtext}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    Calendar: <CalendarIcon className={className} />,
    FlaskConical: <FlaskConicalIcon className={className} />,
    Users: <UsersIcon className={className} />,
  };
  return icons[name] || <CalendarIcon className={className} />;
}

function CalendarIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className}><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

function FlaskConicalIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M20 9V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v13.44A10.09 10.09 0 0 1 10.94 22H10a2 2 0 0 1 0-4h.28a8.08 8.08 0 0 0 7.84-9.16A2 2 0 0 1 20.18 7H22a2 2 0 0 1 0 4h-2Z" stroke="currentColor" strokeWidth="1.6" /></svg>;
}

function UsersIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" className={className}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}