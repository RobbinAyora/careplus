export type Role =
  | "super_admin"
  | "hospital_admin"
  | "doctor"
  | "nurse"
  | "receptionist";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  hospitalId?: string;
  hospitalName?: string;
}

export const mockUsers: MockUser[] = [
  {
    id: "user-super-admin",
    name: "CarePlus Super Admin",
    email: "superadmin@careplus.io",
    password: "SuperAdmin123!",
    role: "super_admin",
  },
  {
    id: "user-stmarys-admin",
    name: "St. Mary's Hospital Admin",
    email: "admin@stmarys.careplus.io",
    password: "Admin123!",
    role: "hospital_admin",
    hospitalId: "hospital-stmarys",
    hospitalName: "St. Mary's Hospital",
  },
  {
    id: "user-stmarys-doctor",
    name: "Dr. Avery Johnson",
    email: "doctor@stmarys.careplus.io",
    password: "Doctor123!",
    role: "doctor",
    hospitalId: "hospital-stmarys",
    hospitalName: "St. Mary's Hospital",
  },
  {
    id: "user-stmarys-nurse",
    name: "Jordan Lee",
    email: "nurse@stmarys.careplus.io",
    password: "Nurse123!",
    role: "nurse",
    hospitalId: "hospital-stmarys",
    hospitalName: "St. Mary's Hospital",
  },
  {
    id: "user-stmarys-receptionist",
    name: "Morgan Patel",
    email: "frontdesk@stmarys.careplus.io",
    password: "Frontdesk123!",
    role: "receptionist",
    hospitalId: "hospital-stmarys",
    hospitalName: "St. Mary's Hospital",
  },
  {
    id: "user-riverside-doctor",
    name: "Dr. Riley Chen",
    email: "doctor@riverside.careplus.io",
    password: "Doctor123!",
    role: "doctor",
    hospitalId: "hospital-riverside",
    hospitalName: "Riverside General Hospital",
  },
];
