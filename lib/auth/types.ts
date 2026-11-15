
export type Role =
  | "super_admin"
  | "hospital_admin"
  | "doctor"
  | "nurse"
  | "receptionist"
  | "pharmacist"
  | "laboratory"
  | "radiology"
  | "cashier";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  hospitalId?: string;
  mustChangePassword: boolean;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}

