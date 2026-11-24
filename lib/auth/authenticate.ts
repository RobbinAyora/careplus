
import type { AuthSession, Role } from "./types";

interface BackendLoginResponse {
  accessToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    hospitalId: string | null;
    mustChangePassword: boolean;
  };
}

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
};

export async function authenticate(
  email: string,
  password: string,
): Promise<{ session: AuthSession } | { error: string }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return { error: "The API address is not configured." };
  }

  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      const message =
        typeof data === "object" &&
        data !== null &&
        "message" in data
          ? data.message
          : null;

      if (Array.isArray(message)) {
        return { error: message.join(", ") };
      }

      return {
        error:
          typeof message === "string"
            ? message
            : "Unable to sign in. Check your email and password.",
      };
    }

    if (
      typeof data !== "object" ||
      data === null ||
      !("accessToken" in data) ||
      !("user" in data)
    ) {
      return {
        error: "The server returned an invalid login response.",
      };
    }

    const result = data as BackendLoginResponse;

    if (
      typeof result.accessToken !== "string" ||
      !result.accessToken ||
      !result.user ||
      typeof result.user.id !== "string" ||
      typeof result.user.email !== "string" ||
      typeof result.user.firstName !== "string" ||
      typeof result.user.lastName !== "string" ||
      typeof result.user.role !== "string" ||
      typeof result.user.mustChangePassword !== "boolean"
    ) {
      return {
        error: "The server returned incomplete login information.",
      };
    }

    const role = ROLE_MAP[result.user.role];

    if (!role) {
      return {
        error: "Your account role is not yet supported by this application.",
      };
    }

    return {
      session: {
        accessToken: result.accessToken,
        user: {
          id: result.user.id,
          name: `${result.user.firstName} ${result.user.lastName}`.trim(),
          email: result.user.email,
          role,
          hospitalId: result.user.hospitalId ?? undefined,
          mustChangePassword: result.user.mustChangePassword,
        },
      },
    };
  } catch {
    return {
      error: "Cannot connect to the server. Check that the backend is running.",
    };
  }
}

