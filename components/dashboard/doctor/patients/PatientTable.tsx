"use client";

import Link from "next/link";
import {
  CalendarPlus,
  ChevronRight,
  MessageSquare,
  MoreHorizontal,
  UserRound,
} from "lucide-react";
import type { Patient } from "@/lib/patients/patient-types";

interface PatientTableProps {
  patients: Patient[];
}

function statusClasses(status: Patient["status"]) {
  switch (status) {
    case "Admitted":
      return "bg-red-50 text-red-600";
    case "Discharged":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-50 text-blue-600";
  }
}

function formatDate(date?: string) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function PatientTable({
  patients,
}: PatientTableProps) {
  return (
    <div className="hidden overflow-x-auto lg:block">
      <table className="w-full min-w-[950px]">
        <thead>
          <tr className="border-b border-blue-50 text-left">
            <th className="px-4 py-4 text-xs font-semibold text-slate-400">
              Patient
            </th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-400">
              Age / Gender
            </th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-400">
              Patient ID
            </th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-400">
              Last Visit
            </th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-400">
              Next Appointment
            </th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-400">
              Status
            </th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-400">
              Ward / Bed
            </th>
            <th className="px-4 py-4 text-xs font-semibold text-slate-400">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {patients.map((patient) => (
            <tr
              key={patient.id}
              className="group border-b border-blue-50 last:border-0 hover:bg-blue-50/30"
            >
              <td className="px-4 py-4">
                <Link
                  href={`/doctor/patients/${patient.id}`}
                  className="flex items-center gap-3 focus:outline-none"
                >
                  {patient.avatar ? (
                    <img
                      src={patient.avatar}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      {patient.name
                        .split(" ")
                        .map((name) => name[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-[#102a56]">
                      {patient.name}
                    </p>

                    {patient.flagged && (
                      <p className="mt-0.5 text-[11px] font-medium text-red-500">
                        Clinical flag
                      </p>
                    )}
                  </div>
                </Link>
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                {patient.age} years
                <span className="mx-1 text-slate-300">•</span>
                {patient.gender}
              </td>

              <td className="px-4 py-4 text-sm font-medium text-[#54709c]">
                #{patient.id}
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                {formatDate(patient.lastVisit)}
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                {patient.nextAppointment
                  ? formatDate(patient.nextAppointment)
                  : "None"}
              </td>

              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClasses(
                    patient.status,
                  )}`}
                >
                  {patient.status}
                </span>
              </td>

              <td className="px-4 py-4 text-sm text-slate-500">
                {patient.ward ? (
                  <span>
                    {patient.ward}
                    <span className="block text-xs text-slate-400">
                      Bed {patient.bed}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </td>

              <td className="px-4 py-4">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/doctor/patients/${patient.id}`}
                    title="View chart"
                    className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <UserRound className="h-4 w-4" />
                  </Link>

                  <button
                    type="button"
                    title="Book appointment"
                    onClick={() =>
                      console.log("Book appointment:", patient.id)
                    }
                    className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <CalendarPlus className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    title="Message patient"
                    onClick={() =>
                      console.log("Message patient:", patient.id)
                    }
                    className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>

                  <ChevronRight className="ml-1 h-4 w-4 text-slate-300" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

