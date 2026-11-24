
"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { useApiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/session";
import {
  normalizeAppointmentPage,
  type Appointment,
} from "@/components/dashboard/doctor/appointments/appointments-data";


type Patient = {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  dateOfBirth?: string | null;
  estimatedAgeYears?: number | null;
  sex?: string;
  phone?: string | null;
  isTemporary: boolean;
};

type Doctor = {
  id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
};

type UnknownRecord = Record<string, unknown>;

type AppointmentStatus =
  | "ALL"
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object"
    ? (value as UnknownRecord)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getLocalDateTime(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  const offset = value.getTimezoneOffset() * 60000;

  return new Date(value.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function formatDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function normalizeDoctors(response: unknown): Doctor[] {
  const raw = asRecord(response);

  const rows = Array.isArray(response)
    ? response
    : Array.isArray(raw.data)
      ? raw.data
      : Array.isArray(raw.items)
        ? raw.items
        : [];

  return rows
    .map((item): Doctor | null => {
      const doctor = asRecord(item);
      const profile = asRecord(doctor.doctorProfile);

      if (typeof doctor.id !== "string") return null;

      return {
        id: doctor.id,
        firstName: asString(doctor.firstName),
        lastName: asString(doctor.lastName),
        specialization: asString(
          profile.specialization ?? doctor.specialization,
        ),
      };
    })
    .filter((doctor): doctor is Doctor => doctor !== null);
}

function normalizePatients(response: unknown): Patient[] {
  if (!Array.isArray(response)) return [];

  return response
    .map((item): Patient | null => {
      const patient = asRecord(item);

      if (
        typeof patient.id !== "string" ||
        typeof patient.patientNumber !== "string"
      ) {
        return null;
      }

      return {
        id: patient.id,
        patientNumber: patient.patientNumber,
        firstName: asString(patient.firstName),
        lastName: asString(patient.lastName),
        otherNames:
          typeof patient.otherNames === "string"
            ? patient.otherNames
            : null,
        dateOfBirth:
          typeof patient.dateOfBirth === "string"
            ? patient.dateOfBirth
            : null,
        estimatedAgeYears:
          typeof patient.estimatedAgeYears === "number"
            ? patient.estimatedAgeYears
            : null,
        sex: asString(patient.sex),
        phone:
          typeof patient.phone === "string" ? patient.phone : null,
        isTemporary: patient.isTemporary === true,
      };
    })
    .filter((patient): patient is Patient => patient !== null);
}

const statusLabels: Record<AppointmentStatus, string> = {
  ALL: "All statuses",
  SCHEDULED: "Scheduled",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked-in",
  COMPLETED: "Completed",
  NO_SHOW: "No-show",
  CANCELLED: "Cancelled",
};

export default function ReceptionistAppointmentsPage() {
  const apiRequest = useApiClient();
  const { isSessionLoaded, accessToken } = useAuth();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [status, setStatus] = useState<AppointmentStatus>("ALL");
  const [appointmentSearch, setAppointmentSearch] = useState("");

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Patient search
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<Patient | null>(null);
  const [searchingPatients, setSearchingPatients] = useState(false);

  // Booking form
  const [doctorId, setDoctorId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [reason, setReason] = useState("");

  // Rescheduling
  const [reschedulingAppointment, setReschedulingAppointment] =
    useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleDuration, setRescheduleDuration] = useState(30);

  const loadDoctors = useCallback(async () => {
    setLoadingDoctors(true);

    try {
      const response = await apiRequest<unknown>("/doctors");
      setDoctors(normalizeDoctors(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingDoctors(false);
    }
  }, [apiRequest]);

  const loadAppointments = useCallback(
    async (cursor?: string, append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const params = new URLSearchParams();
        params.set("limit", "50");

        if (status !== "ALL") {
          params.set("status", status);
        }

        const query = appointmentSearch.trim();

        if (query.length >= 2) {
          params.set("q", query);
        }

        if (cursor) {
          params.set("cursor", cursor);
        }

        const response = await apiRequest<unknown>(
          `/appointments?${params.toString()}`,
        );

        const result = normalizeAppointmentPage(response);

        setAppointments((current) =>
          append ? [...current, ...result.data] : result.data,
        );

        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [apiRequest, appointmentSearch, status],
  );

  useEffect(() => {
    if (!isSessionLoaded || !accessToken) return;

    void loadDoctors();
  }, [isSessionLoaded, accessToken, loadDoctors]);

  useEffect(() => {
    if (!isSessionLoaded || !accessToken) return;

    const timeout = window.setTimeout(
      () => void loadAppointments(),
      appointmentSearch.trim().length > 0 ? 350 : 0,
    );

    return () => window.clearTimeout(timeout);
  }, [
    isSessionLoaded,
    accessToken,
    loadAppointments,
    appointmentSearch,
  ]);

  useEffect(() => {
    if (!isSessionLoaded || !accessToken) return;

    const query = patientSearch.trim();

    if (query.length < 2) {
      setPatientResults([]);
      setSearchingPatients(false);
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setSearchingPatients(true);

      try {
        const response = await apiRequest<unknown>(
          `/patients/search?q=${encodeURIComponent(query)}`,
        );

        if (!cancelled) {
          setPatientResults(
            normalizePatients(response).filter(
              (patient) => !patient.isTemporary,
            ),
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
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
  }, [apiRequest, patientSearch, isSessionLoaded, accessToken]);

  const todayCount = useMemo(() => {
    const today = new Date();

    return appointments.filter((appointment) => {
      const date = new Date(appointment.scheduledAt);

      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    }).length;
  }, [appointments]);

  const waitingCount = useMemo(
    () =>
      appointments.filter(
        (appointment) => appointment.status === "checked_in",
      ).length,
    [appointments],
  );

  async function handleBookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPatient) {
      setError("Please select a patient.");
      return;
    }

    if (!doctorId) {
      setError("Please select a doctor.");
      return;
    }

    if (!scheduledAt) {
      setError("Please select an appointment date and time.");
      return;
    }

    if (new Date(scheduledAt).getTime() <= Date.now()) {
      setError("The appointment must be scheduled for a future time.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest("/appointments", {
        method: "POST",
        retryWrites: true,
        body: {
          patientId: selectedPatient.id,
          doctorId,
          scheduledAt: new Date(scheduledAt).toISOString(),
          durationMinutes,
          reason: reason.trim() || undefined,
        },
      });

      setSuccess("Appointment booked successfully.");

      setSelectedPatient(null);
      setPatientSearch("");
      setPatientResults([]);
      setDoctorId("");
      setScheduledAt("");
      setDurationMinutes(30);
      setReason("");

      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirm(appointment: Appointment) {
    if (!window.confirm("Confirm this appointment?")) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/appointments/${appointment.id}/confirm`,
        {
          method: "PATCH",
          body: {
            expectedVersion: appointment.version,
          },
        },
      );

      setSuccess("Appointment confirmed successfully.");
      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel(appointment: Appointment) {
    const note = window.prompt(
      `Cancellation reason for ${appointment.patientName}:`,
    );

    if (note === null) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/appointments/${appointment.id}/cancel`,
        {
          method: "PATCH",
          body: {
            expectedVersion: appointment.version,
            note: note.trim() || undefined,
          },
        },
      );

      setSuccess("Appointment cancelled successfully.");
      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function openReschedule(appointment: Appointment) {
    setReschedulingAppointment(appointment);
    setRescheduleDate(getLocalDateTime(appointment.scheduledAt));
    setRescheduleDuration(appointment.durationMinutes);
  }

  async function handleReschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!reschedulingAppointment || !rescheduleDate) return;

    if (new Date(rescheduleDate).getTime() <= Date.now()) {
      setError("The new appointment time must be in the future.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/appointments/${reschedulingAppointment.id}/reschedule`,
        {
          method: "PATCH",
          body: {
            expectedVersion: reschedulingAppointment.version,
            scheduledAt: new Date(rescheduleDate).toISOString(),
            durationMinutes: rescheduleDuration,
          },
        },
      );

      setSuccess("Appointment rescheduled successfully.");
      setReschedulingAppointment(null);

      await loadAppointments();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 lg:px-6 xl:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#102f5f]">
            Appointments
          </h1>

          <p className="mt-1 text-sm text-[#55749c]">
            Manage patient bookings and the hospital appointment schedule.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAppointments()}
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dce8f5] bg-white px-4 text-xs font-medium text-[#294b76] shadow-sm"
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#7891b1]">
                Appointments today
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#102f5f]">
                {todayCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#1677d2]">
              <CalendarDays size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#7891b1]">
                Checked-in patients
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#102f5f]">
                {waitingCount}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf9f0] text-[#16a34a]">
              <UsersRound size={21} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="min-w-0">
          <section className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)] sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#102f5f]">
                Hospital Appointments
              </h2>

              <p className="mt-1 text-xs text-[#7891b1]">
                Search, confirm, reschedule or cancel appointments.
              </p>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba2bd]"
                />

                <input
                  value={appointmentSearch}
                  onChange={(event) =>
                    setAppointmentSearch(event.target.value)
                  }
                  placeholder="Search appointments"
                  className="h-11 w-full rounded-xl border border-[#dce8f5] bg-[#fbfdff] pl-9 pr-3 text-sm text-[#294b76] outline-none focus:border-[#5aa7ef]"
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as AppointmentStatus)
                }
                className="h-11 rounded-xl border border-[#dce8f5] bg-white px-3 text-sm text-[#294b76] outline-none focus:border-[#5aa7ef]"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="py-12 text-center text-sm text-[#7891b1]">
                Loading appointments...
              </div>
            ) : appointments.length === 0 ? (
              <div className="rounded-xl bg-[#f8fbff] px-4 py-12 text-center text-sm text-[#7891b1]">
                No appointments found.
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="rounded-xl border border-[#e3edf8] p-4 transition hover:bg-[#f8fbff]"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e1efff] text-[#1677d2]">
                            <UserRound size={17} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#102f5f]">
                              {appointment.patientName}
                            </p>

                            <p className="text-xs text-[#7891b1]">
                              {appointment.patientNumber}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-[#55749c]">
                          <p>
                            <span className="font-medium">Doctor:</span>{" "}
                            {appointment.doctorName}
                          </p>

                          <p>
                            <span className="font-medium">Reason:</span>{" "}
                            {appointment.reason || "Consultation"}
                          </p>

                          <p className="flex items-center gap-1">
                            <Clock3 size={13} />
                            {formatDate(appointment.scheduledAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <span className="rounded-full bg-[#eaf4ff] px-3 py-1.5 text-xs font-medium text-[#1677d2]">
                          {appointment.status.replace("_", " ")}
                        </span>

                        <div className="flex flex-wrap gap-2">
                          {appointment.status === "scheduled" && (
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void handleConfirm(appointment)}
                              className="rounded-lg bg-[#eaf9f0] px-3 py-2 text-xs font-medium text-[#16a34a] hover:bg-[#dcfce7] disabled:opacity-50"
                            >
                              <CheckCircle2
                                size={13}
                                className="mr-1 inline"
                              />
                              Confirm
                            </button>
                          )}

                          {["scheduled", "confirmed"].includes(
                            appointment.status,
                          ) && (
                            <>
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => openReschedule(appointment)}
                                className="rounded-lg bg-[#eef6ff] px-3 py-2 text-xs font-medium text-[#1677d2] hover:bg-[#dceeff] disabled:opacity-50"
                              >
                                Reschedule
                              </button>

                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => void handleCancel(appointment)}
                                className="rounded-lg bg-[#fff0f1] px-3 py-2 text-xs font-medium text-[#dc2626] hover:bg-[#ffe1e4] disabled:opacity-50"
                              >
                                <XCircle
                                  size={13}
                                  className="mr-1 inline"
                                />
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {hasMore && nextCursor && (
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  disabled={loadingMore}
                  onClick={() =>
                    void loadAppointments(nextCursor, true)
                  }
                  className="rounded-xl border border-[#dce8f5] bg-white px-5 py-2.5 text-sm font-medium text-[#1677d2] hover:bg-[#f4f9ff] disabled:opacity-50"
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-[#e3edf8] bg-white p-5 shadow-[0_4px_18px_rgba(28,73,125,0.04)] sm:p-6">
            <h2 className="text-lg font-semibold text-[#102f5f]">
              Book Appointment
            </h2>

            <p className="mt-1 text-xs text-[#7891b1]">
              Find a registered patient and schedule a doctor appointment.
            </p>

            <form
              onSubmit={handleBookAppointment}
              className="mt-5 space-y-4"
            >
              <div>
                <label className="mb-2 block text-xs font-medium text-[#55749c]">
                  Search patient
                </label>

                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba2bd]"
                  />

                  <input
                    value={patientSearch}
                    onChange={(event) => {
                      setPatientSearch(event.target.value);
                      setSelectedPatient(null);
                    }}
                    placeholder="Name, patient number or phone"
                    className="h-11 w-full rounded-xl border border-[#dce8f5] bg-[#fbfdff] pl-9 pr-3 text-xs text-[#294b76] outline-none focus:border-[#5aa7ef]"
                  />
                </div>

                {searchingPatients && (
                  <p className="mt-2 text-xs text-[#7891b1]">
                    Searching patients...
                  </p>
                )}

                {!searchingPatients &&
                  patientSearch.trim().length >= 2 &&
                  !selectedPatient && (
                    <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-[#e3edf8] bg-white">
                      {patientResults.length === 0 ? (
                        <p className="p-3 text-xs text-[#7891b1]">
                          No registered patients found.
                        </p>
                      ) : (
                        patientResults.map((patient) => (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setPatientSearch(
                                `${patient.firstName} ${patient.lastName} · ${patient.patientNumber}`,
                              );
                              setPatientResults([]);
                            }}
                            className="block w-full border-b border-[#edf2f8] px-3 py-3 text-left last:border-0 hover:bg-[#f4f9ff]"
                          >
                            <p className="text-sm font-semibold text-[#102f5f]">
                              {patient.firstName} {patient.otherNames}{" "}
                              {patient.lastName}
                            </p>

                            <p className="mt-1 text-xs text-[#7891b1]">
                              {patient.patientNumber}
                              {patient.phone ? ` · ${patient.phone}` : ""}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
              </div>

              {selectedPatient && (
                <div className="rounded-xl border border-[#cce7d6] bg-[#f0faf4] p-3">
                  <p className="text-xs font-semibold text-[#167a43]">
                    Selected patient
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#102f5f]">
                    {selectedPatient.firstName}{" "}
                    {selectedPatient.otherNames}{" "}
                    {selectedPatient.lastName}
                  </p>

                  <p className="mt-1 text-xs text-[#55749c]">
                    {selectedPatient.patientNumber}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientSearch("");
                    }}
                    className="mt-2 text-xs font-medium text-red-600"
                  >
                    Change patient
                  </button>
                </div>
              )}

              <div>
                <label className="mb-2 block text-xs font-medium text-[#55749c]">
                  Select doctor
                </label>

                <select
                  value={doctorId}
                  onChange={(event) => setDoctorId(event.target.value)}
                  required
                  disabled={loadingDoctors}
                  className="h-11 w-full rounded-xl border border-[#dce8f5] bg-white px-3 text-sm text-[#294b76] outline-none focus:border-[#5aa7ef] disabled:opacity-50"
                >
                  <option value="">
                    {loadingDoctors
                      ? "Loading doctors..."
                      : "Choose a doctor"}
                  </option>

                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                      {doctor.specialization
                        ? ` — ${doctor.specialization}`
                        : ""}
                    </option>
                  ))}
                </select>

                {!loadingDoctors && doctors.length === 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    No doctors are available. Check the doctor listing endpoint and permissions.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[#55749c]">
                  Appointment date and time
                </label>

                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  min={getLocalDateTime(new Date().toISOString())}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#dce8f5] bg-white px-3 text-sm text-[#294b76] outline-none focus:border-[#5aa7ef]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[#55749c]">
                  Duration
                </label>

                <select
                  value={durationMinutes}
                  onChange={(event) =>
                    setDurationMinutes(Number(event.target.value))
                  }
                  className="h-11 w-full rounded-xl border border-[#dce8f5] bg-white px-3 text-sm text-[#294b76] outline-none focus:border-[#5aa7ef]"
                >
                  {[15, 20, 30, 45, 60, 90, 120].map((duration) => (
                    <option key={duration} value={duration}>
                      {duration} minutes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[#55749c]">
                  Reason for visit
                </label>

                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Enter reason for appointment..."
                  className="w-full resize-y rounded-xl border border-[#dce8f5] bg-white p-3 text-sm text-[#294b76] outline-none focus:border-[#5aa7ef]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || loadingDoctors || doctors.length === 0}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2d91e8] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#187fd8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarDays size={17} />
                {submitting ? "Processing..." : "Book Appointment"}
              </button>
            </form>
          </section>
        </aside>
      </div>

      {reschedulingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102f5f]/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#102f5f]">
              Reschedule Appointment
            </h2>

            <p className="mt-1 text-xs text-[#7891b1]">
              {reschedulingAppointment.patientName}
            </p>

            <form onSubmit={handleReschedule} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium text-[#55749c]">
                  New date and time
                </label>

                <input
                  type="datetime-local"
                  required
                  min={getLocalDateTime(new Date().toISOString())}
                  value={rescheduleDate}
                  onChange={(event) =>
                    setRescheduleDate(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#dce8f5] px-3 text-sm text-[#294b76] outline-none focus:border-[#5aa7ef]"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-[#55749c]">
                  Duration
                </label>

                <select
                  value={rescheduleDuration}
                  onChange={(event) =>
                    setRescheduleDuration(Number(event.target.value))
                  }
                  className="h-11 w-full rounded-xl border border-[#dce8f5] px-3 text-sm text-[#294b76] outline-none focus:border-[#5aa7ef]"
                >
                  {[15, 20, 30, 45, 60, 90, 120].map((duration) => (
                    <option key={duration} value={duration}>
                      {duration} minutes
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingAppointment(null)}
                  className="h-11 flex-1 rounded-xl border border-[#dce8f5] text-sm font-medium text-[#55749c]"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 flex-1 rounded-xl bg-[#2d91e8] text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

