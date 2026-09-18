"use client";

import {
  CalendarDays,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";

import AppointmentFilters from "./AppointmentFilters";
import AppointmentList from "./AppointmentList";
import ConsultationView from "./ConsultationView";
import {
  appointments as initialAppointments,
  type Appointment,
} from "./appointments-data";

type StatusFilter =
  | "all"
  | "checked_in"
  | "in_progress"
  | "scheduled"
  | "completed"
  | "no_show"
  | "cancelled";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState(
    initialAppointments,
  );

  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [status, setStatus] =
    useState<StatusFilter>("all");

  const [search, setSearch] = useState("");

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return appointments
      .filter((appointment) => {
        if (
          status !== "all" &&
          appointment.status !== status
        ) {
          return false;
        }

        if (!normalizedSearch) {
          return true;
        }

        return (
          appointment.patientName
            .toLowerCase()
            .includes(normalizedSearch) ||
          appointment.patientId
            .toLowerCase()
            .includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
        // Checked-in patients always appear first.
        if (
          a.status === "checked_in" &&
          b.status !== "checked_in"
        ) {
          return -1;
        }

        if (
          b.status === "checked_in" &&
          a.status !== "checked_in"
        ) {
          return 1;
        }

        return (
          new Date(a.scheduledAt).getTime() -
          new Date(b.scheduledAt).getTime()
        );
      });
  }, [appointments, search, status]);

  const waitingCount = appointments.filter(
    (appointment) => appointment.status === "checked_in",
  ).length;

  function handleComplete(appointment: Appointment) {
    setAppointments((current) =>
      current.map((item) =>
        item.id === appointment.id
          ? {
              ...item,
              status: "completed",
            }
          : item,
      ),
    );
  }

  function handleAddNote(appointment: Appointment) {
    const note = window.prompt(
      `Quick note for ${appointment.patientName}`,
    );

    if (!note?.trim()) {
      return;
    }

    setAppointments((current) =>
      current.map((item) =>
        item.id === appointment.id
          ? {
              ...item,
              notes: note.trim(),
            }
          : item,
      ),
    );
  }

  if (selectedAppointment) {
    return (
      <ConsultationView
        appointment={selectedAppointment}
        onBack={() => setSelectedAppointment(null)}
        onComplete={() => {
          handleComplete(selectedAppointment);
          setSelectedAppointment(null);
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 lg:px-6 xl:px-8">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#102f5f]">
            Appointments
          </h1>

          <p className="mt-1 text-sm text-[#55749c]">
            Your schedule for today
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Date tabs */}
          <div className="flex overflow-hidden rounded-xl border border-[#dce8f5] bg-white shadow-sm">
            {["Today", "This week", "All upcoming"].map(
              (item, index) => (
                <button
                  key={item}
                  type="button"
                  className={`
                    px-4
                    py-2.5
                    text-xs
                    font-medium
                    transition
                    ${
                      index === 0
                        ? "bg-[#2d91e8] text-white"
                        : "text-[#55749c] hover:bg-[#f1f7fe]"
                    }
                  `}
                >
                  {item}
                </button>
              ),
            )}
          </div>

          {/* Date picker */}
          <button
            type="button"
            className="flex h-[42px] items-center justify-between gap-3 rounded-xl border border-[#dce8f5] bg-white px-4 text-xs font-medium text-[#294b76] shadow-sm"
          >
            <CalendarDays
              size={16}
              className="text-[#1677d2]"
            />

            <span>Tue, Sep 16, 2025</span>

            <ChevronDown size={15} />
          </button>

          {/* New appointment */}
          <button
            type="button"
            className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-[#2d91e8] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#187fd8] focus:outline-none focus:ring-2 focus:ring-[#2d91e8]/40"
          >
            <Plus size={18} />
            New Appointment
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_315px]">
        <main className="min-w-0">
          <AppointmentFilters
            status={status}
            onStatusChange={setStatus}
            search={search}
            onSearchChange={setSearch}
            waitingCount={waitingCount}
          />

          <div className="mt-5">
            <AppointmentList
              appointments={filteredAppointments}
              onOpen={setSelectedAppointment}
              onAddNote={handleAddNote}
              onComplete={handleComplete}
            />
          </div>
        </main>

        {/* Right rail */}
        <aside className="space-y-5">
          {/* Quick actions */}
          <section className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)]">
            <h2 className="font-semibold text-[#102f5f]">
              Quick Actions
            </h2>

            <div className="mt-4 space-y-2">
              {[
                "View Patient Records",
                "Order Lab Tests",
                "Prescribe Medication",
              ].map((action) => (
                <button
                  key={action}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-[#e4edf7] px-4 py-3 text-left text-sm font-medium text-[#294b76] transition hover:bg-[#f5f9ff]"
                >
                  <span>{action}</span>
                  <span className="text-[#7b99ba]">›</span>
                </button>
              ))}
            </div>
          </section>

          {/* Calendar */}
          <section className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#102f5f]">
                September 2025
              </h2>

              <div className="flex gap-1">
                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[#7891b1] hover:bg-[#f1f7fe]"
                >
                  ‹
                </button>

                <button
                  type="button"
                  className="rounded-lg p-1.5 text-[#7891b1] hover:bg-[#f1f7fe]"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-y-3 text-center">
              {[
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun",
              ].map((day) => (
                <span
                  key={day}
                  className="text-[10px] font-medium text-[#8ca1ba]"
                >
                  {day}
                </span>
              ))}

              {Array.from({ length: 30 }, (_, index) => {
                const day = index + 1;

                return (
                  <button
                    key={day}
                    type="button"
                    className={`
                      mx-auto
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-full
                      text-xs
                      ${
                        day === 16
                          ? "bg-[#2d91e8] font-semibold text-white"
                          : "text-[#456486] hover:bg-[#edf6ff]"
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Help */}
          <section className="rounded-2xl bg-[#e7f3ff] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#168bea]">
              ?
            </div>

            <h2 className="mt-4 font-semibold text-[#102f5f]">
              Need help?
            </h2>

            <p className="mt-1 text-sm leading-5 text-[#55749c]">
              Contact support for any issues or assistance.
            </p>

            <button
              type="button"
              className="mt-4 text-sm font-semibold text-[#1677d2]"
            >
              Get Support →
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}