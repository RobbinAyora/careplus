export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  sex: "Male" | "Female";
  doctorId: string;
  scheduledAt: string;
  reason: string;
  status:
    | "scheduled"
    | "checked_in"
    | "in_progress"
    | "completed"
    | "no_show"
    | "cancelled";
  notes?: string;
}

export const appointments: Appointment[] = [
  {
    id: "APT-001",
    patientId: "#P-00123",
    patientName: "Grace Wanjiku",
    age: 45,
    sex: "Female",
    doctorId: "DOC-001",
    scheduledAt: "2025-09-16T08:20:00",
    reason: "Post-operative follow up",
    status: "checked_in",
  },
  {
    id: "APT-002",
    patientId: "#P-00124",
    patientName: "David Otieno",
    age: 52,
    sex: "Male",
    doctorId: "DOC-001",
    scheduledAt: "2025-09-16T09:05:00",
    reason: "Hypertension review",
    status: "checked_in",
  },
  {
    id: "APT-003",
    patientId: "#P-00125",
    patientName: "Amina Yusuf",
    age: 32,
    sex: "Female",
    doctorId: "DOC-001",
    scheduledAt: "2025-09-16T10:00:00",
    reason: "Consultation",
    status: "in_progress",
  },
  {
    id: "APT-004",
    patientId: "#P-00126",
    patientName: "Peter Kamau",
    age: 60,
    sex: "Male",
    doctorId: "DOC-001",
    scheduledAt: "2025-09-16T11:30:00",
    reason: "Lab results review",
    status: "scheduled",
  },
  {
    id: "APT-005",
    patientId: "#P-00127",
    patientName: "Faith Njeri",
    age: 28,
    sex: "Female",
    doctorId: "DOC-001",
    scheduledAt: "2025-09-16T13:00:00",
    reason: "Consultation",
    status: "scheduled",
  },
  {
    id: "APT-006",
    patientId: "#P-00128",
    patientName: "John Mwangi",
    age: 40,
    sex: "Male",
    doctorId: "DOC-001",
    scheduledAt: "2025-09-16T14:30:00",
    reason: "Follow up",
    status: "completed",
  },
  {
    id: "APT-007",
    patientId: "#P-00129",
    patientName: "Susan Muriithi",
    age: 37,
    sex: "Female",
    doctorId: "DOC-001",
    scheduledAt: "2025-09-16T16:00:00",
    reason: "Consultation",
    status: "no_show",
  },
  {
    id: "APT-008",
    patientId: "#P-00130",
    patientName: "Brian Ochieng",
    age: 48,
    sex: "Male",
    doctorId: "DOC-001",
    scheduledAt: "2025-09-16T16:30:00",
    reason: "Medication review",
    status: "cancelled",
  },
];

export const patientDetails = {
  "#P-00123": {
    allergies: ["Penicillin"],
    chronicConditions: ["Hypertension"],
    lastVisit: "02 September 2025",
  },
  "#P-00124": {
    allergies: [],
    chronicConditions: ["Hypertension"],
    lastVisit: "28 August 2025",
  },
  "#P-00125": {
    allergies: ["Sulfa drugs"],
    chronicConditions: [],
    lastVisit: "15 July 2025",
  },
  "#P-00126": {
    allergies: [],
    chronicConditions: ["Type 2 Diabetes"],
    lastVisit: "03 September 2025",
  },
  "#P-00127": {
    allergies: [],
    chronicConditions: [],
    lastVisit: "19 August 2025",
  },
  "#P-00128": {
    allergies: [],
    chronicConditions: ["Asthma"],
    lastVisit: "01 September 2025",
  },
  "#P-00129": {
    allergies: [],
    chronicConditions: [],
    lastVisit: "11 August 2025",
  },
  "#P-00130": {
    allergies: ["Aspirin"],
    chronicConditions: [],
    lastVisit: "22 August 2025",
  },
};

export function getAppointments(): Promise<Appointment[]> {
  // Replace this function with your API call later.
  return Promise.resolve(appointments);
}