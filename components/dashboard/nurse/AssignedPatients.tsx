"use client";

import { ArrowRight, Clock3 } from "lucide-react";

import { assignedPatients } from "./nurse-data";

export default function AssignedPatients() {
  return (
    <section className="rounded-xl border border-[#e5eef9] bg-white shadow-[0_2px_10px_rgba(28,78,121,0.03)]">
      <div className="flex items-center justify-between border-b border-[#edf2f8] px-5 py-4">
        <div>
          <h2 className="text-[16px] font-semibold text-[#102f5f]">
            Assigned Patients
          </h2>

          <p className="mt-1 text-xs text-[#7892b2]">
            Patients under your care today
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-1 text-xs font-medium text-[#2d91e8] hover:text-[#187fd8]"
        >
          View all
          <ArrowRight size={14} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-[#edf2f8] text-left">
              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8aa0bc]">
                Patient
              </th>

              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8aa0bc]">
                Room
              </th>

              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8aa0bc]">
                Condition
              </th>

              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8aa0bc]">
                Status
              </th>

              <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#8aa0bc]">
                Time
              </th>
            </tr>
          </thead>

          <tbody>
            {assignedPatients.map((patient) => (
              <tr
                key={patient.id}
                className="border-b border-[#f0f4f9] last:border-0"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e9f4ff] text-xs font-semibold text-[#2d91e8]">
                      {patient.name
                        .split(" ")
                        .map((name) => name[0])
                        .join("")}
                    </div>

                    <div>
                      <p className="text-[13px] font-medium text-[#294b76]">
                        {patient.name}
                      </p>

                      <p className="text-[11px] text-[#8aa0bc]">
                        {patient.id}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-xs text-[#55749c]">
                  {patient.room}
                </td>

                <td className="px-5 py-4 text-xs text-[#55749c]">
                  {patient.condition}
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-medium ${
                      patient.status === "Stable"
                        ? "bg-[#eaf8f1] text-[#27935d]"
                        : patient.status === "Monitoring"
                          ? "bg-[#fff6df] text-[#b27a17]"
                          : "bg-[#fff0f0] text-[#d45b5b]"
                    }`}
                  >
                    {patient.status}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#7892b2]">
                    <Clock3 size={13} />
                    {patient.time}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}