import {
  CalendarDays,
  Plus,
  UserPlus,
  ClipboardList,
  Activity,
} from "lucide-react";

import NurseStatCard from "./NurseStatCard";
import AssignedPatients from "./AssignedPatients";
import PatientVitals from "./PatientVitals";
import NursingTasks from "./NursingTasks";
import RecentNursingNotes from "./RecentNursingNotes";

import { nurseStats } from "./nurse-data";

import CalendarCard from "@/components/dashboard/CalendarCard";
import HelpCard from "@/components/dashboard/HelpCard";

export default function NurseDashboard() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 lg:px-6 xl:px-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_315px]">
        {/* =========================================
            MAIN CONTENT
        ========================================== */}
        <div className="min-w-0">
          {/* Welcome Banner */}
          <section className="relative mb-5 h-[171px] overflow-hidden rounded-xl bg-[#e7f3ff]">
            <div className="flex h-full flex-col justify-center px-7">
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#102f5f]">
                Good morning, Nurse Wanjiku
              </h1>

              <p className="mt-2 text-[15px] text-[#55749c]">
                Here&apos;s what&apos;s happening with your patients today.
              </p>

              <div className="mt-5 flex items-center gap-3 text-sm text-[#55749c]">
                <CalendarDays
                  size={19}
                  strokeWidth={1.8}
                />

                <span>
                  Tuesday, 16 September 2025
                </span>
              </div>
            </div>
          </section>

          {/* Statistics */}
          <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {nurseStats.map((stat) => (
              <NurseStatCard
                key={stat.label}
                {...stat}
              />
            ))}
          </div>

          {/* Patients + Vitals */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
            <AssignedPatients />
            <PatientVitals />
          </div>

          {/* Tasks + Notes */}
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <NursingTasks />
            <RecentNursingNotes />
          </div>
        </div>

        {/* =========================================
            RIGHT SIDEBAR
        ========================================== */}
        <aside className="space-y-5">
          {/* New Patient */}
          <button
            type="button"
            className="flex h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-[#2d91e8] text-sm font-semibold text-white shadow-sm transition hover:bg-[#187fd8] active:scale-[0.99]"
          >
            <Plus
              size={20}
              strokeWidth={2}
            />

            <span>Record Patient Vitals</span>
          </button>

          {/* Quick Actions */}
          <div className="rounded-xl border border-[#e5eef9] bg-white p-5 shadow-[0_2px_10px_rgba(28,78,121,0.03)]">
            <h2 className="text-[15px] font-semibold text-[#102f5f]">
              Quick Actions
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="flex flex-col items-center justify-center rounded-xl border border-[#e7eef7] px-3 py-4 text-center transition hover:bg-[#f7fbff]"
              >
                <UserPlus
                  size={19}
                  className="text-[#2d91e8]"
                />

                <span className="mt-2 text-[11px] font-medium text-[#55749c]">
                  Patient
                  <br />
                  Registration
                </span>
              </button>

              <button
                type="button"
                className="flex flex-col items-center justify-center rounded-xl border border-[#e7eef7] px-3 py-4 text-center transition hover:bg-[#f7fbff]"
              >
                <ClipboardList
                  size={19}
                  className="text-[#2d91e8]"
                />

                <span className="mt-2 text-[11px] font-medium text-[#55749c]">
                  Nursing
                  <br />
                  Notes
                </span>
              </button>

              <button
                type="button"
                className="flex flex-col items-center justify-center rounded-xl border border-[#e7eef7] px-3 py-4 text-center transition hover:bg-[#f7fbff]"
              >
                <Activity
                  size={19}
                  className="text-[#2d91e8]"
                />

                <span className="mt-2 text-[11px] font-medium text-[#55749c]">
                  Patient
                  <br />
                  Vitals
                </span>
              </button>

              <button
                type="button"
                className="flex flex-col items-center justify-center rounded-xl border border-[#e7eef7] px-3 py-4 text-center transition hover:bg-[#f7fbff]"
              >
                <CalendarDays
                  size={19}
                  className="text-[#2d91e8]"
                />

                <span className="mt-2 text-[11px] font-medium text-[#55749c]">
                  My
                  <br />
                  Schedule
                </span>
              </button>
            </div>
          </div>

          {/* Calendar */}
          <CalendarCard />

          {/* Help */}
          <HelpCard />
        </aside>
      </div>
    </div>
  );
}