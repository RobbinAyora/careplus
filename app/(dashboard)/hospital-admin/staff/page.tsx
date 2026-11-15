
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STAFF_ROLES = [
  "DOCTOR",
  "NURSE",
  "RECEPTIONIST",
  "PHARMACIST",
  "LABORATORY",
  "RADIOLOGY",
  "CASHIER",
] as const;

type StaffRole = (typeof STAFF_ROLES)[number];
type ToastType = "success" | "error";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
}

interface StaffForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: StaffRole;
}

interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

const EMPTY_FORM: StaffForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "DOCTOR",
};

function roleLabel(role: StaffRole) {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function getErrorMessage(data: unknown): string {
  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;

    if (Array.isArray(message)) {
      return message
        .filter((item): item is string => typeof item === "string")
        .join(", ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Something went wrong. Please try again.";
}

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

export default function StaffPage() {
  const { accessToken, isSessionLoaded } = useAuth();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<StaffForm>(EMPTY_FORM);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({
      id: Date.now(),
      type,
      message,
    });
  }, []);

  // Automatically dismiss notifications after 4 seconds.
  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  // Fetch staff members.
  const fetchStaff = useCallback(async () => {
    if (!accessToken || !API_URL) {
      setLoading(false);
      setError(
        !API_URL
          ? "API URL is not configured."
          : "Please sign in to view staff."
      );
      return false;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/staff`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      if (!Array.isArray(data)) {
        throw new Error("The server returned an unexpected staff list.");
      }

      setStaff(data as StaffMember[]);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load staff.";

      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isSessionLoaded) {
      void fetchStaff();
    }
  }, [isSessionLoaded, fetchStaff]);

  // Search and filter staff.
  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return staff.filter((member) => {
      const fullName =
        `${member.firstName} ${member.lastName}`.toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        member.email.toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "ALL" || member.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && member.isActive) ||
        (statusFilter === "INACTIVE" && !member.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staff, search, roleFilter, statusFilter]);

  function updateField<K extends keyof StaffForm>(
    field: K,
    value: StaffForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // Enroll a new staff member.
  async function handleEnroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!accessToken || !API_URL) {
      setFormError("Your session or API configuration is missing.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          role: form.role,
        }),
      });

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      setForm(EMPTY_FORM);
      setModalOpen(false);

      showToast(
        "success",
        "Staff member enrolled and invitation email sent successfully."
      );

      await fetchStaff();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to enroll staff member.";

      setFormError(message);
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  }

  // Suspend or reactivate a staff account.
  async function handleStatusChange(member: StaffMember) {
    if (!accessToken || !API_URL) {
      showToast("error", "Your session or API configuration is missing.");
      return;
    }

    const nextStatus = !member.isActive;

    const action = nextStatus ? "reactivate" : "suspend";

    const confirmed = window.confirm(
      nextStatus
        ? `Are you sure you want to reactivate ${member.firstName} ${member.lastName}'s account?`
        : `Are you sure you want to suspend ${member.firstName} ${member.lastName}'s account? They will no longer be able to access the system.`
    );

    if (!confirmed) return;

    setActionLoading(member.id);

    try {
      const response = await fetch(
        `${API_URL}/staff/${member.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            isActive: nextStatus,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      // Update the row immediately.
      setStaff((current) =>
        current.map((item) =>
          item.id === member.id
            ? { ...item, isActive: nextStatus }
            : item
        )
      );

      showToast(
        "success",
        nextStatus
          ? `${member.firstName} ${member.lastName} has been reactivated.`
          : `${member.firstName} ${member.lastName} has been suspended.`
      );

      // Refresh from the server to ensure the list is current.
      await fetchStaff();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : `Unable to ${action} staff member.`;

      showToast("error", message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 xl:px-8">

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border px-5 py-4 shadow-lg ${
            toast.type === "success"
              ? "border-green-200 bg-white text-green-800"
              : "border-red-200 bg-white text-red-800"
          }`}
        >
          <span className="text-lg">
            {toast.type === "success" ? "✓" : "!"}
          </span>

          <div className="flex-1">
            <p className="text-sm font-semibold">
              {toast.type === "success" ? "Success" : "Error"}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {toast.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Page heading */}
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#102f5f]">
            Staff Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your hospital staff and their accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setFormError("");
            setModalOpen(true);
          }}
          className="rounded-xl bg-[#2d91e8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#197dcc]"
        >
          + Enroll Staff
        </button>
      </div>

      {/* Staff directory */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-[#102f5f]">
              Staff Directory
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredStaff.length} staff member
              {filteredStaff.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or email..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#2d91e8] sm:w-56"
            />

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#2d91e8]"
            >
              <option value="ALL">All roles</option>
              {STAFF_ROLES.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#2d91e8]"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={() => void fetchStaff()}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Staff member</th>
                <th className="px-5 py-4 font-semibold">Phone</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">Account status</th>
                <th className="px-5 py-4 font-semibold">Date added</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Loading staff...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#102f5f]">
                        {member.firstName} {member.lastName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {member.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {member.phone || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {roleLabel(member.role)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          member.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {member.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(member.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        type="button"
                        disabled={actionLoading === member.id}
                        onClick={() => void handleStatusChange(member)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          member.isActive
                            ? "bg-red-50 text-red-700 hover:bg-red-100"
                            : "bg-green-50 text-green-700 hover:bg-green-100"
                        }`}
                      >
                        {actionLoading === member.id
                          ? "Please wait..."
                          : member.isActive
                            ? "Suspend"
                            : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Enrollment modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enroll-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="enroll-title"
                  className="text-xl font-bold text-[#102f5f]"
                >
                  Enroll Staff
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the new staff member&apos;s details.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                aria-label="Close enrollment form"
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleEnroll} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    First name
                  </label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(event) =>
                      updateField("firstName", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Last name
                  </label>
                  <input
                    required
                    value={form.lastName}
                    onChange={(event) =>
                      updateField("lastName", event.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                  placeholder="staff@hospital.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                  placeholder="+254..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Staff role
                </label>
                <select
                  value={form.role}
                  onChange={(event) =>
                    updateField("role", event.target.value as StaffRole)
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                >
                  {STAFF_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#2d91e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#197dcc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Enrolling..." : "Enroll Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

