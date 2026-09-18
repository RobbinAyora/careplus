import { CalendarDays, UsersRound, FileText, FlaskConical } from "lucide-react";
import StatCard from "./StatCard";
import AppointmentsTable from "./AppointmentsTable";
import PatientVisitsChart from "./PatientVisitsChart";
import RecentPatients from "./RecentPatients";
import CalendarCard from "./CalendarCard";
import HelpCard from "./HelpCard";
import QuickActions from "./QuickActions";
import type { DashboardRole } from "./dashboard-data";

const roleStats = {
  admin: [
    { label: "Today's Appointments", value: "42", trend: "↑ 8% this week", tone: "blue" as const, icon: CalendarDays },
    { label: "Total Patients", value: "1,284", trend: "↑ 6% this month", tone: "green" as const, icon: UsersRound },
    { label: "Medical Records", value: "8,492", trend: "↑ 12% this month", tone: "purple" as const, icon: FileText },
    { label: "Pending Lab Results", value: "17", trend: "↓ 4 today", tone: "red" as const, icon: FlaskConical },
  ],
  nurse: [
    { label: "Today's Patients", value: "16", trend: "↑ 3 from yesterday", tone: "blue" as const, icon: UsersRound },
    { label: "Appointments", value: "12", trend: "↑ 2 today", tone: "green" as const, icon: CalendarDays },
    { label: "Pending Records", value: "5", trend: "↓ 2 today", tone: "purple" as const, icon: FileText },
    { label: "Alerts", value: "2", trend: "Needs attention", tone: "red" as const, icon: FlaskConical },
  ],
  receptionist: [
    { label: "Today's Appointments", value: "31", trend: "↑ 5 today", tone: "blue" as const, icon: CalendarDays },
    { label: "New Patients", value: "9", trend: "↑ 2 today", tone: "green" as const, icon: UsersRound },
    { label: "Waiting Patients", value: "6", trend: "↓ 3 from yesterday", tone: "purple" as const, icon: UsersRound },
    { label: "Outstanding Bills", value: "8", trend: "Needs attention", tone: "red" as const, icon: FileText },
  ],
};

export default function RoleDashboard({
  role,
  title,
  subtitle,
}: {
  role: Exclude<DashboardRole, "doctor">;
  title: string;
  subtitle: string;
}) {
  const stats = roleStats[role];

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 lg:px-6 xl:px-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_315px]">
        <div className="min-w-0">
          <section className="mb-5 rounded-xl bg-[#e7f3ff] px-7 py-8">
            <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#102f5f]">{title}</h1>
            <p className="mt-2 text-[15px] text-[#55749c]">{subtitle}</p>
          </section>

          <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
            <AppointmentsTable />
            <PatientVisitsChart />
          </div>

          <div className="mt-5">
            <RecentPatients />
          </div>
        </div>

        <aside className="space-y-5">
          <button className="h-[56px] w-full rounded-xl bg-[#2d91e8] text-sm font-semibold text-white">
            Quick Action
          </button>
          <QuickActions />
          <CalendarCard />
          <HelpCard />
        </aside>
      </div>
    </div>
  );
}
