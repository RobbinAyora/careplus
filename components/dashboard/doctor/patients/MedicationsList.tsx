
import Link from "next/link";
import { ChevronRight, Pill } from "lucide-react";
import type { Medication } from "@/lib/patients/patient-types";

interface Props {
  medications: Medication[];
  patientId: string;
}

export default function MedicationsList({
  medications,
  patientId,
}: Props) {
  return (
    <section className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#102a56]">
            Current Medications
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Active prescriptions
          </p>
        </div>

        <Pill className="h-5 w-5 text-blue-500" />
      </div>

      <div className="mt-5 space-y-3">
        {medications.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
            No active medications.
          </p>
        ) : (
          medications.map((medication) => (
            <div
              key={medication.id}
              className="rounded-xl border border-blue-50 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#102a56]">
                    {medication.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {medication.dosage} •{" "}
                    {medication.frequency}
                  </p>
                </div>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                  Active
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <Link
        href={`/doctor/prescriptions?patientId=${patientId}`}
        className="mt-4 flex items-center justify-center gap-1 rounded-lg bg-blue-50 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
      >
        View full prescriptions
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

