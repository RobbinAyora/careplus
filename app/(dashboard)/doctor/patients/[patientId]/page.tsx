import { notFound } from "next/navigation";

import PatientDetailHeader from "@/components/dashboard/doctor/patients/PatientDetailHeader";
import VitalsSnapshot from "@/components/dashboard/doctor/patients/VitalsSnapshot";
import MedicationsList from "@/components/dashboard/doctor/patients/MedicationsList";
import VisitTimeline from "@/components/dashboard/doctor/patients/VisitTimeline";
import UpcomingAppointments from "@/components/dashboard/doctor/patients/UpcomingAppointments";
import DocumentsList from "@/components/dashboard/doctor/patients/DocumentsList";

import { getPatientSummary } from "@/lib/patients/mock-patients";

interface Props {
params: Promise<{
patientId: string;
}>;
}

export default async function PatientDetailPage({ params }: Props) {
const { patientId } = await params;

const summary = getPatientSummary(patientId);

if (!summary) {
notFound();
}

const { patient } = summary;

return ( <main className="min-h-full bg-[#f8fbff] px-4 pb-10 pt-4 sm:px-6 lg:px-8">
{/* Patient header + quick actions */} <PatientDetailHeader patient={patient} />

```
  <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
    {/* Main clinical information */}
    <div className="space-y-5">
      <VitalsSnapshot vitals={summary.latestVitals} />

      <VisitTimeline
        visits={summary.visitHistory}
        patientId={patient.id}
      />

      <DocumentsList documents={summary.recentDocuments} />
    </div>

    {/* Right sidebar */}
    <div className="space-y-5">
      <MedicationsList
        medications={summary.currentMedications}
        patientId={patient.id}
      />

      <UpcomingAppointments
        appointments={summary.upcomingAppointments}
      />

      {/* Clinical alerts */}
      <section className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)] sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#102a56]">
            Clinical Alerts
          </h2>

          {(patient.allergies.length > 0 ||
            patient.chronicConditions.length > 0) && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
              Attention
            </span>
          )}
        </div>

        <div className="mt-4 space-y-3">
          {/* Allergies */}
          {patient.allergies.map((allergy) => (
            <div
              key={`allergy-${allergy}`}
              className="rounded-xl border border-red-100 bg-red-50 p-4"
            >
              <p className="text-xs font-semibold text-red-600">
                Allergy
              </p>

              <p className="mt-1 text-sm font-bold text-red-700">
                {allergy}
              </p>
            </div>
          ))}

          {/* Chronic conditions */}
          {patient.chronicConditions.map((condition) => (
            <div
              key={`condition-${condition}`}
              className="rounded-xl border border-amber-100 bg-amber-50 p-4"
            >
              <p className="text-xs font-semibold text-amber-600">
                Chronic Condition
              </p>

              <p className="mt-1 text-sm font-bold text-amber-700">
                {condition}
              </p>
            </div>
          ))}

          {/* No alerts */}
          {patient.allergies.length === 0 &&
            patient.chronicConditions.length === 0 && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-600">
                  No active clinical alerts
                </p>
              </div>
            )}
        </div>
      </section>
    </div>
  </div>
</main>


);
}




