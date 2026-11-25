"use client";

import {
  CalendarDays,
  ChevronDown,
  Plus,
  Search,
  X,
  UserRound,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useApiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session";

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

interface PatientSearchResult {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  dateOfBirth?: string | null;
  estimatedAgeYears?: number | null;
  sex?: string | null;
  phone?: string | null;
  isTemporary?: boolean;
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

function getLocalDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 30);

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);

  return localDate.toISOString().slice(0, 16);
}

function getPatientName(patient: PatientSearchResult) {
  return [
    patient.firstName,
    patient.otherNames,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function AppointmentsPage() {
  const apiRequest = useApiClient();
  const { user } = useAuth();

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

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<
    PatientSearchResult[]
  >([]);
  const [selectedPatient, setSelectedPatient] =
    useState<PatientSearchResult | null>(null);

  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState("");

  const [scheduledAt, setScheduledAt] = useState(
    getLocalDateTimeValue,
  );
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [appointmentReason, setAppointmentReason] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState("");

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

        const response = await apiRequest<
          AppointmentPageResponse | unknown[]
        >(`/appointments?${params.toString()}`);

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

  // Search patients after the doctor enters at least two characters.
  useEffect(() => {
    if (!showBookingModal || selectedPatient) {
      return;
    }

    const query = patientSearch.trim();

    if (query.length < 2) {
      setPatientResults([]);
      setPatientSearchError("");
      setSearchingPatients(false);
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setSearchingPatients(true);
      setPatientSearchError("");

      try {
        const response = await apiRequest<unknown>(
          `/patients/search?q=${encodeURIComponent(query)}`,
        );

        if (cancelled) return;

        const results = Array.isArray(response)
          ? (response as PatientSearchResult[])
          : [];

        // Temporary patients cannot be used to create appointments.
        setPatientResults(
          results.filter(
            (patient) =>
              patient &&
              typeof patient.id === "string" &&
              !patient.isTemporary,
          ),
        );
      } catch (err) {
        if (cancelled) return;

        setPatientResults([]);
        setPatientSearchError(
          err instanceof Error
            ? err.message
            : "Unable to search for patients.",
        );
      } finally {
        if (!cancelled) {
          setSearchingPatients(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [
    apiRequest,
    patientSearch,
    selectedPatient,
    showBookingModal,
  ]);

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

  function resetBookingForm() {
    setPatientSearch("");
    setPatientResults([]);
    setSelectedPatient(null);
    setPatientSearchError("");

    setScheduledAt(getLocalDateTimeValue());
    setDurationMinutes("30");
    setAppointmentReason("");

    setBookingError("");
    setBookingSuccess("");
  }

  function openBookingModal() {
    resetBookingForm();
    setShowBookingModal(true);
  }

  function closeBookingModal() {
    if (bookingLoading) return;

    setShowBookingModal(false);
    resetBookingForm();
  }

  async function handleCreateAppointment() {
    setBookingError("");
    setBookingSuccess("");

    if (!user?.id) {
      setBookingError(
        "Your session could not be verified. Please sign in again.",
      );
      return;
    }

    if (!selectedPatient) {
      setBookingError("Please select a patient.");
      return;
    }

    if (!scheduledAt) {
      setBookingError("Please select an appointment date and time.");
      return;
    }

    const appointmentDate = new Date(scheduledAt);

    if (Number.isNaN(appointmentDate.getTime())) {
      setBookingError("Please enter a valid appointment date and time.");
      return;
    }

    if (appointmentDate <= new Date()) {
      setBookingError("Appointment date and time must be in the future.");
      return;
    }

    const duration = Number(durationMinutes);

    if (
      !Number.isInteger(duration) ||
      duration < 5 ||
      duration > 240
    ) {
      setBookingError(
        "Appointment duration must be between 5 and 240 minutes.",
      );
      return;
    }

    setBookingLoading(true);

    try {
      await apiRequest("/appointments", {
        method: "POST",
        body: {
          patientId: selectedPatient.id,
          doctorId: user.id,
          scheduledAt: appointmentDate.toISOString(),
          durationMinutes: duration,
          reason: appointmentReason.trim() || undefined,
        },
        retryWrites: true,
      });

      setBookingSuccess("Appointment booked successfully.");
      setShowBookingModal(false);
      resetBookingForm();

      // Show the newly booked appointment even if it is not scheduled
      // for the currently selected Today or This week view.
      if (dateRange === "upcoming") {
        await loadAppointments();
      } else {
        setDateRange("upcoming");
      }
    } catch (err) {
      setBookingError(
        err instanceof Error
          ? err.message
          : "Unable to book this appointment.",
      );
    } finally {
      setBookingLoading(false);
    }
  }

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
            Your schedule for{" "}
            {dateRange === "today"
              ? "today"
              : dateRange === "week"
                ? "this week"
                : "all upcoming appointments"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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

          {/* Book appointment */}
          <button
            type="button"
            onClick={openBookingModal}
            className="flex h-[42px] items-center justify-center gap-2 rounded-xl bg-[#2d91e8] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1677d2]"
          >
            <Plus size={16} />
            Book Appointment
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {bookingSuccess && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {bookingSuccess}
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

      {/* Booking modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#102f5f]/40 p-4 backdrop-blur-[2px]">
          <div className="my-auto w-full max-w-[560px] rounded-2xl border border-[#e3edf8] bg-white shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-[#e8eff7] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[#102f5f]">
                  Book Appointment
                </h2>
                <p className="mt-1 text-sm text-[#7891b1]">
                  Schedule an appointment with a patient.
                </p>
              </div>

              <button
                type="button"
                onClick={closeBookingModal}
                disabled={bookingLoading}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#7891b1] transition hover:bg-[#f1f7fe] hover:text-[#102f5f] disabled:opacity-50"
                aria-label="Close booking modal"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              {/* Patient selection */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#294b76]">
                  Select Patient
                </label>

                {selectedPatient ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#b9dcfa] bg-[#f1f8ff] p-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#1677d2]">
                        <UserRound size={19} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#102f5f]">
                          {getPatientName(selectedPatient)}
                        </p>

                        <p className="mt-1 text-xs text-[#7891b1]">
                          {selectedPatient.patientNumber}
                          {selectedPatient.phone
                            ? ` · ${selectedPatient.phone}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearch("");
                        setPatientResults([]);
                      }}
                      className="ml-3 shrink-0 text-xs font-semibold text-[#1677d2] hover:text-[#102f5f]"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ca1ba]"
                      />

                      <input
                        type="text"
                        value={patientSearch}
                        onChange={(event) =>
                          setPatientSearch(event.target.value)
                        }
                        placeholder="Search by patient name, number or phone..."
                        className="h-11 w-full rounded-xl border border-[#dce8f5] bg-white pl-10 pr-4 text-sm text-[#294b76] outline-none transition placeholder:text-[#9aacc1] focus:border-[#2d91e8] focus:ring-2 focus:ring-[#2d91e8]/10"
                      />
                    </div>

                    <p className="mt-2 text-xs text-[#8ca1ba]">
                      Enter at least 2 characters to search patients.
                    </p>

                    {searchingPatients && (
                      <p className="mt-3 text-sm text-[#7891b1]">
                        Searching patients...
                      </p>
                    )}

                    {patientSearchError && (
                      <p className="mt-3 text-sm text-red-600">
                        {patientSearchError}
                      </p>
                    )}

                    {!searchingPatients &&
                      !patientSearchError &&
                      patientSearch.trim().length >= 2 &&
                      patientResults.length === 0 && (
                        <p className="mt-3 rounded-lg bg-[#f7faff] p-3 text-sm text-[#7891b1]">
                          No eligible patients found.
                        </p>
                      )}

                    {patientResults.length > 0 && (
                      <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-[#e3edf8]">
                        {patientResults.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setPatientResults([]);
                              setPatientSearch("");
                            }}
                            className="flex w-full items-center justify-between border-b border-[#edf2f8] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#f1f8ff]"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#294b76]">
                                {getPatientName(patient)}
                              </p>

                              <p className="mt-1 text-xs text-[#8ca1ba]">
                                {patient.patientNumber}
                                {patient.phone
                                  ? ` · ${patient.phone}`
                                  : ""}
                              </p>
                            </div>

                            <span className="ml-3 shrink-0 text-xs font-semibold text-[#1677d2]">
                              Select
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Appointment date and time */}
              <div>
                <label
                  htmlFor="appointment-scheduled-at"
                  className="mb-2 block text-sm font-semibold text-[#294b76]"
                >
                  Appointment Date and Time
                </label>

                <input
                  id="appointment-scheduled-at"
                  type="datetime-local"
                  value={scheduledAt}
                  min={getLocalDateTimeValue()}
                  onChange={(event) =>
                    setScheduledAt(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#dce8f5] bg-white px-4 text-sm text-[#294b76] outline-none transition focus:border-[#2d91e8] focus:ring-2 focus:ring-[#2d91e8]/10"
                />
              </div>

              {/* Duration */}
              <div>
                <label
                  htmlFor="appointment-duration"
                  className="mb-2 block text-sm font-semibold text-[#294b76]"
                >
                  Duration
                </label>

                <select
                  id="appointment-duration"
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#dce8f5] bg-white px-4 text-sm text-[#294b76] outline-none transition focus:border-[#2d91e8] focus:ring-2 focus:ring-[#2d91e8]/10"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1 hour 30 minutes</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label
                  htmlFor="appointment-reason"
                  className="mb-2 block text-sm font-semibold text-[#294b76]"
                >
                  Reason for Appointment{" "}
                  <span className="font-normal text-[#8ca1ba]">
                    (Optional)
                  </span>
                </label>

                <textarea
                  id="appointment-reason"
                  value={appointmentReason}
                  onChange={(event) =>
                    setAppointmentReason(event.target.value.slice(0, 500))
                  }
                  rows={3}
                  maxLength={500}
                  placeholder="Enter the reason for this appointment..."
                  className="w-full resize-none rounded-xl border border-[#dce8f5] bg-white px-4 py-3 text-sm text-[#294b76] outline-none transition placeholder:text-[#9aacc1] focus:border-[#2d91e8] focus:ring-2 focus:ring-[#2d91e8]/10"
                />

                <p className="mt-1 text-right text-xs text-[#9aacc1]">
                  {appointmentReason.length}/500
                </p>
              </div>

              {bookingError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {bookingError}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-[#e8eff7] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  disabled={bookingLoading}
                  className="h-11 rounded-xl border border-[#dce8f5] px-5 text-sm font-semibold text-[#55749c] transition hover:bg-[#f7faff] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleCreateAppointment();
                  }}
                  disabled={bookingLoading || !selectedPatient}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2d91e8] px-5 text-sm font-semibold text-white transition hover:bg-[#1677d2] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bookingLoading ? (
                    "Booking..."
                  ) : (
                    <>
                      <Plus size={16} />
                      Book Appointment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {actionLoading && (
        <div className="fixed bottom-5 right-5 rounded-xl bg-[#102f5f] px-4 py-3 text-sm font-medium text-white shadow-lg">
          Updating consultation...
        </div>
      )}
    </div>
  );
}
