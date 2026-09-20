"use client";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarPlus,
  Mail,
  Phone,
  Pill,
  FlaskConical,
  FilePlus2,
} from "lucide-react";
import type { Patient } from "@/lib/patients/patient-types";

interface Props {
  patient: Patient;
}

export default function PatientDetailHeader({
  patient,
}: Props) {
  return (
    <>
      <Link
        href="/doctor/patients"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#54709c] transition hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patients
      </Link>

      <section className="mt-4 rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)] sm:p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            {patient.avatar ? (
              <img
                src={patient.avatar}
                alt=""
                className="h-20 w-20 rounded-full object-cover ring-4 ring-blue-50"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600 ring-4 ring-blue-50">
                {patient.name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
                  .slice(0, 2)}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-[#102a56]">
                  {patient.name}
                </h1>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                  #{patient.id}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-500">
                {patient.age} years • {patient.gender}
              </p>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-blue-500" />
                  {patient.phone}
                </span>

                {patient.email && (
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                    {patient.email}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {patient.allergies.map((allergy) => (
                  <span
                    key={allergy}
                    className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                  >
                    Allergy: {allergy}
                  </span>
                ))}

                {patient.chronicConditions.map(
                  (condition) => (
                    <span
                      key={condition}
                      className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600"
                    >
                      {condition}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[500px]">
            <Link
              href={`/doctor/prescriptions/new?patientId=${patient.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-3 text-xs font-semibold text-white hover:bg-blue-700"
            >
              <Pill className="h-4 w-4" />
              Prescription
            </Link>

            <Link
              href={`/doctor/laboratory/new?patientId=${patient.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              <FlaskConical className="h-4 w-4" />
              Lab Test
            </Link>

            <button
              type="button"
              onClick={() =>
                console.log("Add clinical note:", patient.id)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              <FilePlus2 className="h-4 w-4" />
              Clinical Note
            </button>

            <Link
              href={`/doctor/appointments/new?patientId=${patient.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              <CalendarPlus className="h-4 w-4" />
              Follow-up
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

