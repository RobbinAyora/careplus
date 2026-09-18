"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MockUser, Role } from "./mock-users";

const SESSION_KEY = "careplus.mock-session";
const ROLES: Role[] = [
  "super_admin",
  "hospital_admin",
  "doctor",
  "nurse",
  "receptionist",
];

interface AuthContextValue {
  user: MockUser | null;
  login: (user: MockUser) => void;
  logout: () => void;
  isSessionLoaded: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): MockUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);
    return isMockUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isMockUser(value: unknown): value is MockUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as Record<string, unknown>;
  const hasRequiredFields =
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.password === "string" &&
    typeof user.role === "string" &&
    ROLES.includes(user.role as Role) &&
    (user.hospitalId === undefined || typeof user.hospitalId === "string") &&
    (user.hospitalName === undefined || typeof user.hospitalName === "string");

  return hasRequiredFields;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  useEffect(() => {
    setUser(readStoredUser());
    setIsSessionLoaded(true);
  }, []);

  const login = useCallback((nextUser: MockUser) => {
    setUser(nextUser);

    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    } catch {
      // Keep the in-memory session usable if storage is unavailable.
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);

    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // The in-memory session is already cleared.
    }
  }, []);

  const value = useMemo(
    () => ({ user, login, logout, isSessionLoaded }),
    [isSessionLoaded, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
