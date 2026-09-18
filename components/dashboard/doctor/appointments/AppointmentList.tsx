"use client";

import { CalendarClock } from "lucide-react";

import AppointmentRow from "./AppointmentRow";
import type { Appointment } from "./appointments-data";

type AppointmentListProps = {
  appointments: Appointment[];
  onOpen: (appointment: Appointment) => void;
  onAddNote: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
};

const statusGroups = [
  {
    status: "checked_in",
    label: "Currently in Clinic (Checked-in)",
    color: "text-[#1677d2]",
    bg: "bg-[#e1efff]",
  },
  {
    status: "in_progress",
    label: "In Consultation",
    color: "text-[#7c3aed]",
    bg: "bg-[#ede9fe]",
  },
  {
    status: "scheduled",
    label: "Upcoming",
    color: "text-[#1677d2]",
    bg: "bg-[#e1efff]",
  },
  {
    status: "completed",
    label: "Completed",
    color: "text-[#16a34a]",
    bg: "bg-[#dcfce7]",
  },
  {
    status: "no_show",
    label: "No-show",
    color: "text-[#e11d48]",
    bg: "bg-[#ffe4e6]",
  },
  {
    status: "cancelled",
    label: "Cancelled",
    color: "text-[#64748b]",
    bg: "bg-[#f1f5f9]",
  },
];

export default function AppointmentList({
  appointments,
  onOpen,
  onAddNote,
  onComplete,
}: AppointmentListProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e3edf8] bg-white shadow-[0_4px_18px_rgba(28,73,125,0.04)]">
      <div className="border-b border-[#e7eef7] px-5 py-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#102f5f]">
              Appointments Today
            </h2>

            <p className="mt-1 text-xs text-[#7891b1]">
              Your patient queue for Tuesday, 16 September 2025
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-[#eef6ff] px-3 py-1.5 text-xs font-medium text-[#1677d2] sm:flex">
            <CalendarClock size={14} />
            {appointments.length} appointments
          </div>
        </div>
      </div>

      {/* Desktop table header */}
      <div className="hidden grid-cols-[95px_minmax(180px,1.2fr)_minmax(160px,1fr)_145px_105px] gap-4 bg-[#f8fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#7891b1] sm:grid lg:grid-cols-[95px_minmax(220px,1.2fr)_minmax(180px,1fr)_150px_120px]">
        <span>Time</span>
        <span>Patient</span>
        <span>Reason for Visit</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      <div>
        {statusGroups.map((group) => {
          const groupAppointments = appointments.filter(
            (appointment) => appointment.status === group.status,
          );

          if (!groupAppointments.length) {
            return null;
          }

          return (
            <div key={group.status}>
              <div className="flex items-center gap-2 px-5 pb-1 pt-4 sm:px-6">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full ${group.bg}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${group.color.replace(
                      "text-",
                      "bg-",
                    )}`}
                  />
                </span>

                <p className={`text-xs font-semibold ${group.color}`}>
                  {group.label}
                </p>
              </div>

              <div>
                {groupAppointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onOpen={onOpen}
                    onAddNote={onAddNote}
                    onComplete={onComplete}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}