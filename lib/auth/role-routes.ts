import type { Role } from "./mock-users";

export const DASHBOARD_PATHS: Record<Role, string> = {
  super_admin: "/super-admin/dashboard",

  hospital_admin: "/hospital-admin/dashboard",

  doctor: "/doctor/dashboard",

  nurse: "/nurse/dashboard",

  receptionist: "/receptionist/dashboard",
};

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super Admin",

  hospital_admin: "Admin",

  doctor: "Doctor",

  nurse: "Nurse",

  receptionist: "Receptionist",
};
