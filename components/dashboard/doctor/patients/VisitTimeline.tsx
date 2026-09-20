
import Link from "next/link";
import { ChevronRight, Clock3 } from "lucide-react";
import type { VisitRecord } from "@/lib/patients/patient-types";

interface Props {
  visits: VisitRecord[];
  patientId: string;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function VisitTimeline({
  visits,
  patientId,
}: Props) {
  return (
    <section className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)] sm:p-6">
      <div>
        <h2 className="font-bold text-[#102a56]">
          Visit History
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Recent consultations and clinical encounters
        </p>
      </div>

      <div className="mt-6 space-y-0">
        {visits.slice(0, 5).map((visit, index) => (
          <div
            key={visit.id}
            className="flex gap-4 pb-6 last:pb-0"
          >
            <div className="flex w-8 shrink-0 flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Clock3 className="h-4 w-4" />
              </div>

              {index < Math.min(visits.length, 5) - 1 && (
                <div className="h-full w-px bg-blue-100" />
              )}
            </div>

            <div className="flex-1 rounded-xl border border-blue-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#102a56]">
                    {visit.reason}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    {formatDate(visit.date)} •{" "}
                    {visit.doctorName}
                  </p>
                </div>

                <Link
                  href={`/doctor/medical-records?patientId=${patientId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600"
                >
                  View notes
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {visit.diagnosis && (
                <p className="mt-3 text-xs font-medium text-[#54709c]">
                  Diagnosis: {visit.diagnosis}
                </p>
              )}

              {visit.notes && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {visit.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Link
        href={`/doctor/medical-records?patientId=${patientId}`}
        className="mt-5 flex items-center justify-center gap-1 rounded-lg bg-blue-50 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
      >
        View full history
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

