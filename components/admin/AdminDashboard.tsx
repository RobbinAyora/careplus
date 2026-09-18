import { Plus } from "lucide-react";
import AdminStatCard from "./AdminStatCard";
import HospitalPerformance from "./HospitalPerformance";
import DepartmentOverview from "./DepartmentOverview";
import RecentAdmissions from "./RecentAdmissions";
import CalendarCard from "../CalendarCard";
import QuickActions from "./QuickActions";
import RecentActivities from "./RecentActivities";
import HelpCard from "../HelpCard";
import { adminStats } from "./admin-data";

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 xl:px-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_315px]">
        <div className="min-w-0">
          {/* Welcome banner */}
          <section className="relative mb-5 h-[161px] overflow-hidden rounded-xl bg-[#e7f3ff]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#e7f3ff] via-[#e7f3ff]/95 to-[#e7f3ff]/20" />
            <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-7">
              <h1 className="text-[25px] font-semibold tracking-[-0.03em] text-[#102f5f] sm:text-[28px]">
                Good morning, John Kamau
              </h1>
              <p className="mt-2 text-[14px] text-[#55749c] sm:text-[15px]">
                Here&apos;s what&apos;s happening across your hospital today.
              </p>
              <p className="mt-5 text-sm text-[#55749c]">
                <span className="mr-3">▣</span>
                Tuesday, 16 September 2025
              </p>
            </div>
            <div
              className="absolute right-0 top-0 h-full w-[44%] bg-cover bg-center"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1000&q=85')",
              }}
            />
          </section>

          {/* Stats */}
          <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {adminStats.map((stat) => (
              <AdminStatCard key={stat.label} {...stat} />
            ))}
          </div>

          {/* Performance + departments */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
            <HospitalPerformance />
            <DepartmentOverview />
          </div>

          {/* Admissions */}
          <div className="mt-5">
            <RecentAdmissions />
          </div>
        </div>

        {/* Right rail */}
        <aside className="space-y-5">
          <button
            type="button"
            className="flex h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-[#2d91e8] text-sm font-semibold text-white shadow-sm transition hover:bg-[#187fd8]"
          >
            <Plus size={20} />
            Add New Staff
          </button>

          <QuickActions />
          <CalendarCard />
          <RecentActivities />
          <HelpCard />
        </aside>
      </div>
    </div>
  );
}
