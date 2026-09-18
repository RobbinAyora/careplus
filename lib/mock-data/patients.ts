// TODO: replace with real API data once backend is connected

export interface Patient {
  id: string;
  name: string;
  initials: string;
  age: number;
  gender: "M" | "F";
  email: string;
  phone: string;
  lastVisit: string; // ISO date string
  reason: string;
  status: "active" | "inactive" | "pending";
  doctorId: string;
  avatarColor: string; // for initials background
}

export const mockPatients: Patient[] = [
  {
    id: "pat-001",
    name: "Maria Santos",
    initials: "MS",
    age: 34,
    gender: "F",
    email: "maria.santos@email.com",
    phone: "(555) 123-4567",
    lastVisit: "2025-09-14",
    reason: "Annual physical exam",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-pink-100 text-pink-700",
  },
  {
    id: "pat-002",
    name: "James Wilson",
    initials: "JW",
    age: 52,
    gender: "M",
    email: "james.wilson@email.com",
    phone: "(555) 234-5678",
    lastVisit: "2025-09-14",
    reason: "Follow-up: Hypertension management",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "pat-003",
    name: "Aisha Patel",
    initials: "AP",
    age: 28,
    gender: "F",
    email: "aisha.patel@email.com",
    phone: "(555) 345-6789",
    lastVisit: "2025-09-13",
    reason: "Acute sinusitis",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-green-100 text-green-700",
  },
  {
    id: "pat-004",
    name: "Robert Kim",
    initials: "RK",
    age: 45,
    gender: "M",
    email: "robert.kim@email.com",
    phone: "(555) 456-7890",
    lastVisit: "2025-09-13",
    reason: "Diabetes follow-up",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-purple-100 text-purple-700",
  },
  {
    id: "pat-005",
    name: "Elena Rodriguez",
    initials: "ER",
    age: 61,
    gender: "F",
    email: "elena.rodriguez@email.com",
    phone: "(555) 567-8901",
    lastVisit: "2025-09-12",
    reason: "Medication review",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-orange-100 text-orange-700",
  },
  {
    id: "pat-006",
    name: "David Thompson",
    initials: "DT",
    age: 38,
    gender: "M",
    email: "david.thompson@email.com",
    phone: "(555) 678-9012",
    lastVisit: "2025-09-12",
    reason: "Back pain evaluation",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-red-100 text-red-700",
  },
  {
    id: "pat-007",
    name: "Lisa Chen",
    initials: "LC",
    age: 29,
    gender: "F",
    email: "lisa.chen@email.com",
    phone: "(555) 789-0123",
    lastVisit: "2025-09-11",
    reason: "Contraception counseling",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-teal-100 text-teal-700",
  },
  {
    id: "pat-008",
    name: "Michael Brown",
    initials: "MB",
    age: 67,
    gender: "M",
    email: "michael.brown@email.com",
    phone: "(555) 890-1234",
    lastVisit: "2025-09-11",
    reason: "Post-hospitalization follow-up",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-indigo-100 text-indigo-700",
  },
  {
    id: "pat-009",
    name: "Sarah Johnson",
    initials: "SJ",
    age: 41,
    gender: "F",
    email: "sarah.johnson@email.com",
    phone: "(555) 901-2345",
    lastVisit: "2025-09-10",
    reason: "Thyroid check",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-rose-100 text-rose-700",
  },
  {
    id: "pat-010",
    name: "Christopher Lee",
    initials: "CL",
    age: 55,
    gender: "M",
    email: "christopher.lee@email.com",
    phone: "(555) 012-3456",
    lastVisit: "2025-09-10",
    reason: "Cholesterol management",
    status: "active",
    doctorId: "user-stmarys-doctor",
    avatarColor: "bg-cyan-100 text-cyan-700",
  },
];

export function getPatientsByDoctor(doctorId: string): Patient[] {
  return mockPatients.filter((p) => p.doctorId === doctorId);
}

export function getRecentPatients(doctorId: string, limit = 5): Patient[] {
  return getPatientsByDoctor(doctorId)
    .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
    .slice(0, limit);
}