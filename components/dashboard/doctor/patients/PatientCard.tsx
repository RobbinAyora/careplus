"use client";

import Link from "next/link";
import {
  Calendar,
  CalendarPlus,
  ChevronRight,
  MessageSquare,
  Phone,
} from "lucide-react";
import type { Patient } from "@/lib/patients/patient-types";

interface PatientCardProps {
  patient: Patient;
}

function formatDate(date?: string) {
  if (!date) return "None";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function PatientCard({
  patient,
}: PatientCardProps) {
  return (
    <div className="rounded-xl border border-blue-50 bg-white p-4 shadow-sm lg:hidden">
      <Link
        href={`/doctor/patients/${patient.id}`}
        className="flex items-start gap-3"
      >
        {patient.avatar ? (
          <img
            src={patient.avatar}
            alt=""
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
            {patient.name
              .split(" ")
              .map((name) => name[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#102a56]">
                {patient.name}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                #{patient.id} • {patient.age} years • {patient.gender}
              </p>
            </div>

            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
          </div>
        </div>
      </Link>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-slate-400">Last visit</p>
          <p className="mt-1 font-medium text-[#102a56]">
            {formatDate(patient.lastVisit)}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-slate-400">Next appointment</p>
          <p className="mt-1 font-medium text-[#102a56]">
            {patient.nextAppointment
              ? formatDate(patient.nextAppointment)
              : "None"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            patient.status === "Admitted"
              ? "bg-red-50 text-red-600"
              : patient.status === "Discharged"
                ? "bg-slate-100 text-slate-600"
                : "bg-blue-50 text-blue-600"
          }`}
        >
          {patient.status}
        </span>

        {patient.ward && (
          <span className="text-xs text-slate-400">
            {patient.ward} / {patient.bed}
          </span>
        )}
      </div>

      {(patient.allergies.length > 0 ||
        patient.chronicConditions.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {patient.allergies.map((allergy) => (
            <span
              key={allergy}
              className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-semibold text-red-600"
            >
              Allergy: {allergy}
            </span>
          ))}

          {patient.chronicConditions.map((condition) => (
            <span
              key={condition}
              className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-600"
            >
              {condition}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex gap-2 border-t border-blue-50 pt-3">
        <Link
          href={`/doctor/patients/${patient.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 py-2 text-xs font-semibold text-blue-600"
        >
          View Chart
        </Link>

        <button
          type="button"
          onClick={() =>
            console.log("Book appointment:", patient.id)
          }
          className="rounded-lg border border-blue-100 p-2 text-blue-600"
          aria-label={`Book appointment for ${patient.name}`}
        >
          <CalendarPlus className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() =>
            console.log("Message patient:", patient.id)
          }
          className="rounded-lg border border-blue-100 p-2 text-blue-600"
          aria-label={`Message ${patient.name}`}
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

