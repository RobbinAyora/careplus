
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ClipboardList,
  HeartPulse,
  RefreshCw,
  Search,
  Stethoscope,
  Thermometer,
  UserRound,
  Weight,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  FileText,
} from "lucide-react";

import { useAuth } from "@/lib/auth/session";
import { useApiClient, ApiError } from "@/lib/api/client";
import { fetchAllPages } from "@/lib/api/pagination";
import { useIdempotencyKey } from "@/lib/api/idempotency";

const PAGE_SIZE = 20;

type TriagePriority = "EMERGENCY" | "URGENT" | "NORMAL" | "LOW";
type QueueFilter = "ALL" | "EMERGENCY" | "ROUTINE";

interface Patient {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  otherNames?: string | null;
  dateOfBirth?: string | null;
  estimatedAgeYears?: number | null;
  sex: string;
  phone?: string | null;
}

interface Department {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

interface QueueEntry {
  id: string;
  status: string;
  department?: string | null;
  queueNumber?: number | null;
  checkedInAt?: string;
}

interface Visit {
  id: string;
  visitNumber: string;
  visitType: string;
  status: string;
  department?: string | null;
  departmentId?: string | null;
  reasonForVisit?: string | null;
  isEmergency: boolean;
  createdAt: string;
  patient: Patient;
  queueEntry?: QueueEntry | null;
}

interface UnassignedQueueEntry extends QueueEntry {
  assignedDoctorId?: string | null;
  triagedAt?: string | null;
  visit: Visit & {
    triageRecord?: {
      priority: TriagePriority;
    } | null;
    departmentRef?: Department | null;
  };
}

interface TriageForm {
  chiefComplaint: string;
  temperature: string;
  pulseRate: string;
  systolicBP: string;
  diastolicBP: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  weight: string;
  height: string;
  allergies: string;
  currentMedications: string;
  priority: TriagePriority;
  additionalNotes: string;
}

const initialForm: TriageForm = {
  chiefComplaint: "",
  temperature: "",
  pulseRate: "",
  systolicBP: "",
  diastolicBP: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  weight: "",
  height: "",
  allergies: "",
  currentMedications: "",
  priority: "NORMAL",
  additionalNotes: "",
};

interface TriageResult {
  message?: string;
  alreadyRecorded?: boolean;
  triage?: { id: string; version?: number };
  assignment?: {
    assigned: boolean;
    doctor?: {
      id: string;
      firstName: string;
      lastName: string;
      department?: string | null;
    } | null;
    message?: string;
  };
}

const inputClass =
  "w-full rounded-xl border border-[#e2eaf4] bg-white px-3.5 py-3 text-sm text-[#18365f] outline-none transition placeholder:text-[#9aabc0] focus:border-[#2d91e8] focus:ring-2 focus:ring-[#2d91e8]/10";

const labelClass =
  "mb-2 block text-xs font-semibold text-[#55749c]";

function getPatientName(patient: Patient) {
  return [
    patient.firstName,
    patient.otherNames,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getPatientAge(patient: Patient) {
  if (patient.dateOfBirth) {
    const birthDate = new Date(patient.dateOfBirth);

    if (Number.isNaN(birthDate.getTime())) {
      return "Not recorded";
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference =
      today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? `${age} years` : "Not recorded";
  }

  if (
    patient.estimatedAgeYears !== null &&
    patient.estimatedAgeYears !== undefined
  ) {
    return `${patient.estimatedAgeYears} years`;
  }

  return "Not recorded";
}

function formatDate(date?: string) {
  if (!date) return "Not recorded";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not recorded";
  }

  return parsedDate.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function splitList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined;
  return Number(value);
}

function optionalInteger(value: string) {
  if (!value.trim()) return undefined;
  return Number.parseInt(value, 10);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function describeAssignment(result: TriageResult) {
  const assignment = result.assignment;

  if (assignment?.assigned && assignment.doctor) {
    const department = assignment.doctor.department
      ? ` (${assignment.doctor.department})`
      : "";

    return `Assigned to Dr. ${assignment.doctor.firstName} ${assignment.doctor.lastName}${department}.`;
  }

  if (assignment && !assignment.assigned) {
    return "No suitable doctor is currently available; the patient remains in the waiting queue.";
  }

  return "";
}

export default function TriagePage() {
  // --------------------------------------------------
  // AUTHENTICATION AND CENTRAL API CLIENT
  // --------------------------------------------------

  const { isSessionLoaded } = useAuth();
  const apiRequest = useApiClient();

  const triageKey = useIdempotencyKey();
  const unassignedInFlight = useRef(false);

  useEffect(() => {
    console.group("[CarePlus] Authentication diagnostics");

    console.log("Session loaded:", isSessionLoaded);
    console.log(
      "API URL configured:",
      Boolean(process.env.NEXT_PUBLIC_API_URL),
    );

    if (!isSessionLoaded) {
      console.warn("Authentication session is still loading.");
    } else {
      console.log("Authentication session has loaded.");
    }

    console.groupEnd();
  }, [isSessionLoaded]);

  const [queue, setQueue] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] =
    useState<Visit | null>(null);

  const [unassignedPatients, setUnassignedPatients] = useState<
    UnassignedQueueEntry[]
  >([]);

  const [loadingUnassigned, setLoadingUnassigned] = useState(false);
  const [unassignedError, setUnassignedError] = useState("");

  const [form, setForm] = useState<TriageForm>(initialForm);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<QueueFilter>("ALL");

  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState("");
  const [loadingDepartments, setLoadingDepartments] =
    useState(false);

  // --------------------------------------------------
  // LOAD ACTIVE DEPARTMENTS
  // --------------------------------------------------

  const loadDepartments = useCallback(async () => {
    if (!isSessionLoaded) {
      return;
    }

    console.log("[CarePlus] Loading departments");

    setLoadingDepartments(true);

    try {
      const data = await fetchAllPages<Department>(
        apiRequest,
        "/departments",
      );

      const activeDepartments = data.filter(
        (department) => department.isActive,
      );

      console.log("Departments received:", data.length);
      console.log("Active departments:", activeDepartments.length);

      setDepartments(activeDepartments);
    } catch (err) {
      console.error(
        "[CarePlus] Department loading failed:",
        err,
      );

      setError(
        getErrorMessage(
          err,
          "Unable to load hospital departments.",
        ),
      );
    } finally {
      setLoadingDepartments(false);
    }
  }, [apiRequest, isSessionLoaded]);

  useEffect(() => {
    if (isSessionLoaded) {
      void loadDepartments();
    }
  }, [isSessionLoaded, loadDepartments]);

  // --------------------------------------------------
  // LOAD TRIAGE QUEUE
  // --------------------------------------------------

  const loadQueue = useCallback(async () => {
    if (!isSessionLoaded) {
      return;
    }

    console.log("[CarePlus] Loading triage queue");

    setLoading(true);
    setError("");

    try {
      const data = await fetchAllPages<Visit>(
        apiRequest,
        "/triage/queue",
        { limit: 100 },
      );

      console.log("Queue records received:", data.length);

      // Exclude cancelled visits from the triage queue.
      setQueue(
        data.filter((visit) => visit.status !== "CANCELLED"),
      );
    } catch (err) {
      console.error(
        "[CarePlus] Queue loading failed:",
        err,
      );

      setError(
        getErrorMessage(err, "Unable to load triage queue."),
      );
    } finally {
      setLoading(false);
    }
  }, [apiRequest, isSessionLoaded]);

  useEffect(() => {
    if (isSessionLoaded) {
      void loadQueue();
    }
  }, [isSessionLoaded, loadQueue]);

  // --------------------------------------------------
  // LOAD UNASSIGNED PATIENTS
  // --------------------------------------------------

  const loadUnassignedPatients = useCallback(async () => {
    if (!isSessionLoaded) {
      return;
    }

    // Skip if the previous load is still running. On a slow connection
    // overlapping polls would pile up.
    if (unassignedInFlight.current) {
      return;
    }

    unassignedInFlight.current = true;

    setLoadingUnassigned(true);
    setUnassignedError("");

    try {
      const entries = await fetchAllPages<UnassignedQueueEntry>(
        apiRequest,
        "/triage/unassigned",
        { limit: 100, maxPages: 5 },
      );

      setUnassignedPatients(entries);
    } catch (err) {
      console.error(
        "[CarePlus] Unassigned patients loading failed:",
        err,
      );

      setUnassignedError(
        getErrorMessage(
          err,
          "Unable to load unassigned patients.",
        ),
      );
    } finally {
      unassignedInFlight.current = false;
      setLoadingUnassigned(false);
    }
  }, [apiRequest, isSessionLoaded]);

  // --------------------------------------------------
  // AUTOMATICALLY REFRESH UNASSIGNED PATIENTS
  // --------------------------------------------------

  useEffect(() => {
    if (!isSessionLoaded) {
      return;
    }

    void loadUnassignedPatients();

    const interval = window.setInterval(() => {
      if (document.hidden) {
        return;
      }

      void loadUnassignedPatients();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [isSessionLoaded, loadUnassignedPatients]);

  // --------------------------------------------------
  // FILTER AND SEARCH
  // --------------------------------------------------

  const filteredQueue = useMemo(() => {
    const query = search.toLowerCase().trim();

    return queue.filter((visit) => {
      const patientName =
        getPatientName(visit.patient).toLowerCase();

      const matchesSearch =
        !query ||
        patientName.includes(query) ||
        visit.patient.patientNumber
          .toLowerCase()
          .includes(query) ||
        visit.visitNumber.toLowerCase().includes(query) ||
        (visit.patient.phone ?? "").includes(query);

      const emergency =
        visit.isEmergency ||
        visit.visitType === "EMERGENCY";

      const matchesFilter =
        activeFilter === "ALL" ||
        (activeFilter === "EMERGENCY" && emergency) ||
        (activeFilter === "ROUTINE" && !emergency);

      return matchesSearch && matchesFilter;
    });
  }, [queue, search, activeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredQueue.length / PAGE_SIZE),
  );

  const paginatedQueue = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;

    return filteredQueue.slice(
      startIndex,
      startIndex + PAGE_SIZE,
    );
  }, [filteredQueue, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // --------------------------------------------------
  // SUMMARY COUNTS
  // --------------------------------------------------

  const emergencyCount = queue.filter(
    (visit) =>
      visit.isEmergency || visit.visitType === "EMERGENCY",
  ).length;

  const routineCount = queue.length - emergencyCount;

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  const updateField = (
    field: keyof TriageForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const selectPatient = (visit: Visit) => {
    setSelectedVisit(visit);
    setForm(initialForm);

    setSelectedDepartmentId(visit.departmentId ?? "");

    setError("");
    setSuccess("");
  };

  const closeAssessment = () => {
    if (saving) return;

    setSelectedVisit(null);
    setForm(initialForm);
    setSelectedDepartmentId("");
    setError("");
  };

  // --------------------------------------------------
  // SUBMIT TRIAGE
  // --------------------------------------------------

  const submitTriage = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedVisit) {
      return;
    }

    if (!isSessionLoaded) {
      setError(
        "Your session is still loading. Please try again.",
      );
      return;
    }

    if (form.chiefComplaint.trim().length < 2) {
      setError("Please enter the patient's chief complaint.");
      return;
    }

    if (!selectedDepartmentId) {
      setError("Please select the department for this patient.");
      return;
    }

    const numericValues = [
      form.temperature,
      form.pulseRate,
      form.systolicBP,
      form.diastolicBP,
      form.respiratoryRate,
      form.oxygenSaturation,
      form.weight,
      form.height,
    ];

    if (
      numericValues.some(
        (value) =>
          value.trim() &&
          !Number.isFinite(Number(value)),
      )
    ) {
      setError(
        "Please enter valid numerical values for the vital signs.",
      );
      return;
    }

    const integerValues = [
      form.pulseRate,
      form.systolicBP,
      form.diastolicBP,
      form.respiratoryRate,
    ];

    if (
      integerValues.some(
        (value) =>
          value.trim() &&
          !Number.isInteger(Number(value)),
      )
    ) {
      setError(
        "Pulse, blood pressure and respiratory rate must be whole numbers.",
      );
      return;
    }

    const payload = {
      chiefComplaint: form.chiefComplaint.trim(),

      temperature: optionalNumber(form.temperature),
      pulseRate: optionalInteger(form.pulseRate),
      systolicBP: optionalInteger(form.systolicBP),
      diastolicBP: optionalInteger(form.diastolicBP),
      respiratoryRate: optionalInteger(form.respiratoryRate),
      oxygenSaturation: optionalNumber(form.oxygenSaturation),

      weight: optionalNumber(form.weight),
      height: optionalNumber(form.height),

      allergies: splitList(form.allergies),
      currentMedications: splitList(form.currentMedications),

      priority: form.priority,

      additionalNotes:
        form.additionalNotes.trim() || undefined,

      departmentId: selectedDepartmentId,
    };

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // The same key is reused while the form is unchanged, so a retry
      // after a lost response or a double click cannot triage twice.
      const result = await apiRequest<TriageResult>(
        `/triage/${selectedVisit.id}`,
        {
          method: "POST",
          body: payload,
          headers: {
            "Idempotency-Key": triageKey.keyFor({
              visitId: selectedVisit.id,
              ...payload,
            }),
          },
          retryWrites: true,
        },
      );

      triageKey.reset();

      setQueue((previous) =>
        previous.filter(
          (visit) => visit.id !== selectedVisit.id,
        ),
      );

      setSelectedVisit(null);
      setForm(initialForm);
      setSelectedDepartmentId("");

      void loadUnassignedPatients();

      const prefix = result?.alreadyRecorded
        ? "This patient had already been triaged. "
        : "Triage completed successfully. ";

      setSuccess(
        `${prefix}${describeAssignment(result ?? {})}`.trim(),
      );
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.code === "VISIT_STATE_CHANGED" ||
          err.code === "QUEUE_STATE_CHANGED")
      ) {
        // Another nurse triaged this visit first.
        triageKey.reset();

        setSelectedVisit(null);
        setForm(initialForm);
        setSelectedDepartmentId("");

        setError(
          "This visit was changed by another user and may already have been triaged. The queue has been refreshed.",
        );

        void loadQueue();
        void loadUnassignedPatients();

        return;
      }

      let message = getErrorMessage(
        err,
        "Unable to save triage assessment.",
      );

      if (err instanceof ApiError) {
        if (err.retryable) {
          message +=
            " Your entries are kept. Press Complete triage again; it is safe to retry.";
        }

        if (err.requestId && err.status >= 500) {
          message += ` (Reference: ${err.requestId})`;
        }
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------------
  // FILTER BUTTON
  // --------------------------------------------------

  const filterButtonClass = (filter: QueueFilter) => {
    const active = activeFilter === filter;

    return `rounded-lg px-4 py-2 text-xs font-semibold transition ${
      active
        ? "bg-[#102f5f] text-white shadow-sm"
        : "border border-[#e5edf6] bg-white text-[#6e85a3] hover:bg-[#f5f9fe]"
    }`;
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 lg:px-6 xl:px-8">

      {/* PAGE HEADER */}

      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#2d91e8]">
            <Activity size={15} />
            Nursing department
          </div>

          <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-[#102f5f]">
            Patient Triage
          </h1>

          <p className="mt-1 text-sm text-[#7890ae]">
            Review waiting visits, assess patients and record
            clinical observations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadQueue();
            void loadUnassignedPatients();
          }}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e2ebf6] bg-white px-4 text-sm font-semibold text-[#55749c] shadow-sm transition hover:bg-[#f7fbff] disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh queue
        </button>
      </div>

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={19} />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-auto"
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && !selectedVisit && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto"
            aria-label="Dismiss error message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <div className="rounded-xl border border-[#e5eef9] bg-white p-5 shadow-[0_2px_10px_rgba(28,78,121,0.03)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#7890ae]">
                Awaiting triage
              </p>

              <h2 className="mt-2 text-3xl font-semibold text-[#102f5f]">
                {queue.length}
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2d91e8]">
              <ClipboardList size={22} />
            </div>
          </div>

          <p className="mt-3 text-xs text-[#91a3ba]">
            All visits awaiting nursing assessment
          </p>
        </div>

        <div className="rounded-xl border border-[#e5eef9] bg-white p-5 shadow-[0_2px_10px_rgba(28,78,121,0.03)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#7890ae]">
                Emergency cases
              </p>

              <h2 className="mt-2 text-3xl font-semibold text-red-600">
                {emergencyCount}
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <AlertTriangle size={22} />
            </div>
          </div>

          <p className="mt-3 text-xs text-[#91a3ba]">
            Visits flagged as emergencies
          </p>
        </div>

        <div className="rounded-xl border border-[#e5eef9] bg-white p-5 shadow-[0_2px_10px_rgba(28,78,121,0.03)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#7890ae]">
                Routine visits
              </p>

              <h2 className="mt-2 text-3xl font-semibold text-[#102f5f]">
                {routineCount}
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef7ff] text-[#2d91e8]">
              <HeartPulse size={22} />
            </div>
          </div>

          <p className="mt-3 text-xs text-[#91a3ba]">
            Other visits awaiting assessment
          </p>
        </div>
      </div>

      {/* MAIN QUEUE */}

      <section className="overflow-hidden rounded-xl border border-[#e5eef9] bg-white shadow-[0_2px_10px_rgba(28,78,121,0.03)]">

        {/* QUEUE HEADER */}

        <div className="border-b border-[#edf2f8] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-base font-semibold text-[#102f5f]">
                Triage queue
              </h2>

              <p className="mt-1 text-xs text-[#91a3ba]">
                Patients whose visits are awaiting nursing assessment.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#2d91e8]">
                {filteredQueue.length} matching visits
              </span>

              <span className="rounded-full bg-[#f3f6fa] px-3 py-1.5 text-xs font-semibold text-[#7186a1]">
                {queue.length} total waiting
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

            {/* SEARCH */}

            <div className="relative w-full lg:max-w-md">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aabc0]"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search patient, number or phone..."
                className="h-11 w-full rounded-xl border border-[#e5eef7] bg-[#fbfdff] pl-10 pr-4 text-sm text-[#18365f] outline-none transition placeholder:text-[#a3b2c5] focus:border-[#2d91e8] focus:ring-2 focus:ring-[#2d91e8]/10"
              />
            </div>

            {/* FILTERS */}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter("ALL")}
                className={filterButtonClass("ALL")}
              >
                All visits
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("EMERGENCY")}
                className={filterButtonClass("EMERGENCY")}
              >
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  Emergency
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter("ROUTINE")}
                className={filterButtonClass("ROUTINE")}
              >
                Routine
              </button>
            </div>
          </div>
        </div>

        {/* TABLE */}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#7890ae]">
            <RefreshCw size={27} className="animate-spin" />
            <p className="mt-3 text-sm">
              Loading triage queue...
            </p>
          </div>
        ) : error && queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={25} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#18365f]">
              Unable to load triage queue
            </h3>

            <p className="mt-2 max-w-md text-xs text-[#91a3ba]">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadQueue()}
              className="mt-5 rounded-lg bg-[#2d91e8] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#187fd8]"
            >
              Try again
            </button>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#2d91e8]">
              <ClipboardList size={25} />
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#18365f]">
              {queue.length === 0
                ? "No patients awaiting triage"
                : "No matching visits"}
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-[#91a3ba]">
              {queue.length === 0
                ? "New visits awaiting nursing assessment will appear here."
                : "Try a different search term or change the selected filter."}
            </p>

            {(search || activeFilter !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveFilter("ALL");
                }}
                className="mt-4 text-xs font-semibold text-[#2d91e8] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-[#f8fafd]">
                  <tr className="border-b border-[#edf2f8]">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8ca0b9]">
                      Patient
                    </th>

                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8ca0b9]">
                      Visit details
                    </th>

                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8ca0b9]">
                      Visit type
                    </th>

                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8ca0b9]">
                      Arrival
                    </th>

                    <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8ca0b9]">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.08em] text-[#8ca0b9]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf2f8]">
                  {paginatedQueue.map((visit) => {
                    const emergency =
                      visit.isEmergency ||
                      visit.visitType === "EMERGENCY";

                    return (
                      <tr
                        key={visit.id}
                        className={`transition hover:bg-[#f9fbfe] ${
                          emergency ? "bg-red-50/20" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                emergency
                                  ? "bg-red-50 text-red-600"
                                  : "bg-[#eaf4ff] text-[#2d91e8]"
                              }`}
                            >
                              <UserRound size={19} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="truncate text-sm font-semibold text-[#18365f]">
                                  {getPatientName(visit.patient)}
                                </p>

                                {emergency && (
                                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-600">
                                    EMERGENCY
                                  </span>
                                )}
                              </div>

                              <p className="mt-1 text-xs text-[#91a3ba]">
                                {visit.patient.patientNumber}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-xs font-semibold text-[#18365f]">
                            {visit.visitNumber}
                          </p>

                          <p className="mt-1 max-w-[190px] truncate text-[11px] text-[#91a3ba]">
                            {visit.reasonForVisit || "No reason recorded"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-[#f1f6fc] px-2.5 py-1.5 text-[11px] font-semibold text-[#55749c]">
                            {visit.visitType.replace(/_/g, " ")}
                          </span>

                          {visit.department && (
                            <p className="mt-2 text-[10px] text-[#91a3ba]">
                              {visit.department}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-[#55749c]">
                            <Clock3 size={13} className="text-[#91a3ba]" />
                            {formatDate(
                              visit.queueEntry?.checkedInAt ||
                                visit.createdAt,
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] font-bold ${
                              emergency
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                emergency
                                  ? "bg-red-500"
                                  : "bg-amber-500"
                              }`}
                            />
                            {emergency ? "Emergency" : "Awaiting triage"}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => selectPatient(visit)}
                            className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition ${
                              emergency
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-[#2d91e8] text-white hover:bg-[#187fd8]"
                            }`}
                          >
                            <Stethoscope size={14} />
                            Assess patient
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}

            <div className="divide-y divide-[#edf2f8] md:hidden">
              {paginatedQueue.map((visit) => {
                const emergency =
                  visit.isEmergency ||
                  visit.visitType === "EMERGENCY";

                return (
                  <div
                    key={visit.id}
                    className={`p-5 ${
                      emergency ? "bg-red-50/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          emergency
                            ? "bg-red-50 text-red-600"
                            : "bg-[#eaf4ff] text-[#2d91e8]"
                        }`}
                      >
                        <UserRound size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-[#18365f]">
                            {getPatientName(visit.patient)}
                          </h3>

                          {emergency && (
                            <span className="rounded-full bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600">
                              EMERGENCY
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-[#91a3ba]">
                          {visit.patient.patientNumber}
                        </p>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] text-[#91a3ba]">
                              Visit number
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#18365f]">
                              {visit.visitNumber}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-[#91a3ba]">
                              Visit type
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#18365f]">
                              {visit.visitType.replace(/_/g, " ")}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-[#91a3ba]">
                              Age / sex
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#18365f]">
                              {getPatientAge(visit.patient)} · {visit.patient.sex}
                            </p>
                          </div>

                          <div>
                            <p className="text-[10px] text-[#91a3ba]">
                              Arrival
                            </p>
                            <p className="mt-1 text-xs font-semibold text-[#18365f]">
                              {formatDate(
                                visit.queueEntry?.checkedInAt ||
                                  visit.createdAt,
                              )}
                            </p>
                          </div>
                        </div>

                        {visit.reasonForVisit && (
                          <p className="mt-3 text-xs text-[#7890ae]">
                            {visit.reasonForVisit}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => selectPatient(visit)}
                          className={`mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold text-white ${
                            emergency
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-[#2d91e8] hover:bg-[#187fd8]"
                          }`}
                        >
                          <Stethoscope size={15} />
                          Assess patient
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* PAGINATION */}

            <div className="flex flex-col gap-3 border-t border-[#edf2f8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-[#91a3ba]">
                Showing{" "}
                <span className="font-semibold text-[#55749c]">
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>
                {" - "}
                <span className="font-semibold text-[#55749c]">
                  {Math.min(
                    currentPage * PAGE_SIZE,
                    filteredQueue.length,
                  )}
                </span>
                {" of "}
                <span className="font-semibold text-[#55749c]">
                  {filteredQueue.length}
                </span>
                {" visits"}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex h-9 items-center gap-1 rounded-lg border border-[#e2ebf6] px-3 text-xs font-semibold text-[#55749c] transition hover:bg-[#f7fbff] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>

                <span className="px-2 text-xs font-semibold text-[#55749c]">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1),
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="flex h-9 items-center gap-1 rounded-lg border border-[#e2ebf6] px-3 text-xs font-semibold text-[#55749c] transition hover:bg-[#f7fbff] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* UNASSIGNED PATIENTS */}

      <section className="mt-6 overflow-hidden rounded-xl border border-[#e5eef9] bg-white shadow-[0_2px_10px_rgba(28,78,121,0.03)]">

        <div className="flex flex-col justify-between gap-3 border-b border-[#edf2f8] p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="text-base font-semibold text-[#102f5f]">
              Unassigned patients
            </h2>

            <p className="mt-1 text-xs text-[#91a3ba]">
              Triaged patients waiting for an available doctor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              {unassignedPatients.length} waiting
            </span>

            <button
              type="button"
              onClick={() => void loadUnassignedPatients()}
              disabled={loadingUnassigned}
              className="flex h-9 items-center gap-2 rounded-lg border border-[#e2ebf6] px-3 text-xs font-semibold text-[#55749c] transition hover:bg-[#f7fbff] disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loadingUnassigned ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {unassignedError ? (
          <div className="px-6 py-10 text-center">
            <AlertCircle
              size={25}
              className="mx-auto text-red-500"
            />

            <p className="mt-3 text-sm font-semibold text-[#18365f]">
              Unable to load unassigned patients
            </p>

            <p className="mt-2 text-xs text-red-500">
              {unassignedError}
            </p>

            <button
              type="button"
              onClick={() => void loadUnassignedPatients()}
              className="mt-4 rounded-lg bg-[#2d91e8] px-4 py-2 text-xs font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : loadingUnassigned && unassignedPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#7890ae]">
            <RefreshCw size={24} className="animate-spin" />

            <p className="mt-3 text-sm">
              Loading unassigned patients...
            </p>
          </div>
        ) : unassignedPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 size={23} />
            </div>

            <h3 className="mt-3 text-sm font-semibold text-[#18365f]">
              No unassigned patients
            </h3>

            <p className="mt-2 max-w-sm text-xs leading-5 text-[#91a3ba]">
              All currently triaged patients have either been assigned
              to doctors or completed their consultations.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-[#f8fafd]">
                <tr className="border-b border-[#edf2f8]">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-[#8ca0b9]">
                    Patient
                  </th>

                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wide text-[#8ca0b9]">
                    Visit number
                  </th>

                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wide text-[#8ca0b9]">
                    Department
                  </th>

                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wide text-[#8ca0b9]">
                    Priority
                  </th>

                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wide text-[#8ca0b9]">
                    Waiting since
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2f8]">
                {unassignedPatients.map((entry) => {
                  const visit = entry.visit;

                  const priority =
                    visit.triageRecord?.priority ?? "NORMAL";

                  const priorityStyles: Record<
                    TriagePriority,
                    string
                  > = {
                    EMERGENCY: "bg-red-50 text-red-700",
                    URGENT: "bg-orange-50 text-orange-700",
                    NORMAL: "bg-blue-50 text-blue-700",
                    LOW: "bg-slate-50 text-slate-600",
                  };

                  return (
                    <tr
                      key={entry.id}
                      className="transition hover:bg-[#f9fbfe]"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-[#18365f]">
                          {getPatientName(visit.patient)}
                        </p>

                        <p className="mt-1 text-xs text-[#91a3ba]">
                          {visit.patient.patientNumber}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-[#18365f]">
                          {visit.visitNumber}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-medium text-[#55749c]">
                          {entry.department ||
                            visit.departmentRef?.name ||
                            "Not recorded"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1.5 text-[10px] font-bold ${priorityStyles[priority]}`}
                        >
                          {priority}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-[#55749c]">
                          <Clock3
                            size={13}
                            className="text-[#91a3ba]"
                          />

                          {formatDate(
                            entry.triagedAt ||
                              entry.checkedInAt ||
                              visit.createdAt,
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-[#edf2f8] px-5 py-3 sm:px-6">
          <p className="text-[11px] text-[#91a3ba]">
            This list automatically refreshes every 15 seconds to reflect
            doctor assignments.
          </p>
        </div>
      </section>

      {/* ASSESSMENT DRAWER */}

      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex justify-end">

          {/* BACKDROP */}

          <button
            type="button"
            onClick={closeAssessment}
            disabled={saving}
            aria-label="Close assessment panel"
            className="absolute inset-0 bg-[#10243f]/45 backdrop-blur-[2px]"
          />

          {/* PANEL */}

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="triage-panel-title"
            className="relative z-10 flex h-full w-full max-w-[760px] flex-col bg-[#f8fafd] shadow-2xl"
          >

            {/* DRAWER HEADER */}

            <div className="flex shrink-0 items-center justify-between border-b border-[#e5edf6] bg-white px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf4ff] text-[#2d91e8]">
                  <Stethoscope size={20} />
                </div>

                <div>
                  <h2
                    id="triage-panel-title"
                    className="text-base font-semibold text-[#102f5f]"
                  >
                    Nursing assessment
                  </h2>

                  <p className="mt-1 text-xs text-[#91a3ba]">
                    Record patient observations and triage priority
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAssessment}
                disabled={saving}
                aria-label="Close assessment"
                className="rounded-lg p-2 text-[#7890ae] transition hover:bg-[#f1f6fb] hover:text-[#18365f] disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* DRAWER CONTENT */}

            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">

              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>

                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="ml-auto"
                    aria-label="Dismiss error"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* PATIENT INFORMATION */}

              <div className="mb-5 rounded-xl border border-[#e5edf6] bg-white p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eaf4ff] text-[#2d91e8]">
                    <UserRound size={23} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[#102f5f]">
                        {getPatientName(selectedVisit.patient)}
                      </h3>

                      {(selectedVisit.isEmergency ||
                        selectedVisit.visitType === "EMERGENCY") && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-bold text-red-600">
                          EMERGENCY
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-[#7890ae]">
                      {selectedVisit.patient.patientNumber}
                      {" · "}
                      {selectedVisit.visitNumber}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-[#f7faff] p-3">
                    <p className="text-[10px] font-medium text-[#91a3ba]">
                      Age
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#18365f]">
                      {getPatientAge(selectedVisit.patient)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#f7faff] p-3">
                    <p className="text-[10px] font-medium text-[#91a3ba]">
                      Sex
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#18365f]">
                      {selectedVisit.patient.sex}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#f7faff] p-3">
                    <p className="text-[10px] font-medium text-[#91a3ba]">
                      Visit type
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#18365f]">
                      {selectedVisit.visitType.replace(/_/g, " ")}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#f7faff] p-3">
                    <p className="text-[10px] font-medium text-[#91a3ba]">
                      Phone
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-[#18365f]">
                      {selectedVisit.patient.phone || "Not recorded"}
                    </p>
                  </div>
                </div>

                {selectedVisit.reasonForVisit && (
                  <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#55749c]">
                      Reason for visit
                    </p>

                    <p className="mt-1 text-sm text-[#18365f]">
                      {selectedVisit.reasonForVisit}
                    </p>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 text-xs text-[#7890ae]">
                  <CalendarDays size={14} />
                  Visit date: {formatDate(selectedVisit.createdAt)}
                </div>
              </div>

              {/* TRIAGE FORM */}

              <form
                id="triage-form"
                onSubmit={submitTriage}
                className="space-y-5"
              >

                {/* DEPARTMENT SELECTION */}

                <div className="rounded-xl border border-[#e5edf6] bg-white p-5">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#102f5f]">
                    <Stethoscope
                      size={17}
                      className="text-[#2d91e8]"
                    />
                    Assign department
                  </h3>

                  <p className="mb-4 text-xs leading-5 text-[#91a3ba]">
                    Select the department that should receive this patient.
                    The system will look for an available doctor in this department.
                  </p>

                  <label
                    htmlFor="triage-department"
                    className={labelClass}
                  >
                    Patient department *
                  </label>

                  <select
                    id="triage-department"
                    required
                    value={selectedDepartmentId}
                    onChange={(event) =>
                      setSelectedDepartmentId(event.target.value)
                    }
                    disabled={loadingDepartments || departments.length === 0}
                    className={inputClass}
                  >
                    <option value="">
                      {loadingDepartments
                        ? "Loading departments..."
                        : departments.length === 0
                          ? "No active departments available"
                          : "Select a department"}
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department.id}
                        value={department.id}
                      >
                        {department.name}
                      </option>
                    ))}
                  </select>

                  {departments.length === 0 &&
                    !loadingDepartments && (
                      <p className="mt-2 text-xs text-red-500">
                        No active departments were found. Ask the hospital
                        administrator to create or activate departments.
                      </p>
                    )}
                </div>

                {/* CHIEF COMPLAINT */}

                <div className="rounded-xl border border-[#e5edf6] bg-white p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#102f5f]">
                    <ClipboardList
                      size={17}
                      className="text-[#2d91e8]"
                    />
                    Chief complaint
                  </h3>

                  <label className={labelClass}>
                    Patient&apos;s main complaint *
                  </label>

                  <textarea
                    required
                    minLength={2}
                    maxLength={1000}
                    rows={3}
                    value={form.chiefComplaint}
                    onChange={(event) =>
                      updateField("chiefComplaint", event.target.value)
                    }
                    placeholder="Describe the patient's main complaint and symptoms..."
                    className={`${inputClass} resize-y`}
                  />
                </div>

                {/* VITAL SIGNS */}

                <div className="rounded-xl border border-[#e5edf6] bg-white p-5">
                  <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#102f5f]">
                    <HeartPulse
                      size={17}
                      className="text-[#2d91e8]"
                    />
                    Vital signs
                  </h3>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <div>
                      <label className={labelClass}>
                        Temperature (°C)
                      </label>

                      <div className="relative">
                        <Thermometer
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91a3ba]"
                        />

                        <input
                          type="number"
                          step="0.1"
                          min="25"
                          max="45"
                          value={form.temperature}
                          onChange={(event) =>
                            updateField("temperature", event.target.value)
                          }
                          placeholder="e.g. 36.8"
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Pulse rate (bpm)
                      </label>

                      <input
                        type="number"
                        min="20"
                        max="250"
                        step="1"
                        value={form.pulseRate}
                        onChange={(event) =>
                          updateField("pulseRate", event.target.value)
                        }
                        placeholder="e.g. 80"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Systolic BP (mmHg)
                      </label>

                      <input
                        type="number"
                        min="40"
                        max="300"
                        step="1"
                        value={form.systolicBP}
                        onChange={(event) =>
                          updateField("systolicBP", event.target.value)
                        }
                        placeholder="e.g. 120"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Diastolic BP (mmHg)
                      </label>

                      <input
                        type="number"
                        min="20"
                        max="200"
                        step="1"
                        value={form.diastolicBP}
                        onChange={(event) =>
                          updateField("diastolicBP", event.target.value)
                        }
                        placeholder="e.g. 80"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Respiratory rate (/min)
                      </label>

                      <input
                        type="number"
                        min="4"
                        max="80"
                        step="1"
                        value={form.respiratoryRate}
                        onChange={(event) =>
                          updateField("respiratoryRate", event.target.value)
                        }
                        placeholder="e.g. 18"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Oxygen saturation (%)
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={form.oxygenSaturation}
                        onChange={(event) =>
                          updateField("oxygenSaturation", event.target.value)
                        }
                        placeholder="e.g. 98"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Weight (kg)
                      </label>

                      <div className="relative">
                        <Weight
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91a3ba]"
                        />

                        <input
                          type="number"
                          min="0.2"
                          max="500"
                          step="0.1"
                          value={form.weight}
                          onChange={(event) =>
                            updateField("weight", event.target.value)
                          }
                          placeholder="e.g. 65"
                          className={`${inputClass} pl-9`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Height (cm)
                      </label>

                      <input
                        type="number"
                        min="20"
                        max="250"
                        step="0.1"
                        value={form.height}
                        onChange={(event) =>
                          updateField("height", event.target.value)
                        }
                        placeholder="e.g. 170"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>

                {/* CLINICAL INFORMATION */}

                <div className="rounded-xl border border-[#e5edf6] bg-white p-5">
                  <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-[#102f5f]">
                    <Activity
                      size={17}
                      className="text-[#2d91e8]"
                    />
                    Clinical information
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>
                        Known allergies
                      </label>

                      <textarea
                        rows={2}
                        value={form.allergies}
                        onChange={(event) =>
                          updateField("allergies", event.target.value)
                        }
                        placeholder="Enter allergies separated by commas or new lines. Leave blank if none are reported."
                        className={`${inputClass} resize-y`}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Current medications
                      </label>

                      <textarea
                        rows={2}
                        value={form.currentMedications}
                        onChange={(event) =>
                          updateField(
                            "currentMedications",
                            event.target.value,
                          )
                        }
                        placeholder="List current medications, separated by commas or new lines."
                        className={`${inputClass} resize-y`}
                      />
                    </div>
                  </div>
                </div>

                {/* TRIAGE PRIORITY */}

                <div className="rounded-xl border border-[#e5edf6] bg-white p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#102f5f]">
                    <AlertTriangle
                      size={17}
                      className="text-[#2d91e8]"
                    />
                    Triage priority
                  </h3>

                  <p className="mb-4 text-xs leading-5 text-[#91a3ba]">
                    Select the clinical priority based on your
                    assessment and the hospital&apos;s triage protocol.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {(
                      [
                        {
                          value: "EMERGENCY",
                          title: "Emergency",
                          description: "Immediate attention",
                          color:
                            "border-red-200 bg-red-50 text-red-700",
                        },
                        {
                          value: "URGENT",
                          title: "Urgent",
                          description: "Prompt attention",
                          color:
                            "border-orange-200 bg-orange-50 text-orange-700",
                        },
                        {
                          value: "NORMAL",
                          title: "Normal",
                          description: "Routine assessment",
                          color:
                            "border-blue-200 bg-blue-50 text-blue-700",
                        },
                        {
                          value: "LOW",
                          title: "Low",
                          description: "Non-urgent",
                          color:
                            "border-slate-200 bg-slate-50 text-slate-600",
                        },
                      ] as const
                    ).map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() =>
                          updateField("priority", priority.value)
                        }
                        className={`rounded-xl border p-3 text-left transition ${
                          form.priority === priority.value
                            ? `${priority.color} ring-2 ring-[#2d91e8]/20`
                            : "border-[#e5eef7] bg-white text-[#55749c] hover:bg-[#f8fbff]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">
                            {priority.title}
                          </span>

                          {form.priority === priority.value && (
                            <CheckCircle2 size={16} />
                          )}
                        </div>

                        <p className="mt-1 text-[10px] opacity-75">
                          {priority.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* NURSING NOTES */}

                <div className="rounded-xl border border-[#e5edf6] bg-white p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#102f5f]">
                    <FileText
                      size={17}
                      className="text-[#2d91e8]"
                    />
                    Nursing notes
                  </h3>

                  <label className={labelClass}>
                    Additional observations
                  </label>

                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={form.additionalNotes}
                    onChange={(event) =>
                      updateField(
                        "additionalNotes",
                        event.target.value,
                      )
                    }
                    placeholder="Additional observations or relevant nursing information..."
                    className={`${inputClass} resize-y`}
                  />

                  <p className="mt-1 text-right text-[10px] text-[#91a3ba]">
                    {form.additionalNotes.length}/2000
                  </p>
                </div>
              </form>
            </div>

            {/* DRAWER FOOTER */}

            <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#e5edf6] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <button
                type="button"
                onClick={closeAssessment}
                disabled={saving}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#e2ebf6] px-5 text-sm font-semibold text-[#55749c] transition hover:bg-[#f7fbff] disabled:opacity-50"
              >
                <ArrowLeft size={16} />
                Cancel
              </button>

              <button
                type="submit"
                form="triage-form"
                disabled={
                  saving ||
                  loadingDepartments ||
                  departments.length === 0
                }
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#2d91e8] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#187fd8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                    Saving assessment...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    Complete triage
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}




