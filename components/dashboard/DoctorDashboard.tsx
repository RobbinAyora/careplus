import { CalendarDays, Plus } from "lucide-react";

import StatCard from "./StatCard";
import AppointmentsTable from "./AppointmentsTable";
import PatientVisitsChart from "./PatientVisitsChart";
import RecentPatients from "./RecentPatients";
import CalendarCard from "./CalendarCard";
import HelpCard from "./HelpCard";
import QuickActions from "./QuickActions";

import { doctorStats } from "./dashboard-data";

export default function DoctorDashboard() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 lg:px-6 xl:px-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_315px]">
        {/* =========================================================
            MAIN CONTENT
        ========================================================= */}
        <div className="min-w-0">
          {/* =======================================================
              WELCOME SECTION
          ======================================================= */}
          <section className="relative mb-5 h-[171px] overflow-hidden rounded-xl bg-[#e7f3ff]">
            <div className="flex h-full flex-col justify-center px-7">
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#102f5f]">
                Good morning, Dr. Mwangi
              </h1>

              <p className="mt-2 text-[15px] text-[#55749c]">
                Here&apos;s what&apos;s happening with your patients today.
              </p>

              <div className="mt-5 flex items-center gap-3 text-sm text-[#55749c]">
                <CalendarDays size={19} strokeWidth={1.8} />

                <span>Tuesday, 16 September 2025</span>
              </div>
            </div>
          </section>

          {/* =======================================================
              STATISTICS
          ======================================================= */}
          <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {doctorStats.map((stat) => (
              <StatCard
                key={stat.label}
                {...stat}
              />
            ))}
          </div>

          {/* =======================================================
              APPOINTMENTS + PATIENT VISITS
          ======================================================= */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
            {/* Appointments */}
            <AppointmentsTable />

            {/* Patient visits chart */}
            <PatientVisitsChart />
          </div>

          {/* =======================================================
              RECENT PATIENTS
          ======================================================= */}
          <div className="mt-5">
            <RecentPatients />
          </div>
        </div>

        {/* =========================================================
            RIGHT SIDEBAR
        ========================================================= */}
        <aside className="space-y-5">
          {/* =======================================================
              NEW APPOINTMENT BUTTON
          ======================================================= */}
          <button
            type="button"
            className="
              flex
              h-[56px]
              w-full
              items-center
              justify-center
              gap-3
              rounded-xl
              bg-[#2d91e8]
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-[#187fd8]
              active:scale-[0.99]
            "
          >
            <Plus size={20} strokeWidth={2} />

            <span>New Appointment</span>
          </button>

          {/* =======================================================
              QUICK ACTIONS
          ======================================================= */}
          <QuickActions />

          {/* =======================================================
              CALENDAR
          ======================================================= */}
          <CalendarCard />

          {/* =======================================================
              HELP / SUPPORT
          ======================================================= */}
          <HelpCard />
        </aside>
      </div>
    </div>
  );
}
