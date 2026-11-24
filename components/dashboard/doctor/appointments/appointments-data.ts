
export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "no_show"
  | "cancelled";

export interface Appointment {
  id: string;
  patientId: string;
  patientNumber: string;
  patientName: string;
  age: number | null;
  sex: string;
  doctorId: string;
  doctorName: string;
  scheduledAt: string;
  endAt?: string;
  durationMinutes: number;
  reason: string;
  status: AppointmentStatus;
  version: number;
  visitId?: string | null;
  notes?: string;
}

export interface AppointmentPage {
  data: Appointment[];
  nextCursor: string | null;
  hasMore: boolean;
}

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object"
    ? (value as UnknownRecord)
    : {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function calculateAge(dateOfBirth: unknown): number | null {
  if (typeof dateOfBirth !== "string") return null;

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : null;
}

export function normalizeAppointmentStatus(
  value: unknown,
): AppointmentStatus {
  switch (String(value ?? "").toUpperCase()) {
    case "CONFIRMED":
      return "confirmed";
    case "CHECKED_IN":
      return "checked_in";
    case "COMPLETED":
      return "completed";
    case "NO_SHOW":
      return "no_show";
    case "CANCELLED":
      return "cancelled";
    case "SCHEDULED":
    default:
      return "scheduled";
  }
}

export function normalizeAppointment(value: unknown): Appointment {
  const raw = asRecord(value);
  const patient = asRecord(raw.patient);
  const doctor = asRecord(raw.doctor);

  const firstName = asString(patient.firstName);
  const lastName = asString(patient.lastName);
  const otherNames = asString(patient.otherNames);

  const patientName = [firstName, otherNames, lastName]
    .filter(Boolean)
    .join(" ");

  const dateOfBirth = patient.dateOfBirth;
  const estimatedAge = patient.estimatedAgeYears;

  const age =
    typeof estimatedAge === "number"
      ? estimatedAge
      : calculateAge(dateOfBirth);

  const doctorName = [
    asString(doctor.firstName),
    asString(doctor.lastName),
  ]
    .filter(Boolean)
    .join(" ");

  return {
    id: asString(raw.id),
    patientId: asString(raw.patientId ?? patient.id),
    patientNumber: asString(patient.patientNumber, "Patient"),
    patientName: patientName || "Unknown patient",
    age,
    sex: asString(patient.sex, "Not specified"),
    doctorId: asString(raw.doctorId ?? doctor.id),
    doctorName: doctorName || "Assigned doctor",
    scheduledAt: asString(raw.scheduledAt),
    endAt: asString(raw.endAt) || undefined,
    durationMinutes:
      typeof raw.durationMinutes === "number"
        ? raw.durationMinutes
        : 30,
    reason: asString(raw.reason, "Consultation"),
    status: normalizeAppointmentStatus(raw.status),
    version: typeof raw.version === "number" ? raw.version : 1,
    visitId:
      typeof raw.visitId === "string" ? raw.visitId : null,
  };
}

export function normalizeAppointmentPage(
  response: unknown,
): AppointmentPage {
  const raw = asRecord(response);

  const rows = Array.isArray(response)
    ? response
    : Array.isArray(raw.data)
      ? raw.data
      : Array.isArray(raw.items)
        ? raw.items
        : [];

  return {
    data: rows.map(normalizeAppointment),
    nextCursor:
      typeof raw.nextCursor === "string" ? raw.nextCursor : null,
    hasMore: raw.hasMore === true,
  };
}

export function toBackendAppointmentStatus(
  status: string,
): string | undefined {
  switch (status) {
    case "scheduled":
      return "SCHEDULED";
    case "confirmed":
      return "CONFIRMED";
    case "checked_in":
      return "CHECKED_IN";
    case "completed":
      return "COMPLETED";
    case "no_show":
      return "NO_SHOW";
    case "cancelled":
      return "CANCELLED";
    default:
      return undefined;
  }
}
