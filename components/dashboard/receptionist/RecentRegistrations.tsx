import { ChevronRight, UserPlus } from "lucide-react";

import { recentRegistrations } from "./receptionist-data";

export default function RecentRegistrations() {
  return (
    <section className="rounded-xl border border-[#e1ecf8] bg-white shadow-[0_3px_14px_rgba(28,73,125,0.035)]">
      <div className="flex items-center justify-between border-b border-[#e8eff7] px-5 py-5 sm:px-6">
        <div>
          <h2 className="text-[17px] font-semibold text-[#102f5f]">
            Recent Patient Registrations
          </h2>

          <p className="mt-1 text-xs text-[#7891b1]">
            Patients recently added to the system
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
        {recentRegistrations.map((patient) => (
          <div
            key={patient.patientId}
            className="flex items-center gap-3 px-5 py-4 sm:px-6"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e5f2ff] text-[#1677d2]">
              <UserPlus size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#102f5f]">
                {patient.name}
              </p>

              <p className="mt-1 text-xs text-[#8299b4]">
                {patient.patientId} · {patient.age} years ·{" "}
                {patient.sex}
              </p>
            </div>

            <div className="hidden text-right sm:block">
              <p className="text-[11px] text-[#8299b4]">
                Registered
              </p>

              <p className="mt-1 text-xs font-medium text-[#52739c]">
                {patient.registered}
              </p>
            </div>

            <button
              type="button"
              aria-label={`Open ${patient.name}`}
              className="rounded-lg p-2 text-[#7891b1] hover:bg-[#eef6ff] hover:text-[#1677d2]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}