import {
  LayoutDashboard,
  CalendarDays,
  UsersRound,
  FileText,
  Pill,
  FlaskConical,
  Image,
  CreditCard,
  MessageSquare,
  Settings,
  Package,
  BarChart3,
} from "lucide-react";

export type DashboardRole =
  | "doctor"
  | "admin"
  | "nurse"
  | "receptionist"
  | "super_admin";

export const roleNavigation = {
  doctor: [
    {
      label: "Dashboard",
      href: "/doctor/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Appointments",
      href: "/doctor/appointments",
      icon: CalendarDays,
    },
    {
      label: "Patients",
      href: "/doctor/patients",
      icon: UsersRound,
    },
    {
      label: "Medical Records",
      href: "/doctor/medical-records",
      icon: FileText,
    },
    {
      label: "Prescriptions",
      href: "/doctor/prescriptions",
      icon: Pill,
    },
    {
      label: "Laboratory",
      href: "/doctor/laboratory",
      icon: FlaskConical,
    },
    {
      label: "Radiology",
      href: "/doctor/radiology",
      icon: Image,
    },
    {
      label: "Billing",
      href: "/doctor/billing",
      icon: CreditCard,
    },
    {
      label: "Messages",
      href: "/doctor/messages",
      icon: MessageSquare,
    },
    {
      label: "Settings",
      href: "/doctor/settings",
      icon: Settings,
    },
  ],

  admin: [
    {
      label: "Dashboard",
      href: "/hospital-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Users & Staff",
      href: "/hospital-admin/users",
      icon: UsersRound,
    },
    {
      label: "Patients",
      href: "/hospital-admin/patients",
      icon: UsersRound,
    },
    {
      label: "Appointments",
      href: "/hospital-admin/appointments",
      icon: CalendarDays,
    },
    {
      label: "Medical Records",
      href: "/hospital-admin/medical-records",
      icon: FileText,
    },
    {
      label: "Inventory",
      href: "/hospital-admin/inventory",
      icon: Package,
    },
    {
      label: "Billing & Finance",
      href: "/hospital-admin/billing",
      icon: CreditCard,
    },
    {
      label: "Reports",
      href: "/hospital-admin/reports",
      icon: BarChart3,
    },
    {
      label: "Settings",
      href: "/hospital-admin/settings",
      icon: Settings,
    },
  ],

  nurse: [
    {
      label: "Dashboard",
      href: "/nurse/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Assigned Patients",
      href: "/nurse/patients",
      icon: UsersRound,
    },
    {
      label: "Patient Vitals",
      href: "/nurse/vitals",
      icon: FileText,
    },
    {
      label: "Medication",
      href: "/nurse/medication",
      icon: Pill,
    },
    {
      label: "Nursing Notes",
      href: "/nurse/notes",
      icon: FileText,
    },
    {
      label: "Tasks",
      href: "/nurse/tasks",
      icon: CalendarDays,
    },
    {
      label: "Messages",
      href: "/nurse/messages",
      icon: MessageSquare,
    },
  ],

  receptionist: [
    {
      label: "Dashboard",
      href: "/receptionist/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Appointments",
      href: "/receptionist/appointments",
      icon: CalendarDays,
    },
    {
      label: "Patient Registration",
      href: "/receptionist/register",
      icon: UsersRound,
    },
    {
      label: "Patients",
      href: "/receptionist/patients",
      icon: UsersRound,
    },
    {
      label: "Check-in",
      href: "/receptionist/check-in",
      icon: FileText,
    },
    {
      label: "Billing",
      href: "/receptionist/billing",
      icon: CreditCard,
    },
    {
      label: "Messages",
      href: "/receptionist/messages",
      icon: MessageSquare,
    },
  ],

  super_admin: [
    {
      label: "Dashboard",
      href: "/super-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Hospitals",
      href: "/super-admin/hospitals",
      icon: UsersRound,
    },
    {
      label: "Administrators",
      href: "/super-admin/administrators",
      icon: UsersRound,
    },
    {
      label: "System Users",
      href: "/super-admin/users",
      icon: UsersRound,
    },
    {
      label: "Reports",
      href: "/super-admin/reports",
      icon: BarChart3,
    },
    {
      label: "Audit Logs",
      href: "/super-admin/audit-logs",
      icon: FileText,
    },
    {
      label: "Settings",
      href: "/super-admin/settings",
      icon: Settings,
    },
  ],
};