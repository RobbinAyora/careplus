import {
  ChevronRight,
  CircleCheck,
  Clock3,
} from "lucide-react";

import { doctorAvailability } from "./receptionist-data";

const statusStyles = {
  Available: {
    className: "bg-[#dcfce7] text-[#16a34a]",
    dot: "bg-[#22c55e]",
  },
  "In Consultation": {
    className: "bg-[#e0efff] text-[#1677d2]",
    dot: "bg-[#2d91e8]",
  },
  "On Break": {
    className: "bg-[#fff4db] text-[#c47a00]",
    dot: "bg-[#f59e0b]",
  },
};

export default function DoctorAvailability() {
  return (
    <section className="rounded-xl border border-[#e1ecf8] bg-white shadow-[0_3px_14px_rgba(28,73,125,0.035)]">
      <div className="flex items-center justify-between border-b border-[#e8eff7] px-5 py-5">
        <div>
          <h2 className="text-[17px] font-semibold text-[#102f5f]">
            Doctor Availability
          </h2>

          <p className="mt-1 text-xs text-[#7891b1]">
            Current availability
          </p>
        </div>

        <button
          type="button"
          className="text-xs font-semibold text-[#1677d2]"
        >
          View all
        </button>
      </div>

      <div className="divide-y divide-[#edf2f8]">
        {doctorAvailability.map((doctor) => {
          const status =
            statusStyles[
              doctor.status as keyof typeof statusStyles
            ];

          return (
            <div
              key={doctor.name}
              className="flex items-center gap-3 px-5 py-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e9f3ff] text-xs font-semibold text-[#1677d2]">
                {doctor.name
                  .replace("Dr. ", "")
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#102f5f]">
                  {doctor.name}
                </p>

                <p className="mt-1 truncate text-[11px] text-[#8299b4]">
                  {doctor.department} · {doctor.room}
                </p>
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-medium ${status.className}`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                  />

                  {doctor.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[#edf2f8] px-5 py-3">
        <div className="flex items-center gap-4 text-[11px] text-[#7891b1]">
          <span className="flex items-center gap-1.5">
            <CircleCheck size={13} className="text-[#22c55e]" />
            Available
          </span>

          <span className="flex items-center gap-1.5">
            <Clock3 size={13} className="text-[#2d91e8]" />
            Busy
          </span>

          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1 font-medium text-[#1677d2]"
          >
            Manage
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </section>
  );
}