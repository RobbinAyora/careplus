
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/session";
import { useApiClient } from "@/lib/api/client";

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  HeartPulse,
  Loader2,
  MapPin,
  Phone,
  Pill,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UserRound,
  ClipboardList,
} from "lucide-react";

// ======================================================
// TYPES - MATCHING THE BACKEND RESPONSE
// ======================================================

type VisitStatus =
  | "AWAITING_TRIAGE"
  | "TRIAGED"
  | "WITH_DOCTOR"
  | "COMPLETED"
  | "CANCELLED"
  | "DISCHARGED"
  | string;

type DiagnosisType = "PRIMARY" | "SECONDARY";

interface Patient {
  id: string;
  patientNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  otherNames?: string | null;
  dateOfBirth?: string | null;
  estimatedAgeYears?: number | null;
  sex?: string | null;
  phone?: string | null;
  alternativePhone?: string | null;
  email?: string | null;
  residence?: string | null;
  paymentType?: string | null;
}

interface TriageRecord {
  id: string;
  chiefComplaint?: string | null;
  temperature?: number | null;
  pulseRate?: number | null;
  systolicBP?: number | null;
  diastolicBP?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  weight?: number | null;
  height?: number | null;
  allergies?: string[] | null;
  currentMedications?: string[] | null;
  priority?: string | null;
  additionalNotes?: string | null;
  recordedAt?: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface Diagnosis {
  id: string;
  code?: string | null;
  description: string;
  diagnosisType?: DiagnosisType | null;
  notes?: string | null;
  createdAt?: string;
}

interface PrescriptionItem {
  id: string;
  medicationName: string;
  strength?: string | null;
  dosage: string;
  route?: string | null;
  frequency: string;
  duration?: string | null;
  quantity?: number | null;
  instructions?: string | null;
  refills?: number | null;
}

interface Prescription {
  id: string;
  notes?: string | null;
  status?: string;
  prescribedAt?: string;
  items: PrescriptionItem[];
}

interface Consultation {
  id: string;
  examinationFindings?: string | null;
  diagnosis?: string | null;
  diagnosisNotes?: string | null;
  treatmentPlan?: string | null;
  followUpInstructions?: string | null;
  completedAt?: string | null;
  doctor?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string | null;
  } | null;
  diagnoses?: Diagnosis[];
  prescriptions?: Prescription[];
}

interface Visit {
  id: string;
  visitNumber?: string | null;
  visitType?: string | null;
  status: VisitStatus;
  reasonForVisit?: string | null;
  isEmergency?: boolean;
  createdAt?: string;
  completedAt?: string | null;
  patient: Patient;
  departmentRef?: Department | null;
  triageRecord?: TriageRecord | null;
  consultation?: Consultation | null;
}

interface QueueEntry {
  id: string;
  status: VisitStatus;
  queueNumber?: number | null;
  department?: string | null;
  checkedInAt?: string | null;
  triagedAt?: string | null;
  consultationAt?: string | null;
  visit?: {
    id: string;
    patient?: {
      id: string;
    };
  } | null;
}

interface AssignedPatientsResponse {
  message: string;
  data: QueueEntry[];
  pagination?: {
    nextCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

interface VisitApiResponse {
  message: string;
  data: Visit;
}

interface ConsultationForm {
  examinationFindings: string;
  diagnosis: string;
  diagnosisNotes: string;
  treatmentPlan: string;
  followUpInstructions: string;
}

interface DiagnosisForm {
  code: string;
  description: string;
  diagnosisType: DiagnosisType;
  notes: string;
}

interface PrescriptionFormItem {
  medicationName: string;
  strength: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
  refills: string;
}

const EMPTY_CONSULTATION: ConsultationForm = {
  examinationFindings: "",
  diagnosis: "",
  diagnosisNotes: "",
  treatmentPlan: "",
  followUpInstructions: "",
};

const EMPTY_DIAGNOSIS: DiagnosisForm = {
  code: "",
  description: "",
  diagnosisType: "SECONDARY",
  notes: "",
};

const EMPTY_PRESCRIPTION_ITEM: PrescriptionFormItem = {
  medicationName: "",
  strength: "",
  dosage: "",
  route: "",
  frequency: "",
  duration: "",
  quantity: "",
  instructions: "",
  refills: "0",
};

// ======================================================
// HELPERS
// ======================================================

function getPatientName(patient?: Patient | null): string {
  if (!patient) return "Unknown patient";

  return [
    patient.firstName,
    patient.otherNames,
    patient.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function formatDate(value?: string | null): string {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value?: string | null): string {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not recorded";
  }

  return date.toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatus(status?: string): string {
  if (!status) return "Unknown";

  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getPriorityClass(priority?: string | null): string {
  const value = priority?.toUpperCase();

  if (
    value === "EMERGENCY" ||
    value === "CRITICAL"
  ) {
    return "bg-red-50 text-red-700 ring-red-200";
  }

  if (
    value === "URGENT" ||
    value === "HIGH"
  ) {
    return "bg-orange-50 text-orange-700 ring-orange-200";
  }

  if (value === "LOW") {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function getStatusClass(status?: string): string {
  switch (status) {
    case "TRIAGED":
      return "bg-blue-50 text-blue-700";

    case "WITH_DOCTOR":
      return "bg-emerald-50 text-emerald-700";

    case "COMPLETED":
      return "bg-slate-100 text-slate-700";

    case "CANCELLED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
}

function displayList(
  values?: string[] | null,
): string {
  if (!values || values.length === 0) {
    return "None recorded";
  }

  return values.join(", ");
}

function unwrapVisitResponse(
  response: Visit | VisitApiResponse,
): Visit {
  if ("data" in response && response.data) {
    return response.data;
  }

  return response;
}

// ======================================================
// REUSABLE UI COMPONENTS
// ======================================================

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <Icon size={19} />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>

        {action}
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value !== undefined &&
        value !== null &&
        value !== ""
          ? value
          : "Not recorded"}
      </p>
    </div>
  );
}

function VitalCard({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value?: number | string | null;
  unit?: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={15} />

        <span className="text-xs font-medium">
          {label}
        </span>
      </div>

      <p className="mt-2 text-xl font-semibold text-slate-900">
        {value !== undefined && value !== null
          ? `${value}${unit ?? ""}`
          : "—"}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </label>
  );
}

// ======================================================
// MAIN PAGE
// ======================================================

export default function DoctorPatientConsultationPage() {
  const params = useParams<{ patientId: string }>();
  const router = useRouter();

  const patientId = params.patientId;

  const { accessToken, isSessionLoaded } = useAuth();

  const [visit, setVisit] = useState<Visit | null>(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [consultationForm, setConsultationForm] =
    useState<ConsultationForm>(EMPTY_CONSULTATION);

  const [diagnosisForm, setDiagnosisForm] =
    useState<DiagnosisForm>(EMPTY_DIAGNOSIS);

  const [prescriptionNotes, setPrescriptionNotes] =
    useState("");

  const [prescriptionItems, setPrescriptionItems] =
    useState<PrescriptionFormItem[]>([
      { ...EMPTY_PRESCRIPTION_ITEM },
    ]);

  // ------------------------------------------------------
  // API REQUEST HELPER
  // ------------------------------------------------------

  const apiRequest = useApiClient();

  // ------------------------------------------------------
  // LOAD FULL VISIT DETAILS
  // ------------------------------------------------------

  const loadVisit = useCallback(
    async (visitId: string) => {
      const response = await apiRequest<
        Visit | VisitApiResponse
      >(`/doctors/me/visits/${visitId}`);

      const data = unwrapVisitResponse(response);

      setVisit(data);

      setConsultationForm({
        examinationFindings:
          data.consultation?.examinationFindings ?? "",
        diagnosis:
          data.consultation?.diagnosis ?? "",
        diagnosisNotes:
          data.consultation?.diagnosisNotes ?? "",
        treatmentPlan:
          data.consultation?.treatmentPlan ?? "",
        followUpInstructions:
          data.consultation?.followUpInstructions ?? "",
      });

      return data;
    },
    [apiRequest],
  );

  // ------------------------------------------------------
  // LOAD ASSIGNED PATIENT AND THEIR VISIT
  // ------------------------------------------------------

  const loadPatient = useCallback(async () => {
    if (!patientId) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let cursor: string | null = null;
      let assignedEntry: QueueEntry | undefined;

      // Follow the backend's cursor-based pagination.
      do {
        const query = new URLSearchParams({
          limit: "100",
        });

        if (cursor) {
          query.set("cursor", cursor);
        }

        const response =
          await apiRequest<AssignedPatientsResponse>(
            `/doctors/me/assigned-patients?${query.toString()}`,
          );

        assignedEntry = response.data?.find(
          (entry) =>
            entry.visit?.patient?.id === patientId,
        );

        if (assignedEntry) {
          break;
        }

        cursor = response.pagination?.nextCursor ?? null;

        if (!response.pagination?.hasMore) {
          break;
        }
      } while (cursor);

      if (!assignedEntry?.visit?.id) {
        throw new Error(
          "This patient does not have an active visit assigned to you. They may have been reassigned, completed, or may not yet have been assigned.",
        );
      }

      // The consultation endpoints require the VISIT ID,
      // not the patient ID or queue entry ID.
      await loadVisit(assignedEntry.visit.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load patient details.",
      );
    } finally {
      setLoading(false);
    }
  }, [apiRequest, loadVisit, patientId]);

  useEffect(() => {
    if (!isSessionLoaded || !accessToken) return;

    void loadPatient();
  }, [isSessionLoaded, accessToken, loadPatient]);

  // ------------------------------------------------------
  // DERIVED STATE
  // ------------------------------------------------------

  const patient = visit?.patient ?? null;
  const triage = visit?.triageRecord ?? null;
  const consultation = visit?.consultation ?? null;

  const isTriaged = visit?.status === "TRIAGED";

  const isWithDoctor =
    visit?.status === "WITH_DOCTOR";

  const isCompleted =
    visit?.status === "COMPLETED" ||
    Boolean(consultation?.completedAt);

  const canStart =
    isTriaged || isWithDoctor;

  const canEdit =
    isWithDoctor && !isCompleted;

  const patientInitials = useMemo(() => {
    if (!patient) return "PT";

    return `${patient.firstName?.[0] ?? ""}${
      patient.lastName?.[0] ?? ""
    }`.toUpperCase() || "PT";
  }, [patient]);

  // ------------------------------------------------------
  // UPDATE CONSULTATION FORM
  // ------------------------------------------------------

  const updateConsultationField = (
    field: keyof ConsultationForm,
    value: string,
  ) => {
    setConsultationForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  // ------------------------------------------------------
  // START CONSULTATION
  // POST /doctors/me/visits/:visitId/start
  // ------------------------------------------------------

  const handleStartConsultation = async () => {
    if (!visit || !isTriaged) return;

    setStarting(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/doctors/me/visits/${visit.id}/start`,
        {
          method: "POST",
        },
      );

      await loadVisit(visit.id);

      setSuccess("Consultation started successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start consultation.",
      );
    } finally {
      setStarting(false);
    }
  };

  // ------------------------------------------------------
  // SAVE CONSULTATION
  // POST if no consultation exists, PATCH if it does
  // ------------------------------------------------------

  const handleSaveConsultation = async () => {
    if (!visit || !canEdit) return;

    setSavingConsultation(true);
    setError("");
    setSuccess("");

    try {
      const method = consultation ? "PATCH" : "POST";

      await apiRequest(
        `/doctors/me/visits/${visit.id}/consultation`,
        {
          method,
          body: consultationForm,
        },
      );

      await loadVisit(visit.id);

      setSuccess("Consultation findings saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save consultation findings.",
      );
    } finally {
      setSavingConsultation(false);
    }
  };

  // ------------------------------------------------------
  // ADD DIAGNOSIS
  // POST /doctors/me/visits/:visitId/diagnoses
  // ------------------------------------------------------

  const handleAddDiagnosis = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!visit || !canEdit) return;

    if (!diagnosisForm.description.trim()) {
      setError("Enter a diagnosis description.");
      return;
    }

    setSavingDiagnosis(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/doctors/me/visits/${visit.id}/diagnoses`,
        {
          method: "POST",
          body: {
            ...(diagnosisForm.code.trim()
              ? { code: diagnosisForm.code.trim() }
              : {}),
            description: diagnosisForm.description.trim(),
            diagnosisType: diagnosisForm.diagnosisType,
            ...(diagnosisForm.notes.trim()
              ? { notes: diagnosisForm.notes.trim() }
              : {}),
          },
        },
      );

      setDiagnosisForm({ ...EMPTY_DIAGNOSIS });

      await loadVisit(visit.id);

      setSuccess("Diagnosis added successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add diagnosis.",
      );
    } finally {
      setSavingDiagnosis(false);
    }
  };

  // ------------------------------------------------------
  // PRESCRIPTION ITEM HANDLERS
  // ------------------------------------------------------

  const updatePrescriptionItem = (
    index: number,
    field: keyof PrescriptionFormItem,
    value: string,
  ) => {
    setPrescriptionItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item,
      ),
    );
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems((current) => [
      ...current,
      { ...EMPTY_PRESCRIPTION_ITEM },
    ]);
  };

  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems((current) =>
      current.length > 1
        ? current.filter(
            (_, itemIndex) => itemIndex !== index,
          )
        : current,
    );
  };

  // ------------------------------------------------------
  // ISSUE PRESCRIPTION
  // POST /doctors/me/visits/:visitId/prescriptions
  // ------------------------------------------------------

  const handleIssuePrescription = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!visit || !canEdit) return;

    const validItems = prescriptionItems.filter(
      (item) =>
        item.medicationName.trim() &&
        item.dosage.trim() &&
        item.frequency.trim(),
    );

    if (validItems.length === 0) {
      setError(
        "Add at least one medication with a name, dosage and frequency.",
      );
      return;
    }

    setSavingPrescription(true);
    setError("");
    setSuccess("");

    try {
      const items = validItems.map((item) => ({
        medicationName: item.medicationName.trim(),
        dosage: item.dosage.trim(),
        frequency: item.frequency.trim(),

        ...(item.strength.trim()
          ? { strength: item.strength.trim() }
          : {}),

        ...(item.route.trim()
          ? { route: item.route.trim() }
          : {}),

        ...(item.duration.trim()
          ? { duration: item.duration.trim() }
          : {}),

        ...(item.quantity.trim()
          ? { quantity: Number(item.quantity) }
          : {}),

        ...(item.instructions.trim()
          ? { instructions: item.instructions.trim() }
          : {}),

        refills: item.refills.trim()
          ? Number(item.refills)
          : 0,
      }));

      await apiRequest(
        `/doctors/me/visits/${visit.id}/prescriptions`,
        {
          method: "POST",
          body: {
            ...(prescriptionNotes.trim()
              ? { notes: prescriptionNotes.trim() }
              : {}),
            items,
          },
        },
      );

      setPrescriptionNotes("");
      setPrescriptionItems([
        { ...EMPTY_PRESCRIPTION_ITEM },
      ]);

      await loadVisit(visit.id);

      setSuccess("Prescription issued successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to issue prescription.",
      );
    } finally {
      setSavingPrescription(false);
    }
  };

  // ------------------------------------------------------
  // COMPLETE CONSULTATION
  // PATCH /doctors/me/visits/:visitId/complete
  // ------------------------------------------------------

  const handleCompleteConsultation = async () => {
    if (!visit || !canEdit || !consultation) return;

    const confirmed = window.confirm(
      "Are you sure you want to complete this consultation? The consultation will no longer be editable.",
    );

    if (!confirmed) return;

    setCompleting(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/doctors/me/visits/${visit.id}/complete`,
        {
          method: "PATCH",
        },
      );

      await loadVisit(visit.id);

      setSuccess("Consultation completed successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete consultation.",
      );
    } finally {
      setCompleting(false);
    }
  };

  // ======================================================
  // LOADING AND ERROR STATES
  // ======================================================

  if (!isSessionLoaded || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-blue-600"
            size={34}
          />

          <p className="mt-4 text-sm text-slate-500">
            Loading patient consultation...
          </p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <p className="font-medium text-amber-900">
          Your session has expired.
        </p>

        <p className="mt-1 text-sm text-amber-800">
          Please log in again to access patient consultations.
        </p>
      </div>
    );
  }

  if (!visit || !patient) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertCircle size={27} />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-slate-900">
          Unable to load patient
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {error || "The patient's active assigned visit could not be found."}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Go back
          </button>

          <button
            type="button"
            onClick={() => void loadPatient()}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ======================================================
  // MAIN PAGE
  // ======================================================

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to patients
          </button>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Patient consultation
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Review patient information, triage results and consultation records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusClass(
              visit.status,
            )}`}
          >
            {formatStatus(visit.status)}
          </span>

          {visit.isEmergency && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
              <AlertCircle size={14} />
              Emergency
            </span>
          )}

          <button
            type="button"
            onClick={() => void loadVisit(visit.id)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />

          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />

          <p>{success}</p>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-auto text-emerald-600 hover:text-emerald-800"
          >
            ×
          </button>
        </div>
      )}

      {/* PATIENT OVERVIEW */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-xl font-bold text-blue-700">
              {patientInitials}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">
                {getPatientName(patient)}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Patient ID:{" "}
                <span className="font-semibold text-slate-700">
                  {patient.patientNumber || "Not recorded"}
                </span>
              </p>

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span>
                  {patient.sex || "Sex not recorded"}
                </span>

                <span>
                  {patient.estimatedAgeYears != null
                    ? `${patient.estimatedAgeYears} years`
                    : patient.dateOfBirth
                      ? formatDate(patient.dateOfBirth)
                      : "Age not recorded"}
                </span>

                <span>
                  {patient.paymentType || "Payment type not recorded"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[360px]">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <Phone size={17} className="text-slate-400" />

              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  Phone number
                </p>

                <p className="truncate text-sm font-medium text-slate-800">
                  {patient.phone || "Not recorded"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              <MapPin size={17} className="text-slate-400" />

              <div className="min-w-0">
                <p className="text-xs text-slate-400">
                  Residence
                </p>

                <p className="truncate text-sm font-medium text-slate-800">
                  {patient.residence || "Not recorded"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <DetailItem
            label="Visit number"
            value={visit.visitNumber}
          />

          <DetailItem
            label="Visit type"
            value={visit.visitType}
          />

          <DetailItem
            label="Department"
            value={visit.departmentRef?.name}
          />

          <DetailItem
            label="Visit date"
            value={formatDateTime(visit.createdAt)}
          />
        </div>

        {visit.reasonForVisit && (
          <div className="mt-5 rounded-xl bg-blue-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Reason for visit
            </p>

            <p className="mt-1 text-sm leading-6 text-slate-700">
              {visit.reasonForVisit}
            </p>
          </div>
        )}
      </section>

      {/* TRIAGE RESULTS */}

      <SectionCard
        title="Triage assessment"
        description="Clinical observations and measurements recorded by the triage team"
        icon={HeartPulse}
        action={
          triage?.priority ? (
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${getPriorityClass(
                triage.priority,
              )}`}
            >
              {formatStatus(triage.priority)} priority
            </span>
          ) : null
        }
      >
        {!triage ? (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-5 text-center">
            <ShieldAlert
              className="mx-auto text-amber-600"
              size={26}
            />

            <p className="mt-2 text-sm font-semibold text-amber-900">
              No triage record found
            </p>

            <p className="mt-1 text-xs text-amber-800">
              This visit does not currently have a triage record available.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* TRIAGE COMPLAINT */}

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <ClipboardList size={17} />

                <h3 className="text-sm font-semibold">
                  Chief complaint
                </h3>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {triage.chiefComplaint || "No chief complaint recorded."}
              </p>
            </div>

            {/* VITAL SIGNS */}

            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Vital signs
              </h3>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                <VitalCard
                  label="Temperature"
                  value={triage.temperature}
                  unit=" °C"
                  icon={Activity}
                />

                <VitalCard
                  label="Blood pressure"
                  value={
                    triage.systolicBP != null &&
                    triage.diastolicBP != null
                      ? `${triage.systolicBP}/${triage.diastolicBP}`
                      : null
                  }
                  unit=" mmHg"
                  icon={HeartPulse}
                />

                <VitalCard
                  label="Pulse rate"
                  value={triage.pulseRate}
                  unit=" bpm"
                  icon={Activity}
                />

                <VitalCard
                  label="Respiratory rate"
                  value={triage.respiratoryRate}
                  unit=" /min"
                  icon={Activity}
                />

                <VitalCard
                  label="Oxygen saturation"
                  value={triage.oxygenSaturation}
                  unit=" %"
                  icon={HeartPulse}
                />

                <VitalCard
                  label="Weight"
                  value={triage.weight}
                  unit=" kg"
                  icon={Activity}
                />

                <VitalCard
                  label="Height"
                  value={triage.height}
                  unit=" cm"
                  icon={Activity}
                />
              </div>
            </div>

            {/* ALLERGIES AND MEDICATIONS */}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Known allergies
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {displayList(triage.allergies)}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Current medications
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {displayList(triage.currentMedications)}
                </p>
              </div>
            </div>

            {/* ADDITIONAL NOTES */}

            {triage.additionalNotes && (
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="text-sm font-semibold text-slate-800">
                  Additional triage notes
                </h3>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {triage.additionalNotes}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400">
              <span>
                Triage recorded: {formatDateTime(triage.recordedAt)}
              </span>

              <span>
                Triage record: {triage.id}
              </span>
            </div>
          </div>
        )}
      </SectionCard>

      {/* CONSULTATION STATUS AND ACTION */}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Stethoscope
                size={20}
                className="text-blue-700"
              />

              <h2 className="font-semibold text-slate-900">
                Doctor consultation
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {isTriaged
                ? "This patient has been triaged and is ready for consultation."
                : isWithDoctor
                  ? "You are currently consulting this patient."
                  : isCompleted
                    ? "This consultation has been completed."
                    : "The patient is not currently ready for consultation."}
            </p>
          </div>

          {isTriaged && (
            <button
              type="button"
              onClick={() => void handleStartConsultation()}
              disabled={starting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {starting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Stethoscope size={17} />
              )}

              {starting
                ? "Starting..."
                : "Start consultation"}
            </button>
          )}

          {isWithDoctor && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={17} />
              Consultation in progress
            </span>
          )}

          {isCompleted && (
            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600">
              <CheckCircle2 size={17} />
              Completed
            </span>
          )}
        </div>

        {isTriaged && (
          <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-sm text-blue-800">
            <p>
              Review the triage results above, then select{" "}
              <strong>Start consultation</strong> to begin recording your clinical findings.
            </p>
          </div>
        )}
      </section>

      {/* CONSULTATION FORM */}

      {(isWithDoctor || isCompleted) && (
        <>
          <SectionCard
            title="Clinical consultation notes"
            description="Record your examination, assessment and treatment plan"
            icon={FileText}
            action={
              isCompleted ? (
                <span className="text-xs font-medium text-slate-500">
                  Read only
                </span>
              ) : null
            }
          >
            <div className="space-y-5">
              <Field
                label="Examination findings"
                value={consultationForm.examinationFindings}
                onChange={(value) =>
                  updateConsultationField(
                    "examinationFindings",
                    value,
                  )
                }
                placeholder="Record the patient's clinical examination findings..."
                disabled={!canEdit}
                rows={4}
              />

              <Field
                label="Clinical diagnosis"
                value={consultationForm.diagnosis}
                onChange={(value) =>
                  updateConsultationField("diagnosis", value)
                }
                placeholder="Enter the clinical diagnosis..."
                disabled={!canEdit}
              />

              <Field
                label="Diagnosis notes"
                value={consultationForm.diagnosisNotes}
                onChange={(value) =>
                  updateConsultationField(
                    "diagnosisNotes",
                    value,
                  )
                }
                placeholder="Additional clinical notes about the diagnosis..."
                disabled={!canEdit}
              />

              <Field
                label="Treatment plan"
                value={consultationForm.treatmentPlan}
                onChange={(value) =>
                  updateConsultationField(
                    "treatmentPlan",
                    value,
                  )
                }
                placeholder="Describe the recommended treatment and management..."
                disabled={!canEdit}
                rows={4}
              />

              <Field
                label="Follow-up instructions"
                value={consultationForm.followUpInstructions}
                onChange={(value) =>
                  updateConsultationField(
                    "followUpInstructions",
                    value,
                  )
                }
                placeholder="Record follow-up dates, review instructions and advice..."
                disabled={!canEdit}
                rows={3}
              />

              {canEdit && (
                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => void handleSaveConsultation()}
                    disabled={savingConsultation}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {savingConsultation ? (
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                    ) : (
                      <Save size={16} />
                    )}

                    {savingConsultation
                      ? "Saving..."
                      : "Save consultation"}
                  </button>
                </div>
              )}

              {consultation?.completedAt && (
                <p className="text-xs text-slate-500">
                  Completed on {formatDateTime(consultation.completedAt)}
                </p>
              )}
            </div>
          </SectionCard>

          {/* DIAGNOSES */}

          <SectionCard
            title="Diagnoses"
            description="Clinical diagnoses recorded for this visit"
            icon={ClipboardList}
          >
            <div className="space-y-4">
              {consultation?.diagnoses &&
              consultation.diagnoses.length > 0 ? (
                <div className="space-y-3">
                  {consultation.diagnoses.map((diagnosis) => (
                    <div
                      key={diagnosis.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {diagnosis.description}
                        </h3>

                        {diagnosis.diagnosisType && (
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              diagnosis.diagnosisType === "PRIMARY"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {formatStatus(diagnosis.diagnosisType)}
                          </span>
                        )}
                      </div>

                      {diagnosis.code && (
                        <p className="mt-1 text-xs text-slate-500">
                          Code: {diagnosis.code}
                        </p>
                      )}

                      {diagnosis.notes && (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {diagnosis.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No additional diagnoses have been recorded.
                </p>
              )}

              {canEdit && (
                <form
                  onSubmit={handleAddDiagnosis}
                  className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <h3 className="text-sm font-semibold text-slate-800">
                    Add a diagnosis
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      label="Diagnosis code (optional)"
                      value={diagnosisForm.code}
                      onChange={(value) =>
                        setDiagnosisForm((current) => ({
                          ...current,
                          code: value,
                        }))
                      }
                      placeholder="e.g. J06.9"
                    />

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">
                        Diagnosis type
                      </span>

                      <select
                        value={diagnosisForm.diagnosisType}
                        onChange={(event) =>
                          setDiagnosisForm((current) => ({
                            ...current,
                            diagnosisType: event.target.value as DiagnosisType,
                          }))
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      >
                        <option value="PRIMARY">
                          Primary
                        </option>

                        <option value="SECONDARY">
                          Secondary
                        </option>
                      </select>
                    </label>
                  </div>

                  <InputField
                    label="Diagnosis description"
                    value={diagnosisForm.description}
                    onChange={(value) =>
                      setDiagnosisForm((current) => ({
                        ...current,
                        description: value,
                      }))
                    }
                    placeholder="Enter the diagnosis"
                  />

                  <Field
                    label="Notes (optional)"
                    value={diagnosisForm.notes}
                    onChange={(value) =>
                      setDiagnosisForm((current) => ({
                        ...current,
                        notes: value,
                      }))
                    }
                    placeholder="Additional diagnosis notes..."
                    rows={2}
                  />

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingDiagnosis}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingDiagnosis ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Plus size={16} />
                      )}

                      Add diagnosis
                    </button>
                  </div>
                </form>
              )}
            </div>
          </SectionCard>

          {/* PRESCRIPTIONS */}

          <SectionCard
            title="Prescriptions"
            description="Medication orders issued during this consultation"
            icon={Pill}
          >
            <div className="space-y-4">
              {consultation?.prescriptions &&
              consultation.prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {consultation.prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="overflow-hidden rounded-xl border border-slate-200"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Prescription
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatDateTime(prescription.prescribedAt)}
                          </p>
                        </div>

                        {prescription.status && (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {formatStatus(prescription.status)}
                          </span>
                        )}
                      </div>

                      <div className="divide-y divide-slate-100">
                        {prescription.items?.map((item) => (
                          <div
                            key={item.id}
                            className="p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {item.medicationName}
                                </p>

                                {item.strength && (
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {item.strength}
                                  </p>
                                )}
                              </div>

                              {item.quantity != null && (
                                <span className="text-xs text-slate-500">
                                  Quantity: {item.quantity}
                                </span>
                              )}
                            </div>

                            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                              <DetailItem
                                label="Dosage"
                                value={item.dosage}
                              />

                              <DetailItem
                                label="Route"
                                value={item.route}
                              />

                              <DetailItem
                                label="Frequency"
                                value={item.frequency}
                              />

                              <DetailItem
                                label="Duration"
                                value={item.duration}
                              />
                            </div>

                            {item.instructions && (
                              <p className="mt-3 text-sm text-slate-600">
                                Instructions: {item.instructions}
                              </p>
                            )}

                            <p className="mt-2 text-xs text-slate-500">
                              Refills: {item.refills ?? 0}
                            </p>
                          </div>
                        ))}
                      </div>

                      {prescription.notes && (
                        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold text-slate-600">
                            Prescription notes
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                            {prescription.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No prescriptions have been issued for this consultation.
                </p>
              )}

              {canEdit && (
                <form
                  onSubmit={handleIssuePrescription}
                  className="space-y-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">
                      Issue a prescription
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Add one or more medication items.
                    </p>
                  </div>

                  {prescriptionItems.map((item, index) => (
                    <div
                      key={index}
                      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-800">
                          Medication {index + 1}
                        </h4>

                        {prescriptionItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removePrescriptionItem(index)
                            }
                            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <InputField
                          label="Medication name *"
                          value={item.medicationName}
                          onChange={(value) =>
                            updatePrescriptionItem(
                              index,
                              "medicationName",
                              value,
                            )
                          }
                          placeholder="Medication name"
                        />

                        <InputField
                          label="Strength"
                          value={item.strength}
                          onChange={(value) =>
                            updatePrescriptionItem(
                              index,
                              "strength",
                              value,
                            )
                          }
                          placeholder="e.g. 500mg"
                        />

                        <InputField
                          label="Dosage *"
                          value={item.dosage}
                          onChange={(value) =>
                            updatePrescriptionItem(
                              index,
                              "dosage",
                              value,
                            )
                          }
                          placeholder="e.g. 1 tablet"
                        />

                        <InputField
                          label="Route"
                          value={item.route}
                          onChange={(value) =>
                            updatePrescriptionItem(
                              index,
                              "route",
                              value,
                            )
                          }
                          placeholder="e.g. Oral"
                        />

                        <InputField
                          label="Frequency *"
                          value={item.frequency}
                          onChange={(value) =>
                            updatePrescriptionItem(
                              index,
                              "frequency",
                              value,
                            )
                          }
                          placeholder="e.g. Twice daily"
                        />

                        <InputField
                          label="Duration"
                          value={item.duration}
                          onChange={(value) =>
                            updatePrescriptionItem(
                              index,
                              "duration",
                              value,
                            )
                          }
                          placeholder="e.g. 5 days"
                        />

                        <InputField
                          label="Quantity"
                          type="number"
                          value={item.quantity}
                          onChange={(value) =>
                            updatePrescriptionItem(
                              index,
                              "quantity",
                              value,
                            )
                          }
                          placeholder="e.g. 10"
                        />

                        <InputField
                          label="Refills"
                          type="number"
                          value={item.refills}
                          onChange={(value) =>
                            updatePrescriptionItem(
                              index,
                              "refills",
                              value,
                            )
                          }
                          placeholder="0"
                        />
                      </div>

                      <Field
                        label="Medication instructions"
                        value={item.instructions}
                        onChange={(value) =>
                          updatePrescriptionItem(
                            index,
                            "instructions",
                            value,
                          )
                        }
                        placeholder="Instructions for the patient..."
                        rows={2}
                      />
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addPrescriptionItem}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                  >
                    <Plus size={16} />
                    Add another medication
                  </button>

                  <Field
                    label="Prescription notes"
                    value={prescriptionNotes}
                    onChange={setPrescriptionNotes}
                    placeholder="Additional prescription instructions..."
                    rows={2}
                  />

                  <div className="flex justify-end border-t border-slate-200 pt-4">
                    <button
                      type="submit"
                      disabled={savingPrescription}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {savingPrescription ? (
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                      ) : (
                        <Pill size={16} />
                      )}

                      {savingPrescription
                        ? "Issuing..."
                        : "Issue prescription"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </SectionCard>

          {/* COMPLETE CONSULTATION */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            {isCompleted ? (
              <div className="flex items-center gap-3 text-emerald-700">
                <CheckCircle2 size={22} />

                <div>
                  <h3 className="font-semibold">
                    Consultation completed
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    This visit was completed on{" "}
                    {formatDateTime(
                      consultation?.completedAt ??
                        visit.completedAt,
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Complete consultation
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Save your clinical findings before completing this visit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void handleCompleteConsultation()
                  }
                  disabled={!consultation || completing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {completing ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}

                  {completing
                    ? "Completing..."
                    : "Complete consultation"}
                </button>
              </div>
            )}

            {!consultation && !isCompleted && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                Start the consultation before you can complete this visit.
              </p>
            )}
          </section>
        </>
      )}

      {/* FOOTER INFORMATION */}

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={13} />
          Visit: {visit.visitNumber || visit.id}
        </span>

        <span className="flex items-center gap-1.5">
          <Clock3 size={13} />
          Last loaded: {new Date().toLocaleTimeString("en-KE")}
        </span>
      </div>
    </div>
  );
}



 






