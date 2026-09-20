
export type PatientStatus = "Admitted" | "Outpatient" | "Discharged";

export type Gender = "Male" | "Female";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  avatar?: string;

  status: PatientStatus;

  assignedDoctorId: string;
  assignedDoctorName: string;

  ward?: string;
  bed?: string;

  lastVisit?: string;
  nextAppointment?: string;

  insuranceProvider?: string;
  insuranceNumber?: string;

  allergies: string[];
  chronicConditions: string[];

  flagged?: boolean;
}

export interface Vitals {
  recordedAt: string;
  bloodPressure: string;
  temperature: number;
  weight: number;
  pulse: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  status: "Active" | "Completed";
}

export interface VisitRecord {
  id: string;
  date: string;
  doctorName: string;
  reason: string;
  diagnosis?: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  date: string;
  time: string;
  doctorName: string;
  reason: string;
  status: "Upcoming" | "Completed" | "Cancelled";
}

export interface DocumentRecord {
  id: string;
  date: string;
  name: string;
  type: "Laboratory" | "Radiology" | "Medical Record";
  description?: string;
}

export interface PatientSummary {
  patient: Patient;

  latestVitals: Vitals;

  currentMedications: Medication[];

  visitHistory: VisitRecord[];

  upcomingAppointments: Appointment[];

  recentDocuments: DocumentRecord[];
}

