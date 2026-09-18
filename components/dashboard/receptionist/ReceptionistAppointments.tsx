import { ChevronRight } from "lucide-react";

import { receptionistAppointments } from "./receptionist-data";

const statusStyles = {
  "checked-in": "bg-[#dcfce7] text-[#16a34a]",
  waiting: "bg-[#fff4db] text-[#c47a00]",
  upcoming: "bg-[#e0efff] text-[#1677d2]",
};

const statusLabels = {
  "checked-in": "Checked-in",
  waiting: "Waiting",
  upcoming: "Upcoming",
};

export default function ReceptionistAppointments() {
  return (
    <section className="rounded-xl border border-[#e1ecf8] bg-white shadow-[0_3px_14px_rgba(28,73,125,0.035)]">
      <div className="flex items-center justify-between border-b border-[#e8eff7] px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-[17px] font-semibold text-[#102f5f]">
            Appointments Today
          </h2>

          <p className="mt-1 text-xs text-[#7891b1]">
            All doctors&apos; schedules for today
          </p>
        </div>

        <button
          type="button"
          className="text-xs font-semibold text-[#1677d2] hover:text-[#0d63b6]"
        >
          View all
        </button>
      </div>

      {/* Desktop header */}
      <div className="hidden grid-cols-[85px_minmax(170px,1.2fr)_145px_130px_110px] gap-4 bg-[#f8fbff] px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#7c95b2] md:grid">
        <span>Time</span>
        <span>Patient</span>
        <span>Doctor</span>
        <span>Status</span>
        <span>Action</span>
      </div>

      <div>
        {receptionistAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="
              grid
              grid-cols-1
              gap-3
              border-b
              border-[#edf2f8]
              px-5
              py-4
              transition
              last:border-b-0
              hover:bg-[#f9fcff]
              md:grid-cols-[85px_minmax(170px,1.2fr)_145px_130px_110px]
              md:items-center
              md:gap-4
            "
          >
            <div>
              <p className="text-sm font-semibold text-[#102f5f]">
                {appointment.time}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e3f1ff] text-xs font-semibold text-[#1677d2]">
                {appointment.patient
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#102f5f]">
                  {appointment.patient}
                </p>

                <p className="mt-0.5 text-[11px] text-[#8299b4]">
                  {appointment.patientId} · {appointment.reason}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-[#294b76]">
                {appointment.doctor}
              </p>

              <p className="mt-1 text-[11px] text-[#8299b4]">
                {appointment.department}
              </p>
            </div>

            <div>
              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-medium ${statusStyles[appointment.status as keyof typeof statusStyles]}`}
              >
                {statusLabels[appointment.status as keyof typeof statusLabels]}
              </span>
            </div>

            <div>
              {appointment.status === "upcoming" ? (
                <button
                  type="button"
                  className="rounded-lg border border-[#dce8f5] px-3 py-1.5 text-xs font-medium text-[#294b76] hover:bg-[#eef6ff]"
                >
                  Check-in
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#1677d2]"
                >
                  Details
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}