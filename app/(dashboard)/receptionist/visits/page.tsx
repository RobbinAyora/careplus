
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/session";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const PAGE_SIZE = 20;

type VisitType = "OUTPATIENT" | "EMERGENCY" | "FOLLOW_UP";

type Patient = {
  id: string;
  patientNumber?: string;
  firstName?: string;
  lastName?: string;
  otherNames?: string | null;
  phone?: string | null;
  email?: string | null;
};

type Visit = {
  id: string;
  visitNumber?: string;
  visitType?: string;
  status?: string;
  department?: string | null;
  reasonForVisit?: string | null;
  isEmergency?: boolean;
  createdAt?: string;
  patient?: Patient;
  queueEntry?: { status?: string } | null;
  triageRecord?: { priority?: string } | null;
};

type Toast = {
  type: "success" | "error";
  message: string;
};

function getPatientName(patient?: Patient) {
  if (!patient) return "Unknown patient";

  return [
    patient.firstName,
    patient.otherNames,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Unknown patient";
}

function formatStatus(status?: string) {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "AWAITING_TRIAGE":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "TRIAGED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "IN_PROGRESS":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "COMPLETED":
      return "bg-green-50 text-green-700 border-green-200";
    case "CANCELLED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function extractVisits(data: unknown): {
  visits: Visit[];
  total: number;
  totalPages: number;
} {
  if (Array.isArray(data)) {
    return {
      visits: data as Visit[],
      total: data.length,
      totalPages: 1,
    };
  }

  if (!data || typeof data !== "object") {
    return { visits: [], total: 0, totalPages: 1 };
  }

  const response = data as Record<string, unknown>;
  const nested =
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : response;

  const visits = Array.isArray(nested.visits)
    ? (nested.visits as Visit[])
    : Array.isArray(nested.data)
      ? (nested.data as Visit[])
      : [];

  const total =
    typeof nested.total === "number" ? nested.total : visits.length;

  const totalPages =
    typeof nested.totalPages === "number"
      ? nested.totalPages
      : Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { visits, total, totalPages };
}

function extractPatients(data: unknown): Patient[] {
  if (Array.isArray(data)) {
    return data as Patient[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const response = data as Record<string, unknown>;
  const nested =
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : response;

  if (Array.isArray(nested.patients)) {
    return nested.patients as Patient[];
  }

  if (Array.isArray(nested.results)) {
    return nested.results as Patient[];
  }

  if (Array.isArray(nested.data)) {
    return nested.data as Patient[];
  }

  return [];
}

async function getErrorMessage(response: Response) {
  try {
    const data: unknown = await response.json();

    if (data && typeof data === "object") {
      const errorData = data as {
        message?: string | string[];
        error?: string;
      };

      if (Array.isArray(errorData.message)) {
        return errorData.message.join(", ");
      }

      if (errorData.message) return errorData.message;
      if (errorData.error) return errorData.error;
    }
  } catch {
    // Use the fallback message if the response is not JSON.
  }

  return `Request failed with status ${response.status}`;
}

export default function VisitsPage() {
  const { accessToken } = useAuth();

  const [visits, setVisits] = useState<Visit[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showNewVisit, setShowNewVisit] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
    null
  );
  const [searchingPatients, setSearchingPatients] = useState(false);

  const [visitType, setVisitType] = useState<VisitType>("OUTPATIENT");
  const [department, setDepartment] = useState("");
  const [reasonForVisit, setReasonForVisit] = useState("");

  const [creatingVisit, setCreatingVisit] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback(
    (type: Toast["type"], message: string) => {
      setToast({ type, message });

      window.setTimeout(() => {
        setToast(null);
      }, 4500);
    },
    []
  );

  const fetchVisits = useCallback(
    async (requestedPage = page, showRefresh = false) => {
      if (!accessToken) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!API_URL) {
        showToast("error", "API URL is not configured.");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(requestedPage),
          limit: String(PAGE_SIZE),
        });

        if (search.trim()) {
          params.set("q", search.trim());
        }

        const response = await fetch(
          `${API_URL}/patients/visits?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const data: unknown = await response.json();
        const result = extractVisits(data);

        setVisits(result.visits);
        setTotal(result.total);
        setTotalPages(Math.max(1, result.totalPages));
        setPage(requestedPage);
      } catch (error) {
        showToast(
          "error",
          error instanceof Error ? error.message : "Unable to load visits."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [accessToken, page, search, showToast]
  );

  useEffect(() => {
    if (!accessToken) return;

    const timeout = window.setTimeout(() => {
      fetchVisits(1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [accessToken, search, fetchVisits]);

  // Search existing registered patients when creating a visit.
  useEffect(() => {
    if (!showNewVisit || selectedPatient || patientSearch.trim().length < 2) {
      setPatientResults([]);
      setSearchingPatients(false);
      return;
    }

    if (!accessToken || !API_URL) return;

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setSearchingPatients(true);

      try {
        const params = new URLSearchParams({
          q: patientSearch.trim(),
        });

        const response = await fetch(
          `${API_URL}/patients/search?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            cache: "no-store",
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const data: unknown = await response.json();
        setPatientResults(extractPatients(data));
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;

        showToast(
          "error",
          error instanceof Error
            ? error.message
            : "Unable to search patients."
        );
      } finally {
        setSearchingPatients(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [
    accessToken,
    patientSearch,
    selectedPatient,
    showNewVisit,
    showToast,
  ]);

  const emergencyCount = useMemo(
    () =>
      visits.filter(
        (visit) =>
          visit.isEmergency || visit.visitType === "EMERGENCY"
      ).length,
    [visits]
  );

  const awaitingTriageCount = useMemo(
    () =>
      visits.filter((visit) => visit.status === "AWAITING_TRIAGE").length,
    [visits]
  );

  function resetNewVisitForm() {
    setPatientSearch("");
    setPatientResults([]);
    setSelectedPatient(null);
    setVisitType("OUTPATIENT");
    setDepartment("");
    setReasonForVisit("");
  }

  function closeNewVisitModal() {
    if (creatingVisit) return;

    setShowNewVisit(false);
    resetNewVisitForm();
  }

  // Create a new visit for an already registered patient.
  async function handleCreateVisit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedPatient) {
      showToast("error", "Please select an existing patient first.");
      return;
    }

    if (!selectedPatient.id) {
      showToast("error", "The selected patient has no valid database ID.");
      return;
    }

    if (!accessToken || !API_URL) {
      showToast(
        "error",
        "You are not authenticated or the API URL is missing."
      );
      return;
    }

    const patientId = selectedPatient.id;
    const requestUrl = `${API_URL}/patients/${patientId}/visits`;

    // Debugging information: inspect these values in the browser console.
    console.log("Creating visit for:", selectedPatient);
    console.log("Selected patient database ID:", patientId);
    console.log("POST URL:", requestUrl);

    setCreatingVisit(true);

    try {
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visitType,
          department: department.trim() || undefined,
          reasonForVisit: reasonForVisit.trim() || undefined,
        }),
      });

      const responseData: unknown = await response.json();

      console.log("Create visit response:", responseData);

      if (!response.ok) {
        const message =
          responseData &&
          typeof responseData === "object" &&
          "message" in responseData
            ? (responseData as {
                message: string | string[];
              }).message
            : "Unable to create visit.";

        throw new Error(
          Array.isArray(message) ? message.join(", ") : message
        );
      }

      showToast(
        "success",
        `Visit created successfully for ${getPatientName(selectedPatient)}.`
      );

      setShowNewVisit(false);
      resetNewVisitForm();

      // Reload the visits table so the newly created visit appears.
      await fetchVisits(1, true);
    } catch (error) {
      console.error("Create visit error:", error);

      showToast(
        "error",
        error instanceof Error ? error.message : "Unable to create visit."
      );
    } finally {
      setCreatingVisit(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Reception
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Patient Visits
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage patient visits and send patients to the triage queue.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fetchVisits(page, true)}
              disabled={refreshing || loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "↻ Refresh"}
            </button>

            <button
              type="button"
              onClick={() => setShowNewVisit(true)}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              + New Visit
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total visits</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {total}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Registered patient visits
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-amber-700">
              Awaiting triage
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-700">
              {awaitingTriageCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Visits waiting for nursing assessment on this page
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-red-700">
              Emergency visits
            </p>
            <p className="mt-2 text-3xl font-bold text-red-700">
              {emergencyCount}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Emergency visits on this page
            </p>
          </div>
        </div>

        {/* Visits table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Visit records</h2>
              <p className="mt-1 text-sm text-slate-500">
                View visits registered at your facility.
              </p>
            </div>

            <div className="relative w-full sm:max-w-sm">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient or visit..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">Visit details</th>
                  <th className="px-5 py-4">Patient</th>
                  <th className="px-5 py-4">Visit type</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Date registered</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading visits...
                    </td>
                  </tr>
                ) : visits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <p className="font-semibold text-slate-700">
                        No visits found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Create a new visit for a registered patient or change
                        your search.
                      </p>
                    </td>
                  </tr>
                ) : (
                  visits.map((visit) => (
                    <tr
                      key={visit.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-900">
                          {visit.visitNumber || "—"}
                        </p>
                        <p className="mt-1 max-w-[200px] truncate text-xs text-slate-500">
                          {visit.reasonForVisit || "No reason provided"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {getPatientName(visit.patient)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {visit.patient?.patientNumber || "No patient number"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-700">
                          {formatStatus(visit.visitType)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {visit.department || "General"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            visit.status
                          )}`}
                        >
                          {formatStatus(visit.status)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {formatStatus(
                            visit.triageRecord?.priority ||
                              (visit.isEmergency ? "EMERGENCY" : "—")
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(visit.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Showing {visits.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
              {" "}to {(page - 1) * PAGE_SIZE + visits.length} of {total} visits
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => fetchVisits(page - 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => fetchVisits(page + 1)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New visit modal */}
      {showNewVisit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeNewVisitModal();
            }
          }}
        >
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  Reception
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Create patient visit
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select an already registered patient to create a new visit.
                </p>
              </div>

              <button
                type="button"
                onClick={closeNewVisitModal}
                disabled={creatingVisit}
                aria-label="Close"
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="space-y-5 p-6">
              {/* Patient search */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Search registered patient
                </label>

                {selectedPatient ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {getPatientName(selectedPatient)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Patient No: {selectedPatient.patientNumber || "—"}
                        {" · "}
                        Phone: {selectedPatient.phone || "—"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatient(null);
                        setPatientSearch("");
                        setPatientResults([]);
                      }}
                      className="shrink-0 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="search"
                      value={patientSearch}
                      onChange={(event) =>
                        setPatientSearch(event.target.value)
                      }
                      placeholder="Enter patient name, number or phone..."
                      autoComplete="off"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-200">
                      {patientSearch.trim().length < 2 ? (
                        <p className="px-4 py-3 text-sm text-slate-500">
                          Enter at least two characters to search.
                        </p>
                      ) : searchingPatients ? (
                        <p className="px-4 py-3 text-sm text-slate-500">
                          Searching patients...
                        </p>
                      ) : patientResults.length > 0 ? (
                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                          {patientResults.map((patient) => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => {
                                // Debugging information for the selected patient.
                                console.log("Selected patient:", patient);
                                console.log(
                                  "Selected patient database ID:",
                                  patient.id
                                );

                                setSelectedPatient(patient);
                                setPatientSearch("");
                                setPatientResults([]);
                              }}
                              className="w-full px-4 py-3 text-left transition hover:bg-blue-50"
                            >
                              <p className="text-sm font-semibold text-slate-800">
                                {getPatientName(patient)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Patient No: {patient.patientNumber || "—"}
                                {" · "}
                                Phone: {patient.phone || "—"}
                              </p>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="px-4 py-3 text-sm text-slate-500">
                          No matching registered patients found.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Visit type */}
              <div>
                <label
                  htmlFor="visitType"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Visit type <span className="text-red-500">*</span>
                </label>

                <select
                  id="visitType"
                  value={visitType}
                  onChange={(event) =>
                    setVisitType(event.target.value as VisitType)
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="OUTPATIENT">Outpatient</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Department
                </label>

                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(event) => setDepartment(event.target.value)}
                  placeholder="e.g. General Outpatient, Dental, Maternity"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Reason */}
              <div>
                <label
                  htmlFor="reasonForVisit"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Reason for visit
                </label>

                <textarea
                  id="reasonForVisit"
                  value={reasonForVisit}
                  onChange={(event) =>
                    setReasonForVisit(event.target.value)
                  }
                  rows={3}
                  placeholder="Briefly describe why the patient is visiting..."
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  What happens next?
                </p>
                <p className="mt-1 text-xs leading-5 text-blue-800">
                  The visit will be created under the selected patient and
                  placed in the awaiting-triage queue. The nurse can then
                  perform the triage assessment.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeNewVisitModal}
                  disabled={creatingVisit}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!selectedPatient || creatingVisit}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingVisit ? "Creating visit..." : "Create visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          className={`fixed bottom-5 right-5 z-[60] max-w-sm rounded-xl px-5 py-4 text-sm font-medium text-white shadow-xl ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}


