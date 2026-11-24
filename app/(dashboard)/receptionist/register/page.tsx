
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Search,
  UserPlus,
  UserRound,
  Users,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth/session";
import { useApiClient } from "@/lib/api/client";

type ToastType = "success" | "error" | "warning";

type PatientRecord = {
  id: string;
  patientNumber?: string;
  firstName?: string;
  lastName?: string;
  otherNames?: string | null;
  phone?: string | null;
  alternativePhone?: string | null;
  email?: string | null;
  nationalId?: string | null;
  sex?: string;
  dateOfBirth?: string | null;
  estimatedAgeYears?: number | null;
  isTemporary?: boolean;
  createdAt?: string;
  visits?: {
    id: string;
    visitNumber?: string;
    status: string;
    createdAt: string;
  }[];
};

type PatientForm = {
  firstName: string;
  lastName: string;
  otherNames: string;
  dateOfBirth: string;
  sex: string;
  nationalId: string;
  birthCertificateNumber: string;
  phone: string;
  alternativePhone: string;
  email: string;
  residence: string;
  occupation: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
  visitType: string;
  department: string;
  reasonForVisit: string;
};

const initialForm: PatientForm = {
  firstName: "",
  lastName: "",
  otherNames: "",
  dateOfBirth: "",
  sex: "",
  nationalId: "",
  birthCertificateNumber: "",
  phone: "",
  alternativePhone: "",
  email: "",
  residence: "",
  occupation: "",
  nextOfKinName: "",
  nextOfKinPhone: "",
  nextOfKinRelationship: "",
  visitType: "OUTPATIENT",
  department: "",
  reasonForVisit: "",
};

const inputClass =
  "w-full rounded-lg border border-[#dce6f1] bg-white px-3.5 py-3 text-sm text-[#18365e] outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-1.5 block text-sm font-medium text-[#294568]";

const PATIENTS_PER_PAGE = 20;

/**
 * Converts Kenyan phone numbers to international E.164 format.
 */
function normalizeKenyanPhone(phone: string): string {
  const cleaned = phone.replace(/[\s()-]/g, "");

  if (cleaned.startsWith("+254")) {
    return cleaned;
  }

  if (cleaned.startsWith("254")) {
    return `+${cleaned}`;
  }

  if (/^0[17]\d{8}$/.test(cleaned)) {
    return `+254${cleaned.substring(1)}`;
  }

  return cleaned;
}

function extractPatients(data: unknown): PatientRecord[] {
  let records: unknown = data;

  if (typeof data === "object" && data !== null) {
    const result = data as Record<string, unknown>;
    records = result.patients ?? result.data ?? data;
  }

  if (!Array.isArray(records)) return [];

  return records.filter(
    (item): item is PatientRecord =>
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      typeof item.id === "string",
  );
}

/**
 * Formats dates using Kenya's local timezone.
 */
function formatRegistrationDate(date?: string): string {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  }).format(parsedDate);
}

/**
 * Converts visit status values into readable labels.
 */
function getVisitStatusLabel(status?: string): string {
  if (!status) return "No Visit";

  switch (status) {
    case "REGISTERED":
      return "Registered";
    case "AWAITING_TRIAGE":
      return "Waiting Triage";
    case "TRIAGED":
      return "Triaged";
    case "WITH_DOCTOR":
      return "With Doctor";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "REFERRED":
      return "Referred";
    default:
      return status.replace(/_/g, " ");
  }
}

/**
 * Returns styling based on the visit status.
 */
function getVisitStatusClass(status?: string): string {
  switch (status) {
    case "AWAITING_TRIAGE":
      return "bg-amber-50 text-amber-700";

    case "TRIAGED":
      return "bg-blue-50 text-blue-700";

    case "WITH_DOCTOR":
      return "bg-purple-50 text-purple-700";

    case "COMPLETED":
      return "bg-green-50 text-green-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    case "REFERRED":
      return "bg-orange-50 text-orange-700";

    case "REGISTERED":
      return "bg-slate-100 text-slate-700";

    default:
      return "bg-slate-100 text-slate-500";
  }
}

export default function PatientRegistrationPage() {
  const { isSessionLoaded } = useAuth();
  const apiRequest = useApiClient();

  const [mode, setMode] = useState<"search" | "new" | "existing">(
    "search",
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] =
    useState<PatientRecord | null>(null);

  const [form, setForm] = useState<PatientForm>(initialForm);

  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);

  const [searchPerformed, setSearchPerformed] = useState(false);

  // -----------------------------------
  // REGISTERED PATIENTS PAGINATION
  // -----------------------------------

  const [recentPatients, setRecentPatients] = useState<PatientRecord[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);

  const [recentPage, setRecentPage] = useState(1);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Stores the cursor used to load each page.
  // Page 1 always uses null.
  const [cursorHistory, setCursorHistory] = useState<(string | null)[]>([
    null,
  ]);

  // Tracks which patient's visit is currently being checked.
  const [checkingVisitId, setCheckingVisitId] = useState<string | null>(
    null,
  );

  function showToast(type: ToastType, message: string) {
    setToast({ type, message });

    window.setTimeout(() => {
      setToast((current) =>
        current?.message === message ? null : current,
      );
    }, 4500);
  }

  // -----------------------------------
  // LOAD REGISTERED PATIENTS
  // -----------------------------------

  const loadRecentPatients = useCallback(
    async (cursor: string | null = null, page: number = 1) => {
      if (!isSessionLoaded) return;

      setRecentLoading(true);

      try {
        const cursorQuery = cursor
          ? `&cursor=${encodeURIComponent(cursor)}`
          : "";

        const data = await apiRequest<unknown>(
          `/patients?limit=${PATIENTS_PER_PAGE}${cursorQuery}`,
        );

        if (typeof data !== "object" || data === null) {
          throw new Error("Invalid patient list response from server.");
        }

        const result = data as Record<string, unknown>;

        const records = extractPatients(result);

        const returnedNextCursor =
          typeof result.nextCursor === "string"
            ? result.nextCursor
            : null;

        const returnedHasMore = result.hasMore === true;

        setRecentPatients(records);
        setNextCursor(returnedNextCursor);
        setHasMore(returnedHasMore);
        setRecentPage(page);

        console.log("[Patient Pagination] Loaded patients:", records);
        console.log("[Patient Pagination] Current page:", page);
        console.log("[Patient Pagination] Has more:", returnedHasMore);
      } catch (error) {
        console.error(
          "[Patient Pagination] Failed to load patients:",
          error,
        );

        showToast(
          "error",
          error instanceof Error
            ? error.message
            : "Unable to load registered patients.",
        );
      } finally {
        setRecentLoading(false);
      }
    },
    [apiRequest, isSessionLoaded],
  );

  // Load the first page when the authenticated page opens.
  useEffect(() => {
    if (!isSessionLoaded) return;

    void loadRecentPatients(null, 1);
  }, [isSessionLoaded, loadRecentPatients]);

  // Navigate to the next cursor page.
  function changeToNextRecentPage() {
    if (!nextCursor || !hasMore || recentLoading) {
      return;
    }

    const cursor = nextCursor;

    setCursorHistory((current) => [
      ...current.slice(0, recentPage),
      cursor,
    ]);

    void loadRecentPatients(cursor, recentPage + 1);
  }

  // Navigate to the previous cursor page.
  function changeToPreviousRecentPage() {
    if (recentPage <= 1 || recentLoading) {
      return;
    }

    const previousCursor = cursorHistory[recentPage - 2] ?? null;

    void loadRecentPatients(previousCursor, recentPage - 1);
  }

  function updateField(
    field: keyof PatientForm,
    value: string,
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  // -----------------------------------
  // MANUALLY CHECK A PATIENT'S VISIT
  // -----------------------------------

  async function checkPatientVisit(patientId: string) {
    setCheckingVisitId(patientId);

    try {
      console.log(
        "[Patient Visit] Manually checking patient:",
        patientId,
      );

      // GET /patients/:id returns the patient and their visits.
      // This request does not create a visit.
      const data = await apiRequest<unknown>(
        `/patients/${patientId}`,
      );

      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid patient details returned by server.");
      }

      const result = data as Record<string, unknown>;

      // Support either a direct patient response or a nested patient.
      const patientData =
        result.patient && typeof result.patient === "object"
          ? (result.patient as PatientRecord)
          : (result as PatientRecord);

      if (!Array.isArray(patientData.visits)) {
        throw new Error("The server did not return the patient's visits.");
      }

      const latestVisit = patientData.visits[0];

      // Update only this patient's visit information in the table.
      setRecentPatients((current) =>
        current.map((patient) =>
          patient.id === patientId
            ? {
                ...patient,
                visits: patientData.visits,
              }
            : patient,
        ),
      );

      if (!latestVisit) {
        showToast(
          "warning",
          "No visit has been registered for this patient.",
        );
      } else {
        showToast(
          "success",
          `Latest visit status: ${getVisitStatusLabel(latestVisit.status)}.`,
        );
      }
    } catch (error) {
      console.error(
        "[Patient Visit] Manual visit check failed:",
        error,
      );

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to check the patient's visit.",
      );
    } finally {
      setCheckingVisitId(null);
    }
  }

  // -----------------------------------
  // SEARCH PATIENTS
  // -----------------------------------

  async function searchPatients(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchQuery.trim();

    if (query.length < 2) {
      showToast("error", "Enter at least two characters to search.");
      return;
    }

    setSearching(true);
    setSearchPerformed(false);
    setPatients([]);

    console.log("[Patient Search] Searching for:", query);

    try {
      const data = await apiRequest<unknown>(
        `/patients/search?q=${encodeURIComponent(query)}`,
      );

      const results = extractPatients(data);

      console.log("[Patient Search] Extracted results:", results);
      console.log("[Patient Search] Number of results:", results.length);

      setPatients(results);
      setSearchPerformed(true);

      if (results.length === 0) {
        showToast("warning", "No matching patients found.");
      }
    } catch (error) {
      console.error("[Patient Search] Failed:", error);

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to search for patients.",
      );
    } finally {
      setSearching(false);
    }
  }

  function selectPatient(patient: PatientRecord) {
    console.log("[Patient Registration] Selected existing patient:", patient);

    setSelectedPatient(patient);
    setMode("existing");
  }

  // -----------------------------------
  // CREATE VISIT
  // -----------------------------------

  async function createVisit(patientId: string) {
    const payload = {
      visitType: form.visitType,
      department: form.department.trim(),
      reasonForVisit: form.reasonForVisit.trim(),
    };

    console.log("[Patient Visit] Preparing visit payload:", payload);
    console.log("[Patient Visit] Patient ID:", patientId);

    if (!payload.department || !payload.reasonForVisit) {
      showToast(
        "error",
        "Enter the department and reason for visit.",
      );
      return false;
    }

    await apiRequest<unknown>(
      `/patients/${patientId}/visits`,
      {
        method: "POST",
        body: payload,
      },
    );

    return true;
  }

  // -----------------------------------
  // REGISTER NEW PATIENT
  // -----------------------------------

  async function registerNewPatient(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.firstName.trim() || !form.lastName.trim()) {
      showToast("error", "First name and last name are required.");
      return;
    }

    if (!form.sex || !form.phone.trim()) {
      showToast("error", "Sex and phone number are required.");
      return;
    }

    if (!form.department.trim() || !form.reasonForVisit.trim()) {
      showToast(
        "error",
        "Department and reason for visit are required.",
      );
      return;
    }

    setSaving(true);

    const normalizedPhone = normalizeKenyanPhone(form.phone);

    const normalizedAlternativePhone = form.alternativePhone.trim()
      ? normalizeKenyanPhone(form.alternativePhone)
      : "";

    const normalizedNextOfKinPhone = form.nextOfKinPhone.trim()
      ? normalizeKenyanPhone(form.nextOfKinPhone)
      : "";

    console.log("[Patient Registration] Original phone:", form.phone);
    console.log(
      "[Patient Registration] Normalized phone:",
      normalizedPhone,
    );

    if (form.alternativePhone.trim()) {
      console.log(
        "[Patient Registration] Original alternative phone:",
        form.alternativePhone,
      );
      console.log(
        "[Patient Registration] Normalized alternative phone:",
        normalizedAlternativePhone,
      );
    }

    if (form.nextOfKinPhone.trim()) {
      console.log(
        "[Patient Registration] Original next-of-kin phone:",
        form.nextOfKinPhone,
      );
      console.log(
        "[Patient Registration] Normalized next-of-kin phone:",
        normalizedNextOfKinPhone,
      );
    }

    const nextOfKin =
      form.nextOfKinName.trim() && normalizedNextOfKinPhone
        ? [
            {
              fullName: form.nextOfKinName.trim(),
              phone: normalizedNextOfKinPhone,
              relationship:
                form.nextOfKinRelationship.trim() || "Other",
            },
          ]
        : [];

    const patientPayload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      ...(form.otherNames.trim()
        ? { otherNames: form.otherNames.trim() }
        : {}),
      ...(form.dateOfBirth
        ? { dateOfBirth: form.dateOfBirth }
        : {}),
      sex: form.sex,
      ...(form.nationalId.trim()
        ? { nationalId: form.nationalId.trim() }
        : {}),
      ...(form.birthCertificateNumber.trim()
        ? {
            birthCertificateNumber:
              form.birthCertificateNumber.trim(),
          }
        : {}),
      phone: normalizedPhone,
      ...(normalizedAlternativePhone
        ? { alternativePhone: normalizedAlternativePhone }
        : {}),
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
      ...(form.residence.trim()
        ? { residence: form.residence.trim() }
        : {}),
      ...(form.occupation.trim()
        ? { occupation: form.occupation.trim() }
        : {}),
      nextOfKin,
    };

    console.log(
      "[Patient Registration] Final patient payload:",
      patientPayload,
    );

    try {
      const data = await apiRequest<unknown>(
        "/patients",
        {
          method: "POST",
          body: patientPayload,
        },
      );

      console.log("[Patient Registration] Create patient response:", data);

      const result =
        typeof data === "object" && data !== null
          ? (data as Record<string, unknown>)
          : {};

      const createdPatient =
        result.patient && typeof result.patient === "object"
          ? (result.patient as Record<string, unknown>)
          : result;

      const patientId =
        typeof createdPatient.id === "string"
          ? createdPatient.id
          : null;

      console.log("[Patient Registration] Created patient ID:", patientId);

      if (!patientId) {
        console.warn(
          "[Patient Registration] Patient response did not contain an ID:",
          data,
        );

        showToast(
          "warning",
          "Patient was submitted, but the server did not return a patient ID. Check the patient record before retrying.",
        );
        return;
      }

      // Create the first visit BEFORE refreshing the patient list.
      try {
        await createVisit(patientId);

        console.log(
          "[Patient Registration] Patient and first visit created successfully.",
        );

        // Refresh AFTER visit creation so the latest visit is included.
        setCursorHistory([null]);
        await loadRecentPatients(null, 1);

        showToast(
          "success",
          "Patient registered and first visit created successfully. The patient is now awaiting triage.",
        );

        setForm(initialForm);
        setMode("search");
        setSearchQuery("");
        setPatients([]);
        setSearchPerformed(false);
      } catch (error) {
        console.error(
          "[Patient Registration] Patient created, but visit creation failed:",
          error,
        );

        // Still show the registered patient even if visit creation fails.
        setCursorHistory([null]);
        await loadRecentPatients(null, 1);

        showToast(
          "warning",
          `Patient registered successfully, but visit creation failed: ${
            error instanceof Error
              ? error.message
              : "Unknown error"
          }. You can check the patient and register a visit separately.`,
        );
      }
    } catch (error) {
      console.error(
        "[Patient Registration] Patient registration failed:",
        error,
      );

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to register patient.",
      );
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------------
  // REGISTER VISIT FOR EXISTING PATIENT
  // -----------------------------------

  async function registerExistingPatient(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!selectedPatient) return;

    setSaving(true);

    console.log(
      "[Patient Visit] Registering visit for existing patient:",
      selectedPatient,
    );

    try {
      await createVisit(selectedPatient.id);

      console.log(
        "[Patient Visit] Visit successfully registered for existing patient.",
      );

      // Refresh the current cursor page after the visit is created.
      const currentCursor = cursorHistory[recentPage - 1] ?? null;
      await loadRecentPatients(currentCursor, recentPage);

      showToast(
        "success",
        "New visit successfully registered for this patient.",
      );

      setSelectedPatient(null);
      setForm(initialForm);
      setMode("search");
      setSearchQuery("");
      setPatients([]);
      setSearchPerformed(false);
    } catch (error) {
      console.error(
        "[Patient Visit] Existing patient visit registration failed:",
        error,
      );

      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Unable to create patient visit.",
      );
    } finally {
      setSaving(false);
    }
  }

  function backToSearch() {
    setMode("search");
    setSelectedPatient(null);
  }

  // -----------------------------------
  // PAGE DISPLAY
  // -----------------------------------

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-7 sm:px-7">

      {/* Toast notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-5 top-5 z-[100] flex max-w-[420px] items-start gap-3 rounded-xl border bg-white p-4 shadow-xl ${
            toast.type === "success"
              ? "border-green-200"
              : toast.type === "warning"
                ? "border-amber-200"
                : "border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="mt-0.5 text-green-600" size={20} />
          ) : (
            <AlertCircle
              className={`mt-0.5 ${
                toast.type === "warning"
                  ? "text-amber-600"
                  : "text-red-600"
              }`}
              size={20}
            />
          )}

          <p className="text-sm font-medium text-[#294568]">
            {toast.message}
          </p>

          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-700"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Page heading */}
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.13em] text-blue-600">
            Reception / Patients
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-[#102f5f]">
            Patient Registration
          </h1>
          <p className="mt-1 text-sm text-[#7186a2]">
            Find an existing patient or register a new patient.
          </p>
        </div>

        {mode !== "search" && (
          <button
            type="button"
            onClick={backToSearch}
            className="flex items-center gap-2 self-start rounded-lg border border-[#dce6f1] bg-white px-4 py-2.5 text-sm font-medium text-[#294568] hover:bg-blue-50"
          >
            <ArrowLeft size={16} />
            Back to search
          </button>
        )}
      </div>

      {/* Search existing patients */}
      {mode === "search" && (
        <>
          <section className="rounded-2xl border border-[#e1ecf8] bg-white p-5 shadow-[0_3px_14px_rgba(28,73,125,0.035)] sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Search size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-[#102f5f]">
                  Search patient records
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Check whether the patient already exists before
                  registering a new record.
                </p>
              </div>
            </div>

            <form
              onSubmit={searchPatients}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(event.target.value)
                  }
                  placeholder="Patient number, name, phone or national ID"
                  className={`${inputClass} pl-10`}
                />
              </div>

              <button
                type="submit"
                disabled={searching}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searching ? (
                  <Loader2 className="animate-spin" size={17} />
                ) : (
                  <Search size={17} />
                )}
                Search
              </button>
            </form>

            {searchPerformed && patients.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#294568]">
                    Search results
                  </h3>

                  <span className="text-xs text-slate-500">
                    {patients.length} result(s)
                  </span>
                </div>

                <div className="divide-y divide-[#edf2f8] rounded-xl border border-[#e5edf6]">
                  {patients.map((patient) => (
                    <div
                      key={patient.id}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <UserRound size={19} />
                        </div>

                        <div>
                          <p className="font-semibold text-[#18365e]">
                            {[
                              patient.firstName,
                              patient.otherNames,
                              patient.lastName,
                            ]
                              .filter(Boolean)
                              .join(" ") || "Unnamed patient"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {patient.patientNumber
                              ? `Patient No: ${patient.patientNumber} · `
                              : ""}
                            {patient.phone || "No phone number"}
                          </p>

                          {patient.nationalId && (
                            <p className="mt-0.5 text-xs text-slate-500">
                              National ID: {patient.nationalId}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => selectPatient(patient)}
                        className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        Select patient
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchPerformed && patients.length === 0 && (
              <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center">
                <Users
                  size={26}
                  className="mx-auto mb-2 text-slate-400"
                />

                <p className="text-sm font-medium text-[#294568]">
                  No matching patient records
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  You can proceed to register this person as a new
                  patient.
                </p>
              </div>
            )}
          </section>

          {/* New patient call to action */}
          <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl border border-blue-100 bg-[#edf5ff] p-5 sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600">
                <UserPlus size={21} />
              </div>

              <div>
                <h2 className="font-semibold text-[#102f5f]">
                  New patient?
                </h2>

                <p className="mt-1 text-sm text-[#7186a2]">
                  Create a patient record and register their first visit.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMode("new")}
              className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <UserPlus size={17} />
              Register new patient
            </button>
          </section>

          {/* REGISTERED PATIENTS LIST */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1ecf8] bg-white shadow-[0_3px_14px_rgba(28,73,125,0.035)]">

            <div className="flex flex-col gap-3 border-b border-[#edf2f8] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users size={21} />
                </div>

                <div>
                  <h2 className="font-semibold text-[#102f5f]">
                    Registered patients
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    View and manage recently registered patient records.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  {recentPatients.length} shown
                </span>

                <button
                  type="button"
                  onClick={() =>
                    loadRecentPatients(
                      cursorHistory[recentPage - 1] ?? null,
                      recentPage,
                    )
                  }
                  disabled={recentLoading}
                  title="Refresh patient list"
                  aria-label="Refresh patient list"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dce6f1] text-[#294568] transition hover:bg-blue-50 disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={recentLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            {recentLoading && recentPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14">
                <Loader2
                  size={30}
                  className="animate-spin text-blue-600"
                />
                <p className="mt-3 text-sm text-slate-500">
                  Loading registered patients...
                </p>
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Users
                  size={32}
                  className="mx-auto mb-3 text-slate-300"
                />
                <p className="font-medium text-[#294568]">
                  No registered patients yet
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Registered patients will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop patient table */}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead className="bg-[#f7faff]">
                      <tr className="text-xs font-semibold uppercase tracking-wide text-[#7186a2]">
                        <th className="px-6 py-4">Patient</th>
                        <th className="px-6 py-4">Patient number</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Sex</th>
                        <th className="px-6 py-4">Date registered</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Latest visit</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#edf2f8]">
                      {recentPatients.map((patient) => {
                        const latestVisit = patient.visits?.[0];

                        return (
                          <tr
                            key={patient.id}
                            className="transition hover:bg-blue-50/40"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                  <UserRound size={17} />
                                </div>

                                <div>
                                  <p className="font-semibold text-[#18365e]">
                                    {[
                                      patient.firstName,
                                      patient.otherNames,
                                      patient.lastName,
                                    ]
                                      .filter(Boolean)
                                      .join(" ") || "Unnamed patient"}
                                  </p>

                                  {patient.nationalId && (
                                    <p className="mt-0.5 text-xs text-slate-500">
                                      ID: {patient.nationalId}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-[#294568]">
                                {patient.patientNumber || "—"}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm text-[#294568]">
                                  {patient.phone || "No phone"}
                                </p>
                                {patient.email && (
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {patient.email}
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="text-sm text-[#294568]">
                                {patient.sex
                                  ? patient.sex.charAt(0) +
                                    patient.sex.slice(1).toLowerCase()
                                  : "—"}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              <span className="whitespace-nowrap text-sm text-[#7186a2]">
                                {formatRegistrationDate(patient.createdAt)}
                              </span>
                            </td>

                            <td className="px-6 py-4">
                              {patient.isTemporary ? (
                                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                  Temporary
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                  Registered
                                </span>
                              )}
                            </td>

                            {/* Latest visit status */}
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getVisitStatusClass(
                                  latestVisit?.status,
                                )}`}
                              >
                                {getVisitStatusLabel(latestVisit?.status)}
                              </span>

                              {latestVisit?.visitNumber && (
                                <p className="mt-1 text-xs text-slate-400">
                                  {latestVisit.visitNumber}
                                </p>
                              )}
                            </td>

                            {/* Manually check visit */}
                            <td className="px-6 py-4">
                              <button
                                type="button"
                                onClick={() => checkPatientVisit(patient.id)}
                                disabled={checkingVisitId === patient.id}
                                title="Check the latest visit without creating a new one"
                                className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {checkingVisitId === patient.id ? (
                                  <Loader2
                                    size={14}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <RefreshCw size={14} />
                                )}
                                Check Visit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="flex flex-col gap-4 border-t border-[#edf2f8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                  <p className="text-sm text-slate-500">
                    Page{" "}
                    <span className="font-semibold text-[#294568]">
                      {recentPage}
                    </span>
                    {" · Showing "}
                    <span className="font-semibold text-[#294568]">
                      {recentPatients.length}
                    </span>
                    {" patients"}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5">

                    {/* Previous */}
                    <button
                      type="button"
                      onClick={changeToPreviousRecentPage}
                      disabled={recentPage === 1 || recentLoading}
                      className="flex items-center gap-1 rounded-lg border border-[#dce6f1] px-3 py-2 text-sm font-medium text-[#294568] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>

                    {/* Next */}
                    <button
                      type="button"
                      onClick={changeToNextRecentPage}
                      disabled={
                        !hasMore || !nextCursor || recentLoading
                      }
                      className="flex items-center gap-1 rounded-lg border border-[#dce6f1] px-3 py-2 text-sm font-medium text-[#294568] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {/* EXISTING PATIENT VISIT */}
      {mode === "existing" && selectedPatient && (
        <section className="rounded-2xl border border-[#e1ecf8] bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-[#102f5f]">
                Register patient visit
              </h2>

              <p className="text-sm text-slate-500">
                A new visit will be added to the selected patient.
              </p>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Selected patient
            </p>

            <p className="mt-1 font-semibold text-[#18365e]">
              {[
                selectedPatient.firstName,
                selectedPatient.otherNames,
                selectedPatient.lastName,
              ]
                .filter(Boolean)
                .join(" ")}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {selectedPatient.patientNumber || "Patient number unavailable"}
              {selectedPatient.phone
                ? ` · ${selectedPatient.phone}`
                : ""}
            </p>
          </div>

          <form onSubmit={registerExistingPatient} className="space-y-5">
            <VisitFields form={form} updateField={updateField} />

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
            >
              {saving && <Loader2 size={17} className="animate-spin" />}
              Register visit
            </button>
          </form>
        </section>
      )}

      {/* NEW PATIENT REGISTRATION */}
      {mode === "new" && (
        <form
          onSubmit={registerNewPatient}
          className="space-y-5"
        >
          <section className="rounded-2xl border border-[#e1ecf8] bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              icon={<UserRound size={20} />}
              title="Personal information"
              description="Enter the patient's basic identification details."
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="First name *">
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className={inputClass}
                  placeholder="First name"
                />
              </Field>

              <Field label="Last name *">
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className={inputClass}
                  placeholder="Last name"
                />
              </Field>

              <Field label="Other names">
                <input
                  value={form.otherNames}
                  onChange={(e) => updateField("otherNames", e.target.value)}
                  className={inputClass}
                  placeholder="Other names"
                />
              </Field>

              <Field label="Date of birth">
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Sex *">
                <select
                  required
                  value={form.sex}
                  onChange={(e) => updateField("sex", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select sex</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </Field>

              <Field label="National ID">
                <input
                  value={form.nationalId}
                  onChange={(e) => updateField("nationalId", e.target.value)}
                  className={inputClass}
                  placeholder="National ID number"
                />
              </Field>

              <Field label="Birth certificate number">
                <input
                  value={form.birthCertificateNumber}
                  onChange={(e) =>
                    updateField("birthCertificateNumber", e.target.value)
                  }
                  className={inputClass}
                  placeholder="Birth certificate number"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e1ecf8] bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              icon={<Users size={20} />}
              title="Contact information"
              description="How can the hospital contact this patient?"
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Phone number *">
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className={inputClass}
                  placeholder="07XX XXX XXX"
                />
              </Field>

              <Field label="Alternative phone">
                <input
                  type="tel"
                  value={form.alternativePhone}
                  onChange={(e) =>
                    updateField("alternativePhone", e.target.value)
                  }
                  className={inputClass}
                  placeholder="Alternative phone"
                />
              </Field>

              <Field label="Email address">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={inputClass}
                  placeholder="patient@example.com"
                />
              </Field>

              <Field label="Residence">
                <input
                  value={form.residence}
                  onChange={(e) => updateField("residence", e.target.value)}
                  className={inputClass}
                  placeholder="Town, estate or area"
                />
              </Field>

              <Field label="Occupation">
                <input
                  value={form.occupation}
                  onChange={(e) => updateField("occupation", e.target.value)}
                  className={inputClass}
                  placeholder="Occupation"
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e1ecf8] bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              icon={<Users size={20} />}
              title="Next of kin"
              description="Emergency contact or person responsible for the patient."
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Full name">
                <input
                  value={form.nextOfKinName}
                  onChange={(e) =>
                    updateField("nextOfKinName", e.target.value)
                  }
                  className={inputClass}
                  placeholder="Next of kin's full name"
                />
              </Field>

              <Field label="Phone number">
                <input
                  type="tel"
                  value={form.nextOfKinPhone}
                  onChange={(e) =>
                    updateField("nextOfKinPhone", e.target.value)
                  }
                  className={inputClass}
                  placeholder="Phone number"
                />
              </Field>

              <Field label="Relationship">
                <select
                  value={form.nextOfKinRelationship}
                  onChange={(e) =>
                    updateField("nextOfKinRelationship", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Select relationship</option>
                  <option value="Parent">Parent</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Child">Child</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Relative">Relative</option>
                  <option value="Friend">Friend</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e1ecf8] bg-white p-5 shadow-sm sm:p-7">
            <SectionHeading
              icon={<ClipboardList size={20} />}
              title="First visit details"
              description="Record why the patient is visiting the hospital."
            />

            <VisitFields form={form} updateField={updateField} />
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={backToSearch}
              className="rounded-lg border border-[#dce6f1] bg-white px-6 py-3 text-sm font-semibold text-[#294568] hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-7 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Registering patient...
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Register patient
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// -----------------------------------
// REUSABLE FORM COMPONENTS
// -----------------------------------

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-[#102f5f]">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function VisitFields({
  form,
  updateField,
}: {
  form: PatientForm;
  updateField: (field: keyof PatientForm, value: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Visit type *">
        <select
          required
          value={form.visitType}
          onChange={(e) => updateField("visitType", e.target.value)}
          className={inputClass}
        >
          <option value="OUTPATIENT">Outpatient</option>
          <option value="EMERGENCY">Emergency</option>
          <option value="FOLLOW_UP">Follow-up</option>
        </select>
      </Field>

      <Field label="Department *">
        <input
          required
          value={form.department}
          onChange={(e) => updateField("department", e.target.value)}
          className={inputClass}
          placeholder="e.g. General Outpatient"
        />
      </Field>

      <div className="sm:col-span-2">
        <Field label="Reason for visit *">
          <textarea
            required
            rows={3}
            value={form.reasonForVisit}
            onChange={(e) =>
              updateField("reasonForVisit", e.target.value)
            }
            className={inputClass}
            placeholder="Briefly describe the reason for this visit..."
          />
        </Field>
      </div>
    </div>
  );
}
 





