
import type { Role } from "./types";

export const DASHBOARD_PATHS: Partial<Record<Role, string>> = {
  super_admin: "/super-admin/dashboard",
  hospital_admin: "/hospital-admin/dashboard",
  doctor: "/doctor/dashboard",
  nurse: "/nurse/dashboard",
  receptionist: "/receptionist/dashboard",
  pharmacist: "/pharmacist/dashboard",
  laboratory: "/laboratory/dashboard",
};

export const ROLE_LABELS: Partial<Record<Role, string>> = {
  super_admin: "Super Admin",
  hospital_admin: "Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  receptionist: "Receptionist",
  pharmacist: "Pharmacist",
  laboratory: "Laboratory",
};

