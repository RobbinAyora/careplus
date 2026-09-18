"use client";

import {
  CalendarDays,
  ClipboardList,
  FileText,
  Plus,
  UserPlus,
  UsersRound,
} from "lucide-react";

import CalendarCard from "../CalendarCard";
import HelpCard from "../HelpCard";

import ReceptionistStatCard from "./ReceptionistStatCard";
import ReceptionistAppointments from "./ReceptionistAppointments";
import DoctorAvailability from "./DoctorAvailability";
import RecentRegistrations from "./RecentRegistrations";
import { receptionistStats } from "./receptionist-data";

export default function ReceptionistDashboard() {
  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 lg:px-6 xl:px-8">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_315px]">
        {/* Main content */}
        <div className="min-w-0">
          {/* Welcome banner */}
          <section className="relative mb-5 h-[171px] overflow-hidden rounded-xl bg-[#e7f3ff]">
            <div className="relative z-10 flex h-full flex-col justify-center px-7">
              <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#102f5f]">
                Good morning, Reception
              </h1>

              <p className="mt-2 text-[15px] text-[#55749c]">
                Here&apos;s what&apos;s happening at the front desk today.
              </p>

              <div className="mt-5 flex items-center gap-3 text-sm text-[#55749c]">
                <CalendarDays
                  size={19}
                  strokeWidth={1.8}
                />

                <span>Tuesday, 16 September 2025</span>
              </div>
            </div>

            {/* Decorative circles */}
            <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full bg-white/30" />

            <div className="absolute -bottom-32 right-20 h-72 w-72 rounded-full bg-[#d5ebff]/60" />
          </section>

          {/* Stats */}
          <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
            {receptionistStats.map((stat) => (
              <ReceptionistStatCard
                key={stat.label}
                {...stat}
              />
            ))}
          </div>

          {/* Appointment + availability */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
            <ReceptionistAppointments />

            <DoctorAvailability />
          </div>

          {/* Recent registrations */}
          <div className="mt-5">
            <RecentRegistrations />
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-5">
          {/* Primary action */}
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
              focus:outline-none
              focus:ring-2
              focus:ring-[#2d91e8]/40
            "
          >
            <Plus size={20} strokeWidth={2} />
            <span>New Appointment</span>
          </button>

          {/* Quick actions */}
          <section className="rounded-xl border border-[#e1ecf8] bg-white p-5 shadow-[0_3px_14px_rgba(28,73,125,0.035)]">
            <h2 className="font-semibold text-[#102f5f]">
              Quick Actions
            </h2>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-[#e4edf7] px-4 py-3 text-left text-sm font-medium text-[#294b76] transition hover:bg-[#f5f9ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf4ff] text-[#1677d2]">
                  <UserPlus size={17} />
                </span>

                <span className="flex-1">
                  Register Patient
                </span>

                <span className="text-[#7b99ba]">›</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-[#e4edf7] px-4 py-3 text-left text-sm font-medium text-[#294b76] transition hover:bg-[#f5f9ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf9f0] text-[#16a34a]">
                  <ClipboardList size={17} />
                </span>

                <span className="flex-1">
                  Check-in Patient
                </span>

                <span className="text-[#7b99ba]">›</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-[#e4edf7] px-4 py-3 text-left text-sm font-medium text-[#294b76] transition hover:bg-[#f5f9ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1ebff] text-[#7c3aed]">
                  <FileText size={17} />
                </span>

                <span className="flex-1">
                  Create Invoice
                </span>

                <span className="text-[#7b99ba]">›</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-[#e4edf7] px-4 py-3 text-left text-sm font-medium text-[#294b76] transition hover:bg-[#f5f9ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#fff4e5] text-[#d97706]">
                  <UsersRound size={17} />
                </span>

                <span className="flex-1">
                  Find Patient
                </span>

                <span className="text-[#7b99ba]">›</span>
              </button>
            </div>
          </section>

          {/* Calendar */}
          <CalendarCard />

          {/* Help */}
          <HelpCard />
        </aside>
      </div>
    </div>
  );
}