// TODO: replace with real API data once backend is connected

export type LabResultStatus = "pending" | "completed" | "abnormal" | "critical";

export interface LabResult {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  orderedAt: string; // ISO date string
  status: LabResultStatus;
  doctorId: string;
}

export const mockLabResults: LabResult[] = [
  {
    id: "lab-001",
    patientId: "pat-003",
    patientName: "Aisha Patel",
    testName: "CBC with Differential",
    orderedAt: "2025-09-13",
    status: "pending",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "lab-002",
    patientId: "pat-004",
    patientName: "Robert Kim",
    testName: "HbA1c",
    orderedAt: "2025-09-13",
    status: "pending",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "lab-003",
    patientId: "pat-005",
    patientName: "Elena Rodriguez",
    testName: "Comprehensive Metabolic Panel",
    orderedAt: "2025-09-12",
    status: "completed",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "lab-004",
    patientId: "pat-006",
    patientName: "David Thompson",
    testName: "Lipid Panel",
    orderedAt: "2025-09-12",
    status: "abnormal",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "lab-005",
    patientId: "pat-007",
    patientName: "Lisa Chen",
    testName: "Thyroid Panel (TSH, T3, T4)",
    orderedAt: "2025-09-11",
    status: "completed",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "lab-006",
    patientId: "pat-008",
    patientName: "Michael Brown",
    testName: "BMP",
    orderedAt: "2025-09-11",
    status: "pending",
    doctorId: "user-stmarys-doctor",
  },
];

export function getLabResultsByDoctor(doctorId: string): LabResult[] {
  return mockLabResults.filter((l) => l.doctorId === doctorId);
}

export function getPendingLabResultsCount(doctorId: string): number {
  return getLabResultsByDoctor(doctorId).filter((l) => l.status === "pending").length;
}