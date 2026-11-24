
"use client";

import {
  ArrowLeft,
  ExternalLink,
  UserRound,
} from "lucide-react";

import type { Appointment } from "./appointments-data";

type PatientSnapshotProps = {
  appointment: Appointment;
  onBack: () => void;
};

export default function PatientSnapshot({
  appointment,
  onBack,
}: PatientSnapshotProps) {
  const initials = appointment.patientName
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#52739c] transition hover:text-[#1677d2] focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
      >
        <ArrowLeft size={18} />
        Back to appointments
      </button>

      <section className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e5f2ff] text-lg font-bold text-[#1677d2]">
              {initials || "P"}
            </div>

            <div>
              <h1 className="text-xl font-semibold text-[#102f5f] sm:text-2xl">
                {appointment.patientName}
              </h1>

              <p className="mt-1 text-sm text-[#7891b1]">
                {appointment.patientNumber}
                {appointment.age !== null
                  ? ` · ${appointment.age} years`
                  : ""}
                {appointment.sex ? ` · ${appointment.sex}` : ""}
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-xl border border-[#dbe8f5] px-4 py-2.5 text-sm font-medium text-[#294b76]">
            <UserRound size={17} />
            Patient record
            <ExternalLink size={14} />
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-[#e8eff7] pt-5 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-[#8aa0ba]">
              Patient Number
            </p>
            <p className="mt-2 text-sm font-semibold text-[#294b76]">
              {appointment.patientNumber}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-[#8aa0ba]">
              Appointment
            </p>
            <p className="mt-2 text-sm font-semibold text-[#294b76]">
              {new Date(appointment.scheduledAt).toLocaleString("en-KE")}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-[#8aa0ba]">
              Doctor
            </p>
            <p className="mt-2 text-sm font-semibold text-[#294b76]">
              {appointment.doctorName}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
