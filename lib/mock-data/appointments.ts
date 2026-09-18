// TODO: replace with real API data once backend is connected

export type AppointmentStatus = "upcoming" | "in-progress" | "completed" | "cancelled" | "no-show";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientInitials: string;
  patientAge: number;
  patientGender: "M" | "F";
  reason: string;
  time: string; // ISO string or HH:MM format
  duration: number; // minutes
  status: AppointmentStatus;
  doctorId: string;
  notes?: string;
}

export const mockAppointments: Appointment[] = [
  {
    id: "appt-001",
    patientId: "pat-001",
    patientName: "Maria Santos",
    patientInitials: "MS",
    patientAge: 34,
    patientGender: "F",
    reason: "Annual physical exam",
    time: "08:30",
    duration: 30,
    status: "completed",
    doctorId: "user-stmarys-doctor",
    notes: "Routine checkup, all vitals normal",
  },
  {
    id: "appt-002",
    patientId: "pat-002",
    patientName: "James Wilson",
    patientInitials: "JW",
    patientAge: 52,
    patientGender: "M",
    reason: "Follow-up: Hypertension management",
    time: "09:15",
    duration: 20,
    status: "in-progress",
    doctorId: "user-stmarys-doctor",
    notes: "BP 138/88, adjusting lisinopril dosage",
  },
  {
    id: "appt-003",
    patientId: "pat-003",
    patientName: "Aisha Patel",
    patientInitials: "AP",
    patientAge: 28,
    patientGender: "F",
    reason: "Acute sinusitis",
    time: "10:00",
    duration: 15,
    status: "upcoming",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "appt-004",
    patientId: "pat-004",
    patientName: "Robert Kim",
    patientInitials: "RK",
    patientAge: 45,
    patientGender: "M",
    reason: "Diabetes follow-up",
    time: "10:30",
    duration: 20,
    status: "upcoming",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "appt-005",
    patientId: "pat-005",
    patientName: "Elena Rodriguez",
    patientInitials: "ER",
    patientAge: 61,
    patientGender: "F",
    reason: "Medication review",
    time: "11:00",
    duration: 15,
    status: "upcoming",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "appt-006",
    patientId: "pat-006",
    patientName: "David Thompson",
    patientInitials: "DT",
    patientAge: 38,
    patientGender: "M",
    reason: "Back pain evaluation",
    time: "14:00",
    duration: 30,
    status: "upcoming",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "appt-007",
    patientId: "pat-007",
    patientName: "Lisa Chen",
    patientInitials: "LC",
    patientAge: 29,
    patientGender: "F",
    reason: "Contraception counseling",
    time: "14:45",
    duration: 20,
    status: "upcoming",
    doctorId: "user-stmarys-doctor",
  },
  {
    id: "appt-008",
    patientId: "pat-008",
    patientName: "Michael Brown",
    patientInitials: "MB",
    patientAge: 67,
    patientGender: "M",
    reason: "Post-hospitalization follow-up",
    time: "15:30",
    duration: 30,
    status: "upcoming",
    doctorId: "user-stmarys-doctor",
  },
];

// Helper functions
export function getAppointmentsByDoctor(doctorId: string): Appointment[] {
  return mockAppointments.filter((a) => a.doctorId === doctorId);
}

export function getTodayAppointments(doctorId: string): Appointment[] {
  return getAppointmentsByDoctor(doctorId);
}

export function getAppointmentStats(doctorId: string) {
  const appointments = getAppointmentsByDoctor(doctorId);
  return {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === "completed").length,
    inProgress: appointments.filter((a) => a.status === "in-progress").length,
    upcoming: appointments.filter((a) => a.status === "upcoming").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };
}