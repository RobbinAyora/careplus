"use client";

import {
  ClipboardList,
  FileText,
  FlaskConical,
  Image,
  Pill,
  Save,
} from "lucide-react";
import { useState } from "react";

import type { Appointment } from "./appointments-data";
import PatientSnapshot from "./PatientSnapshot";

type ConsultationViewProps = {
  appointment: Appointment;
  onBack: () => void;
  onComplete: () => void;
};

export default function ConsultationView({
  appointment,
  onBack,
  onComplete,
}: ConsultationViewProps) {
  const [notes, setNotes] = useState(appointment.notes ?? "");

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 lg:px-6 xl:px-8">
      <PatientSnapshot
        appointment={appointment}
        onBack={onBack}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_315px]">
        <main className="space-y-5">
          {/* Visit context */}
          <section className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#8aa0ba]">
                  Visit Context
                </p>

                <h2 className="mt-1 text-lg font-semibold text-[#102f5f]">
                  {appointment.reason}
                </h2>
              </div>

              <span className="rounded-full bg-[#e1efff] px-3 py-1.5 text-xs font-medium text-[#1677d2]">
                {new Date(appointment.scheduledAt).toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </span>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto border-b border-[#e8eff7]">
              {[
                "Past Medical Records",
                "Past Prescriptions",
                "Lab Results",
                "Radiology",
              ].map((item, index) => (
                <button
                  key={item}
                  type="button"
                  className={`
                    shrink-0
                    border-b-2
                    px-3
                    pb-3
                    text-xs
                    font-medium
                    ${
                      index === 0
                        ? "border-[#2d91e8] text-[#1677d2]"
                        : "border-transparent text-[#7891b1] hover:text-[#1677d2]"
                    }
                  `}
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          {/* Consultation workspace */}
          <section className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)] sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f3ff] text-[#1677d2]">
                <ClipboardList size={20} />
              </div>

              <div>
                <h2 className="font-semibold text-[#102f5f]">
                  Consultation Notes
                </h2>

                <p className="text-xs text-[#7891b1]">
                  Document findings, diagnosis and treatment plan.
                </p>
              </div>
            </div>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Enter consultation notes, diagnosis, observations and treatment plan..."
              className="
                mt-5
                min-h-[280px]
                w-full
                resize-y
                rounded-xl
                border
                border-[#dce8f5]
                bg-[#fbfdff]
                p-4
                text-sm
                leading-6
                text-[#294b76]
                outline-none
                placeholder:text-[#9aacc1]
                focus:border-[#5aa7ef]
                focus:ring-2
                focus:ring-[#2d91e8]/10
              "
            />

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[#dce8f5] px-4 py-2.5 text-sm font-medium text-[#294b76] transition hover:bg-[#f4f9ff]"
              >
                <Save size={16} />
                Save Notes
              </button>
            </div>
          </section>
        </main>

        {/* Right actions */}
        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)]">
            <h2 className="font-semibold text-[#102f5f]">
              Consultation Actions
            </h2>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-[#dce8f5] px-4 py-3 text-left text-sm font-medium text-[#294b76] transition hover:bg-[#f4f9ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf4ff] text-[#1677d2]">
                  <FlaskConical size={18} />
                </span>

                <span>Order Lab Test</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-[#dce8f5] px-4 py-3 text-left text-sm font-medium text-[#294b76] transition hover:bg-[#f4f9ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f1ebff] text-[#7c3aed]">
                  <Image size={18} />
                </span>

                <span>Order Imaging</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-xl border border-[#dce8f5] px-4 py-3 text-left text-sm font-medium text-[#294b76] transition hover:bg-[#f4f9ff]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eaf9f0] text-[#16a34a]">
                  <Pill size={18} />
                </span>

                <span>Write Prescription</span>
              </button>
            </div>
          </section>

          <section className="rounded-2xl bg-[#e7f3ff] p-5">
            <p className="text-xs font-medium text-[#52739c]">
              Complete visit
            </p>

            <p className="mt-1 text-sm leading-5 text-[#365d8c]">
              Completing the consultation will close the appointment and
              create the corresponding billing item.
            </p>

            <button
              type="button"
              onClick={onComplete}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2d91e8] text-sm font-semibold text-white shadow-sm transition hover:bg-[#187fd8] focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
            >
              <FileText size={17} />
              Mark Consultation Complete
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}