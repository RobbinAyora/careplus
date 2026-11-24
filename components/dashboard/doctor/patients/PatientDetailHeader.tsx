
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Activity,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  FileText,
  Pill,
  Plus,
  Save,
  Stethoscope,
  Trash2,
  User,
  CalendarDays,
  Clock,
  Loader2,
  Play,
  Check,
  RefreshCw,
} from "lucide-react";



const API_URL = process.env.NEXT_PUBLIC_API_URL;

type VisitStatus =
  | "REGISTERED"
  | "AWAITING_TRIAGE"
  | "TRIAGED"
  | "WITH_DOCTOR"
  | "COMPLETED"
  | "CANCELLED"
  | "REFERRED";

type DiagnosisType = "PRIMARY" | "SECONDARY";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  allergies?: string[];
  chronicConditions?: string[];
}

interface Diagnosis {
  id: string;
  code?: string | null;
  description: string;
  diagnosisType: DiagnosisType;
  notes?: string | null;
}

interface PrescriptionItem {
  id?: string;
  medicationName: string;
  strength?: string;
  dosage: string;
  route?: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
  refills?: number;
}

interface Prescription {
  id: string;
  status: string;
  notes?: string;
  prescribedAt: string;
  items: PrescriptionItem[];
}

interface Consultation {
  id: string;
  examinationFindings?: string | null;
  diagnosis?: string | null;
  diagnosisNotes?: string | null;
  treatmentPlan?: string | null;
  followUpInstructions?: string | null;
  startedAt?: string;
  completedAt?: string | null;
  diagnoses?: Diagnosis[];
  prescriptions?: Prescription[];
}

interface Visit {
  id: string;
  status: VisitStatus;
  visitType?: string;
  reasonForVisit?: string;
  isEmergency?: boolean;
  createdAt?: string;
  consultation?: Consultation | null;
  patient?: Patient;
  departmentRef?: {
    name?: string;
  };
  triageRecord?: {
    temperature?: number;
    bloodPressure?: string;
    pulse?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
    notes?: string;
    priority?: string;
  } | null;
}

interface ApiError {
  message?: string | string[];
}

interface DiagnosisForm {
  description: string;
  code: string;
  diagnosisType: DiagnosisType;
  notes: string;
}

interface PrescriptionForm {
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

const EMPTY_DIAGNOSIS: DiagnosisForm = {
  description: "",
  code: "",
  diagnosisType: "SECONDARY",
  notes: "",
};

const EMPTY_PRESCRIPTION: PrescriptionForm = {
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

function formatDate(value?: string) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function calculateAge(dateOfBirth?: string) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);

  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const monthDifference = today.getMonth() - dob.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    TRIAGED: "bg-amber-50 text-amber-700",
    WITH_DOCTOR: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-emerald-50 text-emerald-700",
    REGISTERED: "bg-slate-100 text-slate-600",
    AWAITING_TRIAGE: "bg-orange-50 text-orange-700",
    CANCELLED: "bg-red-50 text-red-700",
    REFERRED: "bg-purple-50 text-purple-700",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function PatientConsultationPage() {
  const params = useParams<{ patientId: string }>();
  const patientId = params.patientId;

  const { accessToken, isSessionLoaded } = useAuth();

  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisitId, setSelectedVisitId] = useState("");

  const [visit, setVisit] = useState<Visit | null>(null);

  const [loading, setLoading] = useState(true);
  const [visitLoading, setVisitLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [examinationFindings, setExaminationFindings] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");

  const [diagnosisForm, setDiagnosisForm] =
    useState<DiagnosisForm>(EMPTY_DIAGNOSIS);

  const [prescriptionForm, setPrescriptionForm] =
    useState<PrescriptionForm>(EMPTY_PRESCRIPTION);

  const [showDiagnosisForm, setShowDiagnosisForm] = useState(false);
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);

  const [addingDiagnosis, setAddingDiagnosis] = useState(false);
  const [addingPrescription, setAddingPrescription] = useState(false);

  const patient = visit?.patient;

  const consultation = visit?.consultation;

  const isActiveConsultation = visit?.status === "WITH_DOCTOR";

  const isCompleted = visit?.status === "COMPLETED";

  const canStart =
    visit?.status === "TRIAGED" ||
    visit?.status === "WITH_DOCTOR";

  const canEdit = isActiveConsultation && !isCompleted;

  const apiRequest = useCallback(
    async <T,>(
      endpoint: string,
      options: RequestInit = {},
    ): Promise<T> => {
      if (!API_URL) {
        throw new Error(
          "API URL is missing. Configure NEXT_PUBLIC_API_URL.",
        );
      }

      if (!accessToken) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      });

      if (response.status === 204) {
        return undefined as T;
      }

      const responseText = await response.text();

      let responseData: unknown = null;

      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = responseText;
        }
      }

      if (!response.ok) {
        const apiError = responseData as ApiError;

        const message = Array.isArray(apiError?.message)
          ? apiError.message.join(", ")
          : apiError?.message;

        throw new Error(
          message ||
            (typeof responseData === "string"
              ? responseData
              : `Request failed with status ${response.status}`),
        );
      }

      return responseData as T;
    },
    [accessToken],
  );

  const fetchVisit = useCallback(
    async (visitId: string) => {
      const data = await apiRequest<Visit>(
        `/doctors/me/visits/${visitId}`,
      );

      setVisit(data);

      setExaminationFindings(
        data.consultation?.examinationFindings ?? "",
      );

      setDiagnosis(data.consultation?.diagnosis ?? "");

      setDiagnosisNotes(
        data.consultation?.diagnosisNotes ?? "",
      );

      setTreatmentPlan(
        data.consultation?.treatmentPlan ?? "",
      );

      setFollowUpInstructions(
        data.consultation?.followUpInstructions ?? "",
      );
    },
    [apiRequest],
  );

  const loadPatientVisits = useCallback(async () => {
    if (!accessToken || !patientId) return;

    setLoading(true);
    setError("");

    try {
      /*
       * This endpoint is expected to return assigned queue entries
       * with their nested visit and patient information.
       *
       * IMPORTANT:
       * If your assigned-patients endpoint uses a different response
       * shape, adapt this mapping to the actual NestJS response.
       */
      const response = await apiRequest<{
        data?: Array<{
          visit?: Visit;
        }>;
        items?: Array<{
          visit?: Visit;
        }>;
      }>(
        `/doctors/me/assigned-patients`,
      );

      const records = response.data ?? response.items ?? [];

      const patientVisits = records
        .map((record) => record.visit)
        .filter(
          (item): item is Visit =>
            Boolean(item?.id) &&
            item.patient?.id === patientId,
        );

      setVisits(patientVisits);

      if (patientVisits.length > 0) {
        const firstVisit = patientVisits[0];

        setSelectedVisitId(firstVisit.id);
      } else {
        setVisit(null);
        setError(
          "No assigned visits were found for this patient. The patient may not currently be assigned to you.",
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiRequest, patientId]);

  useEffect(() => {
    if (!isSessionLoaded) return;

    if (!accessToken) {
      setError("Please log in to access patient consultations.");
      setLoading(false);
      return;
    }

    void loadPatientVisits();
  }, [isSessionLoaded, accessToken, loadPatientVisits]);

  useEffect(() => {
    if (!selectedVisitId || !accessToken) return;

    let cancelled = false;

    const loadSelectedVisit = async () => {
      setVisitLoading(true);
      setError("");

      try {
        const data = await apiRequest<Visit>(
          `/doctors/me/visits/${selectedVisitId}`,
        );

        if (!cancelled) {
          setVisit(data);

          setExaminationFindings(
            data.consultation?.examinationFindings ?? "",
          );

          setDiagnosis(data.consultation?.diagnosis ?? "");

          setDiagnosisNotes(
            data.consultation?.diagnosisNotes ?? "",
          );

          setTreatmentPlan(
            data.consultation?.treatmentPlan ?? "",
          );

          setFollowUpInstructions(
            data.consultation?.followUpInstructions ?? "",
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
          setVisit(null);
        }
      } finally {
        if (!cancelled) {
          setVisitLoading(false);
        }
      }
    };

    void loadSelectedVisit();

    return () => {
      cancelled = true;
    };
  }, [selectedVisitId, accessToken, apiRequest]);

  const refreshVisit = useCallback(async () => {
    if (!selectedVisitId) return;

    setError("");
    setSuccess("");

    try {
      await fetchVisit(selectedVisitId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [fetchVisit, selectedVisitId]);

  const startConsultation = async () => {
    if (!selectedVisitId) return;

    setStarting(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/doctors/me/visits/${selectedVisitId}/start`,
        {
          method: "POST",
        },
      );

      await fetchVisit(selectedVisitId);

      setSuccess("Consultation started successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setStarting(false);
    }
  };

  const saveConsultation = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedVisitId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        examinationFindings,
        diagnosis,
        diagnosisNotes,
        treatmentPlan,
        followUpInstructions,
      };

      await apiRequest(
        `/doctors/me/visits/${selectedVisitId}/consultation`,
        {
          method: consultation ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );

      await fetchVisit(selectedVisitId);

      setSuccess("Consultation details saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const addDiagnosis = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedVisitId) return;

    if (!diagnosisForm.description.trim()) {
      setError("Please enter a diagnosis description.");
      return;
    }

    setAddingDiagnosis(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/doctors/me/visits/${selectedVisitId}/diagnoses`,
        {
          method: "POST",
          body: JSON.stringify({
            description: diagnosisForm.description,
            code: diagnosisForm.code || undefined,
            diagnosisType: diagnosisForm.diagnosisType,
            notes: diagnosisForm.notes || undefined,
          }),
        },
      );

      await fetchVisit(selectedVisitId);

      setDiagnosisForm(EMPTY_DIAGNOSIS);
      setShowDiagnosisForm(false);

      setSuccess("Diagnosis added successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingDiagnosis(false);
    }
  };

  const addPrescription = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!selectedVisitId) return;

    if (
      !prescriptionForm.medicationName.trim() ||
      !prescriptionForm.dosage.trim() ||
      !prescriptionForm.frequency.trim()
    ) {
      setError(
        "Medication name, dosage and frequency are required.",
      );
      return;
    }

    setAddingPrescription(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/doctors/me/visits/${selectedVisitId}/prescriptions`,
        {
          method: "POST",
          body: JSON.stringify({
            items: [
              {
                medicationName: prescriptionForm.medicationName,
                strength: prescriptionForm.strength || undefined,
                dosage: prescriptionForm.dosage,
                route: prescriptionForm.route || undefined,
                frequency: prescriptionForm.frequency,
                duration: prescriptionForm.duration || undefined,
                quantity: prescriptionForm.quantity
                  ? Number(prescriptionForm.quantity)
                  : undefined,
                instructions:
                  prescriptionForm.instructions || undefined,
                refills: Number(prescriptionForm.refills || 0),
              },
            ],
          }),
        },
      );

      await fetchVisit(selectedVisitId);

      setPrescriptionForm(EMPTY_PRESCRIPTION);
      setShowPrescriptionForm(false);

      setSuccess("Prescription issued successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAddingPrescription(false);
    }
  };

  const completeConsultation = async () => {
    if (!selectedVisitId) return;

    const confirmed = window.confirm(
      "Are you sure you want to complete this consultation? You may no longer be able to edit it.",
    );

    if (!confirmed) return;

    setCompleting(true);
    setError("");
    setSuccess("");

    try {
      await apiRequest(
        `/doctors/me/visits/${selectedVisitId}/complete`,
        {
          method: "PATCH",
        },
      );

      await fetchVisit(selectedVisitId);

      setVisits((current) =>
        current.map((item) =>
          item.id === selectedVisitId
            ? { ...item, status: "COMPLETED" }
            : item,
        ),
      );

      setSuccess("Consultation completed successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCompleting(false);
    }
  };

  const patientAge = useMemo(
    () => calculateAge(patient?.dateOfBirth),
    [patient?.dateOfBirth],
  );

  if (!isSessionLoaded || loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[#f8fbff]">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          Loading patient information...
        </div>
      </main>
    );
  }

  if (error && visits.length === 0) {
    return (
      <main className="min-h-screen bg-[#f8fbff] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-red-100 bg-white p-6">
          <AlertCircle className="h-8 w-8 text-red-500" />

          <h1 className="mt-3 text-lg font-bold text-[#102a56]">
            Unable to load patient
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() => void loadPatientVisits()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fbff] px-4 pb-12 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#54709c] hover:text-blue-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to patients
        </Link>

        {/* Patient header */}
        <section className="mt-5 rounded-2xl border border-blue-50 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <User className="h-8 w-8" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-[#102a56] sm:text-2xl">
                  {patient
                    ? `${patient.firstName} ${patient.lastName}`
                    : "Patient consultation"}
                </h1>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  {patient?.patientNumber && (
                    <span>
                      Patient No: {patient.patientNumber}
                    </span>
                  )}

                  {patientAge !== null && (
                    <span>{patientAge} years</span>
                  )}

                  {patient?.gender && (
                    <span>{patient.gender}</span>
                  )}

                  {patient?.phone && (
                    <span>{patient.phone}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => void loadPatientVisits()}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {(patient?.allergies?.length ||
            patient?.chronicConditions?.length) ? (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {patient.allergies?.map((allergy) => (
                <span
                  key={allergy}
                  className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600"
                >
                  Allergy: {allergy}
                </span>
              ))}

              {patient.chronicConditions?.map((condition) => (
                <span
                  key={condition}
                  className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700"
                >
                  {condition}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        {/* Alerts */}
        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            {success}
          </div>
        )}

        {/* Visit selection */}
        <section className="mt-5 rounded-2xl border border-blue-50 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-[#102a56]">
                Select patient visit
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Choose the encounter you want to consult.
              </p>
            </div>

            <div className="w-full sm:max-w-sm">
              <select
                value={selectedVisitId}
                onChange={(event) =>
                  setSelectedVisitId(event.target.value)
                }
                className="w-full rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm text-[#102a56] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {visits.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.reasonForVisit || "Patient visit"} —{" "}
                    {formatDate(item.createdAt)} — {item.status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {visit && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <StatusBadge status={visit.status} />

              <span className="text-xs text-slate-500">
                Visit ID: {visit.id}
              </span>

              {visit.isEmergency && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                  Emergency
                </span>
              )}

              <span className="text-xs text-slate-400">
                {visit.departmentRef?.name}
              </span>
            </div>
          )}
        </section>

        {visitLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : visit ? (
          <>
            {/* Start consultation */}
            {!isActiveConsultation && !isCompleted && (
              <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold text-[#102a56]">
                      Ready to begin consultation?
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      Start this visit to enable clinical documentation.
                    </p>
                  </div>

                  <button
                    onClick={() => void startConsultation()}
                    disabled={starting || !canStart}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {starting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Start consultation
                  </button>
                </div>

                {!canStart && (
                  <p className="mt-3 text-xs text-amber-700">
                    This visit must be triaged before consultation can begin.
                  </p>
                )}
              </section>
            )}

            {isCompleted && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
                This consultation has been completed.
              </div>
            )}

            {/* Triage snapshot */}
            {visit.triageRecord && (
              <section className="mt-5 rounded-2xl border border-blue-50 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <h2 className="font-bold text-[#102a56]">
                    Triage observations
                  </h2>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    {
                      label: "Temperature",
                      value: visit.triageRecord.temperature,
                      unit: "°C",
                    },
                    {
                      label: "Blood pressure",
                      value: visit.triageRecord.bloodPressure,
                      unit: "",
                    },
                    {
                      label: "Pulse",
                      value: visit.triageRecord.pulse,
                      unit: "bpm",
                    },
                    {
                      label: "Respiratory rate",
                      value: visit.triageRecord.respiratoryRate,
                      unit: "/min",
                    },
                    {
                      label: "Oxygen saturation",
                      value: visit.triageRecord.oxygenSaturation,
                      unit: "%",
                    },
                    {
                      label: "Weight",
                      value: visit.triageRecord.weight,
                      unit: "kg",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl bg-[#f8fbff] p-3"
                    >
                      <p className="text-[11px] text-slate-400">
                        {item.label}
                      </p>
                      <p className="mt-1 text-lg font-bold text-[#102a56]">
                        {item.value ?? "—"}
                        {item.value !== undefined &&
                        item.value !== null
                          ? item.unit
                          : ""}
                      </p>
                    </div>
                  ))}
                </div>

                {visit.triageRecord.notes && (
                  <p className="mt-4 text-sm text-slate-500">
                    Triage notes: {visit.triageRecord.notes}
                  </p>
                )}
              </section>
            )}

            {/* Clinical documentation */}
            <form
              onSubmit={saveConsultation}
              className="mt-5 space-y-5"
            >
              <section className="rounded-2xl border border-blue-50 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                    <h2 className="font-bold text-[#102a56]">
                      Clinical assessment
                    </h2>
                  </div>
                  {canEdit && (
                    <span className="text-xs font-medium text-emerald-600">
                      Editable
                    </span>
                  )}
                </div>

                <div className="mt-5 space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#102a56]">
                      Examination findings
                    </label>
                    <textarea
                      rows={5}
                      value={examinationFindings}
                      onChange={(event) =>
                        setExaminationFindings(event.target.value)
                      }
                      disabled={!canEdit}
                      placeholder="Record clinical examination findings..."
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#102a56]">
                      Main diagnosis
                    </label>
                    <textarea
                      rows={3}
                      value={diagnosis}
                      onChange={(event) =>
                        setDiagnosis(event.target.value)
                      }
                      disabled={!canEdit}
                      placeholder="Enter the clinical diagnosis..."
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#102a56]">
                      Diagnosis notes
                    </label>
                    <textarea
                      rows={3}
                      value={diagnosisNotes}
                      onChange={(event) =>
                        setDiagnosisNotes(event.target.value)
                      }
                      disabled={!canEdit}
                      placeholder="Additional clinical notes..."
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#102a56]">
                      Treatment plan
                    </label>
                    <textarea
                      rows={4}
                      value={treatmentPlan}
                      onChange={(event) =>
                        setTreatmentPlan(event.target.value)
                      }
                      disabled={!canEdit}
                      placeholder="Describe the treatment plan..."
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#102a56]">
                      Follow-up instructions
                    </label>
                    <textarea
                      rows={3}
                      value={followUpInstructions}
                      onChange={(event) =>
                        setFollowUpInstructions(event.target.value)
                      }
                      disabled={!canEdit}
                      placeholder="Enter follow-up instructions..."
                      className="w-full rounded-xl border border-blue-100 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={() => void refreshVisit()}
                    disabled={saving}
                    className="rounded-xl border border-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                  >
                    Reset from saved data
                  </button>

                  <button
                    type="submit"
                    disabled={!canEdit || saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save consultation
                  </button>
                </div>
              </section>
            </form>

            {/* Diagnoses */}
            <section className="mt-5 rounded-2xl border border-blue-50 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                  <h2 className="font-bold text-[#102a56]">
                    Diagnoses
                  </h2>
                </div>

                {canEdit && (
                  <button
                    onClick={() =>
                      setShowDiagnosisForm((current) => !current)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 px-4 py-2.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add diagnosis
                  </button>
                )}
              </div>

              {showDiagnosisForm && canEdit && (
                <form
                  onSubmit={addDiagnosis}
                  className="mt-5 space-y-4 rounded-xl bg-[#f8fbff] p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Diagnosis description *
                      </label>
                      <input
                        required
                        value={diagnosisForm.description}
                        onChange={(event) =>
                          setDiagnosisForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="e.g. Malaria"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Diagnosis code
                      </label>
                      <input
                        value={diagnosisForm.code}
                        onChange={(event) =>
                          setDiagnosisForm((current) => ({
                            ...current,
                            code: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="e.g. ICD-10 code"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Diagnosis type
                      </label>
                      <select
                        value={diagnosisForm.diagnosisType}
                        onChange={(event) =>
                          setDiagnosisForm((current) => ({
                            ...current,
                            diagnosisType: event.target.value as DiagnosisType,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="PRIMARY">Primary</option>
                        <option value="SECONDARY">Secondary</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Notes
                      </label>
                      <input
                        value={diagnosisForm.notes}
                        onChange={(event) =>
                          setDiagnosisForm((current) => ({
                            ...current,
                            notes: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="Optional notes"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDiagnosisForm(false)}
                      className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={addingDiagnosis}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {addingDiagnosis && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Save diagnosis
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5 space-y-3">
                {consultation?.diagnoses?.length ? (
                  consultation.diagnoses.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-blue-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#102a56]">
                          {item.description}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                            item.diagnosisType === "PRIMARY"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.diagnosisType}
                        </span>
                      </div>

                      {item.code && (
                        <p className="mt-2 text-xs text-slate-500">
                          Code: {item.code}
                        </p>
                      )}

                      {item.notes && (
                        <p className="mt-2 text-xs text-slate-500">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#f8fbff] p-4 text-sm text-slate-400">
                    No structured diagnoses recorded yet.
                  </p>
                )}
              </div>
            </section>

            {/* Prescriptions */}
            <section className="mt-5 rounded-2xl border border-blue-50 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-blue-600" />
                  <h2 className="font-bold text-[#102a56]">
                    Prescriptions
                  </h2>
                </div>

                {canEdit && (
                  <button
                    onClick={() =>
                      setShowPrescriptionForm((current) => !current)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add prescription
                  </button>
                )}
              </div>

              {showPrescriptionForm && canEdit && (
                <form
                  onSubmit={addPrescription}
                  className="mt-5 space-y-4 rounded-xl bg-[#f8fbff] p-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Medication name *
                      </label>
                      <input
                        required
                        value={prescriptionForm.medicationName}
                        onChange={(event) =>
                          setPrescriptionForm((current) => ({
                            ...current,
                            medicationName: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="Medication name"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Strength
                      </label>
                      <input
                        value={prescriptionForm.strength}
                        onChange={(event) =>
                          setPrescriptionForm((current) => ({
                            ...current,
                            strength: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="e.g. 500mg"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Dosage *
                      </label>
                      <input
                        required
                        value={prescriptionForm.dosage}
                        onChange={(event) =>
                          setPrescriptionForm((current) => ({
                            ...current,
                            dosage: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="e.g. 1 tablet"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Route
                      </label>
                      <select
                        value={prescriptionForm.route}
                        onChange={(event) =>
                          setPrescriptionForm((current) => ({
                            ...current,
                            route: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Select route</option>
                        <option value="ORAL">Oral</option>
                        <option value="TOPICAL">Topical</option>
                        <option value="INJECTION">Injection</option>
                        <option value="INHALATION">Inhalation</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Frequency *
                      </label>
                      <input
                        required
                        value={prescriptionForm.frequency}
                        onChange={(event) =>
                          setPrescriptionForm((current) => ({
                            ...current,
                            frequency: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="e.g. Twice daily"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Duration
                      </label>
                      <input
                        value={prescriptionForm.duration}
                        onChange={(event) =>
                          setPrescriptionForm((current) => ({
                            ...current,
                            duration: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="e.g. 5 days"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={prescriptionForm.quantity}
                        onChange={(event) =>
                          setPrescriptionForm((current) => ({
                            ...current,
                            quantity: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="Quantity"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Refills
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={prescriptionForm.refills}
                        onChange={(event) =>
                          setPrescriptionForm((current) => ({
                            ...current,
                            refills: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2 lg:col-span-3">
                      <label className="mb-2 block text-xs font-semibold text-[#102a56]">
                        Instructions
                      </label>
                      <textarea
                        rows={2}
                        value={prescriptionForm.instructions}
                        onChange={(event) =>
                          setPrescriptionForm((current) => ({
                            ...current,
                            instructions: event.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-blue-100 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="Additional medication instructions..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShowPrescriptionForm(false)
                      }
                      className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={addingPrescription}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {addingPrescription && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      Issue prescription
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-5 space-y-4">
                {consultation?.prescriptions?.length ? (
                  consultation.prescriptions.map((prescription) => (
                    <div
                      key={prescription.id}
                      className="rounded-xl border border-blue-50 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-[#102a56]">
                            Prescription
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(prescription.prescribedAt)}
                          </p>
                        </div>

                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {prescription.status}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3">
                        {prescription.items.map((item, index) => (
                          <div
                            key={item.id ?? `${item.medicationName}-${index}`}
                            className="rounded-lg bg-[#f8fbff] p-3"
                          >
                            <p className="text-sm font-semibold text-[#102a56]">
                              {item.medicationName}{" "}
                              {item.strength && `(${item.strength})`}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {item.dosage} • {item.frequency}
                              {item.duration && ` • ${item.duration}`}
                              {item.route && ` • ${item.route}`}
                            </p>

                            {item.quantity !== undefined && (
                              <p className="mt-1 text-xs text-slate-500">
                                Quantity: {item.quantity}
                              </p>
                            )}

                            {item.instructions && (
                              <p className="mt-2 text-xs text-slate-500">
                                Instructions: {item.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {prescription.notes && (
                        <p className="mt-3 text-xs text-slate-500">
                          {prescription.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-[#f8fbff] p-4 text-sm text-slate-400">
                    No prescriptions have been issued for this visit.
                  </p>
                )}
              </div>
            </section>

            {/* Completion */}
            {canEdit && (
              <section className="mt-5 rounded-2xl border border-blue-50 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-bold text-[#102a56]">
                      Complete consultation
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">
                      Save all clinical information before completing this visit.
                    </p>
                  </div>

                  <button
                    onClick={() => void completeConsultation()}
                    disabled={completing || saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {completing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Complete consultation
                  </button>
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="mt-5 rounded-2xl border border-blue-50 bg-white p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-3 font-bold text-[#102a56]">
              No visit selected
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Select a patient visit to begin.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}


