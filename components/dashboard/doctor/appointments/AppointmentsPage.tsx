
"use client";

import {
  CalendarDays,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useApiClient } from "@/lib/api/client";

import AppointmentFilters from "./AppointmentFilters";
import AppointmentList from "./AppointmentList";
import ConsultationView from "./ConsultationView";
import {
  normalizeAppointmentPage,
  type Appointment,
} from "./appointments-data";

type StatusFilter =
  | "all"
  | "checked_in"
  | "confirmed"
  | "scheduled"
  | "completed"
  | "no_show"
  | "cancelled";

type DateRange = "today" | "week" | "upcoming";

interface AppointmentPageResponse {
  data?: unknown[];
  nextCursor?: string | null;
  hasMore?: boolean;
}

function getDateRange(range: DateRange) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  start.setHours(0, 0, 0, 0);

  if (range === "today") {
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);
  } else if (range === "week") {
    const day = start.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;

    start.setDate(start.getDate() - daysSinceMonday);

    end.setTime(start.getTime());
    end.setDate(end.getDate() + 7);
  } else {
    start.setTime(now.getTime());
    end.setFullYear(end.getFullYear() + 1);
  }

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

function getApiStatus(status: StatusFilter): string | undefined {
  if (status === "all") return undefined;

  return status.toUpperCase();
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AppointmentsPage() {
  const apiRequest = useApiClient();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("today");

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const displayDate = useMemo(
    () => formatDate(new Date()),
    [],
  );

  const loadAppointments = useCallback(
    async (cursor?: string, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const range = getDateRange(dateRange);
        const params = new URLSearchParams();

        params.set("limit", "50");
        params.set("from", range.from);
        params.set("to", range.to);

        const apiStatus = getApiStatus(status);

        if (apiStatus) {
          params.set("status", apiStatus);
        }

        if (search.trim()) {
          params.set("q", search.trim());
        }

        if (cursor) {
          params.set("cursor", cursor);
        }

        const response = await apiRequest<AppointmentPageResponse | unknown[]>(
          `/appointments?${params.toString()}`,
        );

        const page = normalizeAppointmentPage(response);

        setAppointments((current) =>
          append ? [...current, ...page.data] : page.data,
        );

        setNextCursor(page.nextCursor ?? null);
        setHasMore(Boolean(page.hasMore));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load appointments.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiRequest, dateRange, search, status],
  );

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return [...appointments]
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
          appointment.patientNumber
            .toLowerCase()
            .includes(normalizedSearch)
        );
      })
      .sort((a, b) => {
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

  async function handleComplete(appointment: Appointment) {
    if (!appointment.visitId) {
      setError(
        "This appointment does not have an associated visit to complete.",
      );
      return;
    }

    setActionLoading(true);
    setError("");

    try {
      await apiRequest(
        `/doctors/me/visits/${appointment.visitId}/complete`,
        {
          method: "PATCH",
        },
      );

      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id
            ? { ...item, status: "completed" }
            : item,
        ),
      );

      setSelectedAppointment(null);
      await loadAppointments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete this consultation.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleAddNote(appointment: Appointment) {
    const note = window.prompt(
      `Quick note for ${appointment.patientName}`,
    );

    if (!note?.trim()) return;

    // Notes remain local because no notes-saving endpoint
    // has been provided by the backend.
    setAppointments((current) =>
      current.map((item) =>
        item.id === appointment.id
          ? { ...item, notes: note.trim() }
          : item,
      ),
    );

    setSelectedAppointment((current) =>
      current?.id === appointment.id
        ? { ...current, notes: note.trim() }
        : current,
    );
  }

  function handleDateRangeChange(range: DateRange) {
    setDateRange(range);
    setNextCursor(null);
  }

  if (selectedAppointment) {
    return (
      <ConsultationView
        appointment={selectedAppointment}
        onBack={() => setSelectedAppointment(null)}
        onComplete={() => {
          void handleComplete(selectedAppointment);
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
            Your schedule for {dateRange === "today" ? "today" : dateRange === "week" ? "this week" : "all upcoming appointments"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Date tabs */}
          <div className="flex overflow-hidden rounded-xl border border-[#dce8f5] bg-white shadow-sm">
            {(
              [
                ["today", "Today"],
                ["week", "This week"],
                ["upcoming", "All upcoming"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => handleDateRangeChange(value)}
                className={`
                  px-4 py-2.5 text-xs font-medium transition
                  ${
                    dateRange === value
                      ? "bg-[#2d91e8] text-white"
                      : "text-[#55749c] hover:bg-[#f1f7fe]"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Current date */}
          <div className="flex h-[42px] items-center justify-between gap-3 rounded-xl border border-[#dce8f5] bg-white px-4 text-xs font-medium text-[#294b76] shadow-sm">
            <CalendarDays
              size={16}
              className="text-[#1677d2]"
            />

            <span>{displayDate}</span>

            <ChevronDown size={15} />
          </div>

          {/* Existing booking action is not connected to a doctor-side
              booking form, so it is left out rather than showing an
              action that does nothing. */}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

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
            {loading ? (
              <div className="rounded-2xl border border-[#e3edf8] bg-white p-8 text-center text-sm text-[#55749c]">
                Loading appointments...
              </div>
            ) : (
              <>
                <AppointmentList
                  appointments={filteredAppointments}
                  onOpen={setSelectedAppointment}
                  onAddNote={handleAddNote}
                  onComplete={handleComplete}
                />

                {hasMore && nextCursor && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() => {
                        void loadAppointments(nextCursor, true);
                      }}
                      className="rounded-xl border border-[#dce8f5] bg-white px-5 py-2.5 text-sm font-semibold text-[#1677d2] transition hover:bg-[#f1f7fe] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingMore ? "Loading..." : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}
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
                <div
                  key={action}
                  className="flex w-full items-center justify-between rounded-xl border border-[#e4edf7] px-4 py-3 text-left text-sm font-medium text-[#7891b1]"
                >
                  <span>{action}</span>
                  <span>›</span>
                </div>
              ))}
            </div>
          </section>

          {/* Calendar */}
          <section className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)]">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[#102f5f]">
                {new Date().toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
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

              {(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = today.getMonth();
                const firstDay = new Date(year, month, 1);
                const daysInMonth = new Date(
                  year,
                  month + 1,
                  0,
                ).getDate();

                // Convert Sunday-first JS day to Monday-first.
                const offset = (firstDay.getDay() + 6) % 7;

                return (
                  <>
                    {Array.from({ length: offset }, (_, index) => (
                      <span key={`empty-${index}`} />
                    ))}

                    {Array.from(
                      { length: daysInMonth },
                      (_, index) => {
                        const day = index + 1;
                        const isToday = day === today.getDate();

                        return (
                          <span
                            key={day}
                            className={`
                              mx-auto flex h-8 w-8 items-center
                              justify-center rounded-full text-xs
                              ${
                                isToday
                                  ? "bg-[#2d91e8] font-semibold text-white"
                                  : "text-[#456486]"
                              }
                            `}
                          >
                            {day}
                          </span>
                        );
                      },
                    )}
                  </>
                );
              })()}
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

            <span className="mt-4 inline-block text-sm font-semibold text-[#1677d2]">
              Get Support →
            </span>
          </section>
        </aside>
      </div>

      {actionLoading && (
        <div className="fixed bottom-5 right-5 rounded-xl bg-[#102f5f] px-4 py-3 text-sm font-medium text-white shadow-lg">
          Updating consultation...
        </div>
      )}
    </div>
  );
}
