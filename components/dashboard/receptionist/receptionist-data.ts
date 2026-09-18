import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  UserRound,
} from "lucide-react";

export const receptionistStats = [
  {
    label: "Today's Appointments",
    value: "86",
    change: "+8 from yesterday",
    changeType: "up" as const,
    icon: CalendarDays,
    iconStyle: "blue" as const,
  },
  {
    label: "Checked-in Patients",
    value: "34",
    change: "12 waiting",
    changeType: "up" as const,
    icon: CheckCircle2,
    iconStyle: "green" as const,
  },
  {
    label: "Waiting Patients",
    value: "12",
    change: "4 need attention",
    changeType: "down" as const,
    icon: Clock3,
    iconStyle: "red" as const,
  },
  {
    label: "Available Doctors",
    value: "9",
    change: "of 14 doctors today",
    changeType: "up" as const,
    icon: UserRound,
    iconStyle: "purple" as const,
  },
];

export const receptionistAppointments = [
  {
    id: "APT-001",
    time: "08:00 AM",
    patient: "Grace Wanjiku",
    patientId: "#P-00123",
    doctor: "Dr. Mwangi",
    department: "General Medicine",
    reason: "General Checkup",
    status: "checked-in",
  },
  {
    id: "APT-002",
    time: "08:30 AM",
    patient: "David Otieno",
    patientId: "#P-00124",
    doctor: "Dr. Achieng",
    department: "Cardiology",
    reason: "Follow Up",
    status: "checked-in",
  },
  {
    id: "APT-003",
    time: "09:00 AM",
    patient: "Amina Yusuf",
    patientId: "#P-00125",
    doctor: "Dr. Mwangi",
    department: "General Medicine",
    reason: "Consultation",
    status: "waiting",
  },
  {
    id: "APT-004",
    time: "09:30 AM",
    patient: "Peter Kamau",
    patientId: "#P-00126",
    doctor: "Dr. Otieno",
    department: "Laboratory",
    reason: "Lab Results Review",
    status: "upcoming",
  },
  {
    id: "APT-005",
    time: "10:00 AM",
    patient: "Faith Njeri",
    patientId: "#P-00127",
    doctor: "Dr. Mwangi",
    department: "General Medicine",
    reason: "Consultation",
    status: "upcoming",
  },
];

export const doctorAvailability = [
  {
    name: "Dr. James Mwangi",
    department: "General Medicine",
    status: "Available",
    room: "Room 104",
  },
  {
    name: "Dr. Sarah Achieng",
    department: "Cardiology",
    status: "In Consultation",
    room: "Room 201",
  },
  {
    name: "Dr. Peter Otieno",
    department: "Laboratory",
    status: "Available",
    room: "Room 108",
  },
  {
    name: "Dr. Mary Wanjiku",
    department: "Pediatrics",
    status: "On Break",
    room: "Room 305",
  },
];

export const recentRegistrations = [
  {
    name: "Brian Ochieng",
    patientId: "#P-00130",
    age: 48,
    sex: "Male",
    registered: "10 minutes ago",
  },
  {
    name: "Susan Muriithi",
    patientId: "#P-00129",
    age: 37,
    sex: "Female",
    registered: "32 minutes ago",
  },
  {
    name: "Kevin Kamau",
    patientId: "#P-00128",
    age: 26,
    sex: "Male",
    registered: "1 hour ago",
  },
];