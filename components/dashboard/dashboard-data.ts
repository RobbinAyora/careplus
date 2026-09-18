import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Pill,
  Receipt,
  Settings,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";

export type DashboardRole =
  | "doctor"
  | "admin"
  | "nurse"
  | "receptionist";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navigation: NavItem[] = [
  { label: "Dashboard", href: "/doctor", icon: LayoutDashboard },
  { label: "Appointments", href: "/doctor/appointments", icon: CalendarDays },
  { label: "Patients", href: "/doctor/patients", icon: UsersRound },
  { label: "Medical Records", href: "/doctor/records", icon: FileText },
  { label: "Prescriptions", href: "/doctor/prescriptions", icon: Pill },
  { label: "Laboratory", href: "/doctor/laboratory", icon: FlaskConical },
  { label: "Radiology", href: "/doctor/radiology", icon: ClipboardList },
  { label: "Billing", href: "/doctor/billing", icon: Receipt },
  { label: "Messages", href: "/doctor/messages", icon: MessageSquare },
  { label: "Settings", href: "/doctor/settings", icon: Settings },
];

export const doctorStats = [
  {
    label: "Today's Appointments",
    value: "8",
    trend: "↑ 2 more than yesterday",
    tone: "blue" as const,
    icon: CalendarDays,
  },
  {
    label: "New Patients",
    value: "3",
    trend: "↑ 1 more than yesterday",
    tone: "green" as const,
    icon: UserRound,
  },
  {
    label: "Pending Lab Results",
    value: "5",
    trend: "↓ 2 less than yesterday",
    tone: "purple" as const,
    icon: FileText,
  },
  {
    label: "Critical Alerts",
    value: "1",
    trend: "Needs attention",
    tone: "red" as const,
    icon: Stethoscope,
  },
];

export const appointments = [
  ["08:00 AM", "Grace Wanjiku", "#P-00123", "General Checkup", "Completed"],
  ["09:30 AM", "David Otieno", "#P-00124", "Follow Up", "In Progress"],
  ["11:00 AM", "Amina Yusuf", "#P-00125", "Consultation", "Upcoming"],
  ["01:00 PM", "Peter Kamau", "#P-00126", "Lab Results Review", "Upcoming"],
  ["03:30 PM", "Faith Njeri", "#P-00127", "Consultation", "Upcoming"],
] as const;

export const recentPatients = [
  ["Grace Wanjiku", "#P-00123", "28 years", "Female", "08:00 AM"],
  ["David Otieno", "#P-00124", "45 years", "Male", "09:30 AM"],
  ["Amina Yusuf", "#P-00125", "32 years", "Female", "11:00 AM"],
] as const;

export const visitValues = [12, 17, 14, 20, 22, 31, 27];
