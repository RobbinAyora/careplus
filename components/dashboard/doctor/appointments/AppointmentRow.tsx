"use client";

import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Edit3,
  UserRound,
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
  in_progress: {
    label: "In consultation",
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
  return new Date(dateString).toLocaleTimeString("en-US", {
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

  return (
    <div
      className="
        group
        grid
        grid-cols-1
        gap-4
        border-b
        border-[#e7eef7]
        px-4
        py-4
        transition
        hover:bg-[#f8fbff]
        sm:grid-cols-[95px_minmax(180px,1.2fr)_minmax(160px,1fr)_145px_105px]
        sm:items-center
        lg:grid-cols-[95px_minmax(220px,1.2fr)_minmax(180px,1fr)_150px_120px]
      "
    >
      {/* Time */}
      <div>
        <p className="text-sm font-semibold text-[#102f5f]">
          {formatTime(appointment.scheduledAt)}
        </p>

        <p className="mt-1 text-[11px] text-[#7b93b2]">
          {appointment.status === "checked_in"
            ? "Checked-in"
            : appointment.status === "in_progress"
              ? "In consultation"
              : ""}
        </p>
      </div>

      {/* Patient */}
      <button
        type="button"
        onClick={() => onOpen(appointment)}
        className="flex min-w-0 items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e1efff] text-xs font-semibold text-[#1677d2]">
          {appointment.patientName
            .split(" ")
            .map((name) => name[0])
            .join("")
            .slice(0, 2)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#102f5f]">
            {appointment.patientName}
          </p>

          <p className="mt-1 text-xs text-[#7891b1]">
            {appointment.patientId} · {appointment.age} years ·{" "}
            {appointment.sex}
          </p>
        </div>
      </button>

      {/* Reason */}
      <div>
        <p className="text-sm text-[#294b76]">{appointment.reason}</p>
      </div>

      {/* Status */}
      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${status.className}`}
        >
          <StatusIcon size={13} />
          {status.label}
        </span>
      </div>

      {/* Actions */}
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
          title="Mark complete"
          aria-label={`Mark ${appointment.patientName} complete`}
          onClick={() => onComplete(appointment)}
          className="rounded-lg p-2 text-[#52739c] transition hover:bg-[#eaf9f0] hover:text-[#16a34a] focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
        >
          <CheckCircle2 size={18} />
        </button>

        <button
          type="button"
          title="Open consultation"
          aria-label={`Open consultation for ${appointment.patientName}`}
          onClick={() => onOpen(appointment)}
          className="rounded-lg p-2 text-[#52739c] transition hover:bg-[#eaf4ff] hover:text-[#1677d2] focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
        >
          <ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}