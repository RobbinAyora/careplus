
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/session";
import { useApiClient } from "@/lib/api/client";

const PAGE_SIZE = 20;

type VisitType = "OUTPATIENT" | "EMERGENCY" | "FOLLOW_UP";

type VisitCloseReason =
  | "LEFT_WITHOUT_BEING_SEEN"
  | "REGISTERED_IN_ERROR"
  | "DUPLICATE"
  | "REFERRED_ELSEWHERE"
  | "OTHER";

const CLOSE_REASON_OPTIONS: { value: VisitCloseReason; label: string }[] = [
  {
    value: "LEFT_WITHOUT_BEING_SEEN",
    label: "Patient left without being seen",
  },
  {
    value: "REGISTERED_IN_ERROR",
    label: "Registered in error",
  },
  {
    value: "DUPLICATE",
    label: "Duplicate visit",
  },
  {
    value: "REFERRED_ELSEWHERE",
    label: "Referred elsewhere",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

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

type VisitPage = {
  visits: Visit[];
  nextCursor: string | null;
  hasMore: boolean;
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

function extractVisits(data: unknown): VisitPage {
  if (Array.isArray(data)) {
    return {
      visits: data as Visit[],
      nextCursor: null,
      hasMore: false,
    };
  }

  if (!data || typeof data !== "object") {
    return {
      visits: [],
      nextCursor: null,
      hasMore: false,
    };
  }

  const response = data as Record<string, unknown>;

  const nested =
    response.data &&
    typeof response.data === "object" &&
    !Array.isArray(response.data)
      ? (response.data as Record<string, unknown>)
      : response;

  const visits = Array.isArray(nested.visits)
    ? (nested.visits as Visit[])
    : Array.isArray(nested.data)
      ? (nested.data as Visit[])
      : Array.isArray(response.data)
        ? (response.data as Visit[])
        : [];

  const nextCursor =
    typeof nested.nextCursor === "string"
      ? nested.nextCursor
      : typeof response.nextCursor === "string"
        ? response.nextCursor
        : null;

  const hasMore =
    typeof nested.hasMore === "boolean"
      ? nested.hasMore
      : typeof response.hasMore === "boolean"
        ? response.hasMore
        : false;

  return {
    visits,
    nextCursor,
    hasMore,
  };
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

export default function VisitsPage() {
  const { isSessionLoaded } = useAuth();
  const apiRequest = useApiClient();

  const [visits, setVisits] = useState<Visit[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const [page, setPage] = useState(1);
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([
    null,
  ]);

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

  // Cancel visit state
  const [showCancelVisit, setShowCancelVisit] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [closeReason, setCloseReason] =
    useState<VisitCloseReason>("LEFT_WITHOUT_BEING_SEEN");
  const [closeNote, setCloseNote] = useState("");
  const [closingVisit, setClosingVisit] = useState(false);

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
    async (
      cursor: string | null = null,
      requestedPage = 1,
      showRefresh = false
    ) => {
      if (!isSessionLoaded) return;

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
        });

        if (cursor) {
          params.set("cursor", cursor);
        }

        if (search.trim()) {
          params.set("q", search.trim());
        }

        const data = await apiRequest<unknown>(
          `/patients/visits?${params.toString()}`
        );

        const result = extractVisits(data);

        setVisits(result.visits);
        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
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
    [apiRequest, isSessionLoaded, search, showToast]
  );

  useEffect(() => {
    if (!isSessionLoaded) return;

    const timeout = window.setTimeout(() => {
      setCursorHistory([null]);
      void fetchVisits(null, 1);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [isSessionLoaded, search, fetchVisits]);

  // Search existing registered patients when creating a visit.
  useEffect(() => {
    if (!isSessionLoaded) return;

    if (!showNewVisit || selectedPatient || patientSearch.trim().length < 2) {
      setPatientResults([]);
      setSearchingPatients(false);
      return;
    }

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      if (cancelled) return;

      setSearchingPatients(true);

      try {
        const params = new URLSearchParams({
          q: patientSearch.trim(),
        });

        const data = await apiRequest<unknown>(
          `/patients/search?${params.toString()}`
        );

        if (!cancelled) {
          setPatientResults(extractPatients(data));
        }
      } catch (error) {
        if (!cancelled) {
          showToast(
            "error",
            error instanceof Error
              ? error.message
              : "Unable to search patients."
          );
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
  }, [
    apiRequest,
    isSessionLoaded,
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

  // Open cancellation modal
  function openCancelVisitModal(visit: Visit) {
    setSelectedVisit(visit);
    setCloseReason("LEFT_WITHOUT_BEING_SEEN");
    setCloseNote("");
    setShowCancelVisit(true);
  }

  // Close cancellation modal
  function closeCancelVisitModal() {
    if (closingVisit) return;

    setShowCancelVisit(false);
    setSelectedVisit(null);
    setCloseReason("LEFT_WITHOUT_BEING_SEEN");
    setCloseNote("");
  }

  // Cancel visit using the backend endpoint
  async function handleCloseVisit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedVisit) return;

    if (closeReason === "OTHER" && !closeNote.trim()) {
      showToast("error", "Please provide a note when selecting Other.");
      return;
    }

    setClosingVisit(true);

    try {
      await apiRequest<unknown>(
        `/patients/visits/${selectedVisit.id}/close`,
        {
          method: "PATCH",
          body: {
            reason: closeReason,
            note: closeNote.trim() || undefined,
          },
        }
      );

      showToast(
        "success",
        `Visit ${selectedVisit.visitNumber || ""} cancelled successfully.`
      );

      setShowCancelVisit(false);
      setSelectedVisit(null);
      setCloseReason("LEFT_WITHOUT_BEING_SEEN");
      setCloseNote("");

      // Refresh the current page after successful cancellation.
      await fetchVisits(
        cursorHistory[page - 1] ?? null,
        page,
        true
      );
    } catch (error) {
      showToast(
        "error",
        error instanceof Error ? error.message : "Unable to cancel visit."
      );
    } finally {
      setClosingVisit(false);
    }
  }

  function goToNextPage() {
    if (!nextCursor || !hasMore || loading || refreshing) return;

    const cursor = nextCursor;

    setCursorHistory((current) => [
      ...current.slice(0, page),
      cursor,
    ]);

    void fetchVisits(cursor, page + 1);
  }

  function goToPreviousPage() {
    if (page <= 1 || loading || refreshing) return;

    const previousCursor = cursorHistory[page - 2] ?? null;

    void fetchVisits(previousCursor, page - 1);
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

    if (!isSessionLoaded) {
      showToast(
        "error",
        "Your session is still loading. Please try again."
      );
      return;
    }

    const patientId = selectedPatient.id;

    setCreatingVisit(true);

    try {
      await apiRequest<unknown>(
        `/patients/${patientId}/visits`,
        {
          method: "POST",
          body: {
            visitType,
            department: department.trim() || undefined,
            reasonForVisit: reasonForVisit.trim() || undefined,
          },
        }
      );

      showToast(
        "success",
        `Visit created successfully for ${getPatientName(selectedPatient)}.`
      );

      setShowNewVisit(false);
      resetNewVisitForm();

      // Reload the first page so the newly created visit can appear.
      setCursorHistory([null]);
      await fetchVisits(null, 1, true);
    } catch (error) {
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
              onClick={() =>
                fetchVisits(
                  cursorHistory[page - 1] ?? null,
                  page,
                  true
                )
              }
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
            <p className="text-sm font-medium text-slate-500">
              Visits on this page
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {visits.length}
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
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">Visit details</th>
                  <th className="px-5 py-4">Patient</th>
                  <th className="px-5 py-4">Visit type</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Date registered</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      Loading visits...
                    </td>
                  </tr>
                ) : visits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
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

                      <td className="px-5 py-4">
                        {visit.status !== "CANCELLED" &&
                        visit.status !== "COMPLETED" ? (
                          <button
                            type="button"
                            onClick={() => openCancelVisitModal(visit)}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            Cancel Visit
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
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
              Showing {visits.length} visits on this page
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading || refreshing}
                onClick={goToPreviousPage}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="px-2 text-sm text-slate-600">
                Page {page}
              </span>

              <button
                type="button"
                disabled={!hasMore || !nextCursor || loading || refreshing}
                onClick={goToNextPage}
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

      {/* Cancel visit modal */}
      {showCancelVisit && selectedVisit && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCancelVisitModal();
            }
          }}
        >
          <div className="my-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600">
                  Visit management
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Cancel patient visit
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Provide a reason for closing this visit.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCancelVisitModal}
                disabled={closingVisit}
                aria-label="Close"
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCloseVisit} className="space-y-5 p-6">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Patient
                </p>
                <p className="mt-1 font-semibold text-slate-900">
                  {getPatientName(selectedVisit.patient)}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Visit No: {selectedVisit.visitNumber || "—"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Current status: {formatStatus(selectedVisit.status)}
                </p>
              </div>

              <div>
                <label
                  htmlFor="closeReason"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Reason for cancellation{" "}
                  <span className="text-red-500">*</span>
                </label>

                <select
                  id="closeReason"
                  value={closeReason}
                  onChange={(event) =>
                    setCloseReason(event.target.value as VisitCloseReason)
                  }
                  required
                  disabled={closingVisit}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                >
                  {CLOSE_REASON_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="closeNote"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Additional note{" "}
                  {closeReason === "OTHER" ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    <span className="font-normal text-slate-400">
                      (Optional)
                    </span>
                  )}
                </label>

                <textarea
                  id="closeNote"
                  value={closeNote}
                  onChange={(event) => setCloseNote(event.target.value)}
                  rows={3}
                  maxLength={500}
                  required={closeReason === "OTHER"}
                  disabled={closingVisit}
                  placeholder={
                    closeReason === "OTHER"
                      ? "Please explain why this visit is being closed..."
                      : "Add any additional information..."
                  }
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />

                <p className="mt-1 text-right text-xs text-slate-400">
                  {closeNote.length}/500 characters
                </p>
              </div>

              <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-800">
                  Confirm visit cancellation
                </p>
                <p className="mt-1 text-xs leading-5 text-red-700">
                  This action will close the visit and update its status.
                  Please ensure the selected reason is correct before
                  proceeding.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeCancelVisitModal}
                  disabled={closingVisit}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Go Back
                </button>

                <button
                  type="submit"
                  disabled={
                    closingVisit ||
                    (closeReason === "OTHER" && !closeNote.trim())
                  }
                  className="rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {closingVisit ? "Cancelling visit..." : "Confirm Cancellation"}
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




