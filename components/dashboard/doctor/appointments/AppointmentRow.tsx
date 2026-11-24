
"use client";

import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  XCircle,
} from "lucide-react";

import type { Appointment } from "./appointments-data";

type AppointmentRowProps = {
  appointment: Appointment;
  onOpen: (appointment: Appointment) => void;
  onAddNote: (appointment: Appointment) => void;
  onComplete: (appointment: Appointment) => void;
};

const statusConfig = {
  checked_in: {
    label: "Checked-in",
    className: "bg-[#dcfce7] text-[#16a34a]",
    icon: CheckCircle2,
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-[#ede9fe] text-[#7c3aed]",
    icon: Clock3,
  },
  scheduled: {
    label: "Upcoming",
    className: "bg-[#e0efff] text-[#1677d2]",
    icon: Clock3,
  },
  completed: {
    label: "Completed",
    className: "bg-[#dcfce7] text-[#16a34a]",
    icon: CheckCircle2,
  },
  no_show: {
    label: "No-show",
    className: "bg-[#ffe4e6] text-[#e11d48]",
    icon: XCircle,
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-[#f1f5f9] text-[#64748b]",
    icon: XCircle,
  },
};

function formatTime(dateString: string) {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AppointmentRow({
  appointment,
  onOpen,
  onAddNote,
  onComplete,
}: AppointmentRowProps) {
  const status = statusConfig[appointment.status];
  const StatusIcon = status.icon;

  const initials = appointment.patientName
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      className="
        group grid grid-cols-1 gap-4 border-b border-[#e7eef7]
        px-4 py-4 transition hover:bg-[#f8fbff]
        sm:grid-cols-[95px_minmax(180px,1.2fr)_minmax(160px,1fr)_145px_105px]
        sm:items-center
        lg:grid-cols-[95px_minmax(220px,1.2fr)_minmax(180px,1fr)_150px_120px]
      "
    >
      <div>
        <p className="text-sm font-semibold text-[#102f5f]">
          {formatTime(appointment.scheduledAt)}
        </p>

        <p className="mt-1 text-[11px] text-[#7b93b2]">
          {appointment.status === "checked_in"
            ? "Checked-in"
            : appointment.status === "confirmed"
              ? "Confirmed"
              : ""}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onOpen(appointment)}
        className="flex min-w-0 items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e1efff] text-xs font-semibold text-[#1677d2]">
          {initials || "P"}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#102f5f]">
            {appointment.patientName}
          </p>

          <p className="mt-1 text-xs text-[#7891b1]">
            {appointment.patientNumber}
            {appointment.age !== null ? ` · ${appointment.age} years` : ""}
            {appointment.sex ? ` · ${appointment.sex}` : ""}
          </p>
        </div>
      </button>

      <div>
        <p className="text-sm text-[#294b76]">
          {appointment.reason || "Consultation"}
        </p>
      </div>

      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${status.className}`}
        >
          <StatusIcon size={13} />
          {status.label}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Add quick note"
          aria-label={`Add note for ${appointment.patientName}`}
          onClick={() => onAddNote(appointment)}
          className="rounded-lg p-2 text-[#52739c] transition hover:bg-[#eaf4ff] hover:text-[#1677d2] focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
        >
          <Edit3 size={17} />
        </button>

        <button
          type="button"
          title="Complete consultation"
          aria-label={`Complete consultation for ${appointment.patientName}`}
          onClick={() => onComplete(appointment)}
          disabled={!appointment.visitId}
          className="rounded-lg p-2 text-[#52739c] transition hover:bg-[#eaf9f0] hover:text-[#16a34a] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
        >
          <CheckCircle2 size={18} />
        </button>

        <button
          type="button"
          title="Open appointment"
          aria-label={`Open appointment for ${appointment.patientName}`}
          onClick={() => onOpen(appointment)}
          className="rounded-lg p-2 text-[#52739c] transition hover:bg-[#eaf4ff] hover:text-[#1677d2] focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
        >
          <ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}
