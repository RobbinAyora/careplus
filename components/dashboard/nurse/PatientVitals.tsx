import { Activity, ArrowRight } from "lucide-react";

import { vitals } from "./nurse-data";

export default function PatientVitals() {
  return (
    <section className="rounded-xl border border-[#e5eef9] bg-white shadow-[0_2px_10px_rgba(28,78,121,0.03)]">
      <div className="flex items-center justify-between border-b border-[#edf2f8] px-5 py-4">
        <div>
          <h2 className="text-[16px] font-semibold text-[#102f5f]">
            Patient Vitals
          </h2>

          <p className="mt-1 text-xs text-[#7892b2]">
            Latest readings from your assigned patients
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf6ff] text-[#2d91e8]">
          <Activity size={17} />
        </div>
      </div>

      <div className="space-y-3 p-4">
        {vitals.map((item) => (
          <div
            key={item.patient}
            className="rounded-lg border border-[#edf2f8] p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-[#294b76]">
                  {item.patient}
                </p>

                <p className="mt-0.5 text-[11px] text-[#8aa0bc]">
                  Room {item.room}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  item.status === "Normal"
                    ? "bg-[#eaf8f1] text-[#27935d]"
                    : "bg-[#fff6df] text-[#b27a17]"
                }`}
              >
                {item.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <div>
                <p className="text-[9px] uppercase text-[#9aacc2]">
                  BP
                </p>
                <p className="mt-1 text-xs font-semibold text-[#456589]">
                  {item.bloodPressure}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase text-[#9aacc2]">
                  Pulse
                </p>
                <p className="mt-1 text-xs font-semibold text-[#456589]">
                  {item.pulse}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase text-[#9aacc2]">
                  Temp
                </p>
                <p className="mt-1 text-xs font-semibold text-[#456589]">
                  {item.temperature}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase text-[#9aacc2]">
                  SpO₂
                </p>
                <p className="mt-1 text-xs font-semibold text-[#456589]">
                  {item.oxygen}
                </p>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="flex w-full items-center justify-center gap-1 pt-1 text-xs font-medium text-[#2d91e8] hover:text-[#187fd8]"
        >
          View all vitals
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}