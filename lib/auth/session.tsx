
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { AuthSession, AuthUser, Role } from "./types";

export type RefreshResult =
  | { status: "success"; session: AuthSession }
  | { status: "invalid" }
  | { status: "unavailable" }
  | { status: "superseded" };

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  login: (session: AuthSession) => void;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<RefreshResult>;
  isSessionLoaded: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const REFRESH_KEY_STORAGE = "careplus.refresh-idempotency-key";

let refreshPromise: Promise<RefreshResult> | null = null;

const ROLE_MAP: Record<string, Role> = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "hospital_admin",
  DOCTOR: "doctor",
  NURSE: "nurse",
  RECEPTIONIST: "receptionist",
  PHARMACIST: "pharmacist",
  LABORATORY: "laboratory",
  RADIOLOGY: "radiology",
  CASHIER: "cashier",

  super_admin: "super_admin",
  hospital_admin: "hospital_admin",
  doctor: "doctor",
  nurse: "nurse",
  receptionist: "receptionist",
  pharmacist: "pharmacist",
  laboratory: "laboratory",
  radiology: "radiology",
  cashier: "cashier",
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function createSession(data: unknown): AuthSession | null {
  if (!isObject(data) || !isObject(data.user)) {
    return null;
  }

  const user = data.user;

  if (
    typeof data.accessToken !== "string" ||
    !data.accessToken ||
    typeof user.id !== "string" ||
    typeof user.email !== "string" ||
    typeof user.role !== "string" ||
    typeof user.mustChangePassword !== "boolean"
  ) {
    return null;
  }

  const role = ROLE_MAP[user.role];

  if (!role) {
    return null;
  }

  const firstName =
    typeof user.firstName === "string" ? user.firstName : "";

  const lastName =
    typeof user.lastName === "string" ? user.lastName : "";

  const name =
    `${firstName} ${lastName}`.trim() ||
    (typeof user.name === "string" ? user.name : "");

  if (!name) {
    return null;
  }

  const authUser: AuthUser = {
    id: user.id,
    name,
    email: user.email,
    role,
    hospitalId:
      typeof user.hospitalId === "string"
        ? user.hospitalId
        : undefined,
    mustChangePassword: user.mustChangePassword,
  };

  return {
    accessToken: data.accessToken,
    user: authUser,
  };
}

function getRefreshIdempotencyKey(): string {
  const existingKey = sessionStorage.getItem(REFRESH_KEY_STORAGE);

  if (existingKey) {
    return existingKey;
  }

  const newKey =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  sessionStorage.setItem(REFRESH_KEY_STORAGE, newKey);

  return newKey;
}

async function performRefresh(): Promise<RefreshResult> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return { status: "unavailable" };
  }

  try {
    const idempotencyKey = getRefreshIdempotencyKey();

    const response = await fetch(
      `${apiUrl.replace(/\/$/, "")}/auth/refresh`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
      },
    );

    if (response.status === 401) {
      sessionStorage.removeItem(REFRESH_KEY_STORAGE);
      return { status: "invalid" };
    }

    if (!response.ok) {
      // A server error is not proof that the user's session is invalid.
      // Keep the idempotency key so a retry can safely reuse it.
      return { status: "unavailable" };
    }

    const data: unknown = await response.json();
    const restoredSession = createSession(data);

    if (!restoredSession) {
      return { status: "unavailable" };
    }

    sessionStorage.removeItem(REFRESH_KEY_STORAGE);

    return {
      status: "success",
      session: restoredSession,
    };
  } catch {
    // Keep the key after a network error. The server may have rotated
    // the refresh token even if the browser did not receive the response.
    return { status: "unavailable" };
  }
}

async function runExclusive<T>(task: () => Promise<T>): Promise<T> {
  if (
    typeof navigator !== "undefined" &&
    navigator.locks &&
    typeof navigator.locks.request === "function"
  ) {
    return navigator.locks.request("careplus-auth-refresh", task);
  }

  return task();
}

function refreshSession(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = runExclusive(performRefresh).finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  const authRevision = useRef(0);

  useEffect(() => {
    let active = true;
    const revisionAtStart = authRevision.current;

    async function restoreSession() {
      const result = await refreshSession();

      if (
        !active ||
        revisionAtStart !== authRevision.current
      ) {
        return;
      }

      if (result.status === "success") {
        setSession(result.session);
        setIsSessionLoaded(true);
        return;
      }

      if (result.status === "invalid") {
        setSession(null);
        setIsSessionLoaded(true);
        return;
      }

      if (result.status === "unavailable") {
        // Do not clear an existing session because of a temporary
        // backend or network failure.
        setIsSessionLoaded(true);
        return;
      }

      if (result.status === "superseded") {
        return;
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback((nextSession: AuthSession) => {
    authRevision.current += 1;

    sessionStorage.removeItem(REFRESH_KEY_STORAGE);

    setSession(nextSession);
    setIsSessionLoaded(true);
  }, []);

  const refreshAccessToken = useCallback(
    async (): Promise<RefreshResult> => {
      const revisionAtStart = authRevision.current;
      const result = await refreshSession();

      // Do not allow an older refresh operation to overwrite a newer login.
      if (revisionAtStart !== authRevision.current) {
        return { status: "superseded" };
      }

      if (result.status === "success") {
        setSession(result.session);
        setIsSessionLoaded(true);
      } else if (result.status === "invalid") {
        setSession(null);
        setIsSessionLoaded(true);
      }

      // An unavailable refresh must not automatically log out the user.
      return result;
    },
    [],
  );

  const logout = useCallback(async () => {
    authRevision.current += 1;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const currentAccessToken = session?.accessToken;

    try {
      if (apiUrl) {
        await fetch(`${apiUrl.replace(/\/$/, "")}/auth/logout`, {
          method: "POST",
          credentials: "include",
          headers: currentAccessToken
            ? {
                Authorization: `Bearer ${currentAccessToken}`,
              }
            : {},
        });
      }
    } catch {
      // Clear the local session even if the server cannot be reached.
    } finally {
      sessionStorage.removeItem(REFRESH_KEY_STORAGE);
      setSession(null);
      setIsSessionLoaded(true);
    }
  }, [session]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      login,
      logout,
      refreshAccessToken,
      isSessionLoaded,
    }),
    [
      session,
      login,
      logout,
      refreshAccessToken,
      isSessionLoaded,
    ],
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





