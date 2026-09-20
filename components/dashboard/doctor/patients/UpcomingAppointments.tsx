
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import type { Appointment } from "@/lib/patients/patient-types";

interface Props {
  appointments: Appointment[];
}

export default function UpcomingAppointments({
  appointments,
}: Props) {
  return (
    <section className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#102a56]">
            Upcoming Appointments
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Scheduled consultations
          </p>
        </div>

        <Calendar className="h-5 w-5 text-blue-500" />
      </div>

      <div className="mt-5 space-y-3">
        {appointments.length === 0 ? (
          <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-400">
            No upcoming appointments.
          </p>
        ) : (
          appointments.map((appointment) => (
            <Link
              key={appointment.id}
              href={`/doctor/appointments/${appointment.id}`}
              className="block rounded-xl border border-blue-50 p-4 transition hover:border-blue-100 hover:bg-blue-50/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#102a56]">
                    {appointment.reason}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {appointment.date} •{" "}
                    {appointment.time}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    {appointment.doctorName}
                  </p>
                </div>

                <ChevronRight className="h-4 w-4 text-slate-300" />
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

