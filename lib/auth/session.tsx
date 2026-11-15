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
import type { AuthSession, AuthUser, Role } from "./types";

const SESSION_KEY = "careplus.auth-session";

const ROLES: Role[] = [
  "super_admin",
  "hospital_admin",
  "doctor",
  "nurse",
  "receptionist",
  "pharmacist",
  "laboratory",
];

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  login: (session: AuthSession) => void;
  logout: () => void;
  isSessionLoaded: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Record<string, unknown>;

  if (
    typeof session.accessToken !== "string" ||
    !session.accessToken ||
    !session.user ||
    typeof session.user !== "object"
  ) {
    return false;
  }

  const user = session.user as Record<string, unknown>;

  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    typeof user.role === "string" &&
    ROLES.includes(user.role as Role) &&
    typeof user.mustChangePassword === "boolean" &&
    (user.hospitalId === undefined ||
      typeof user.hospitalId === "string")
  );
}

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);

    if (!stored) {
      return null;
    }

    const parsed: unknown = JSON.parse(stored);
    return isAuthSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  useEffect(() => {
    setSession(readStoredSession());
    setIsSessionLoaded(true);
  }, []);

  const login = useCallback((nextSession: AuthSession) => {
    setSession(nextSession);

    try {
      window.sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify(nextSession),
      );
    } catch {
      // Keep the in-memory session usable if storage is unavailable.
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);

    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // The in-memory session is already cleared.
    }
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      login,
      logout,
      isSessionLoaded,
    }),
    [session, login, logout, isSessionLoaded],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
