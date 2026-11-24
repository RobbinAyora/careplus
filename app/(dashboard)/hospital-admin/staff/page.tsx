
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { useAuth } from "@/lib/auth/session";
import { useApiClient } from "@/lib/api/client";

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
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt?: string;
  version: number;
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

interface StaffPageResponse {
  data: StaffMember[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface EnrollResponse {
  staff: StaffMember;
  invitationSent: boolean;
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

function parseStaffPage(response: unknown): StaffPageResponse {
  // Backward compatibility if the server still returns an array.
  if (Array.isArray(response)) {
    return {
      data: response as StaffMember[],
      nextCursor: null,
      hasMore: false,
    };
  }

  if (
    typeof response !== "object" ||
    response === null ||
    !("data" in response) ||
    !Array.isArray(response.data)
  ) {
    throw new Error("The server returned an unexpected staff list.");
  }

  const result = response as {
    data: StaffMember[];
    nextCursor?: string | null;
    hasMore?: boolean;
  };

  return {
    data: result.data,
    nextCursor: result.nextCursor ?? null,
    hasMore: result.hasMore ?? false,
  };
}

export default function StaffPage() {
  const { accessToken, isSessionLoaded } = useAuth();
  const apiRequest = useApiClient();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

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

  // Fetch the first page of staff members.
  const fetchStaff = useCallback(async () => {
    if (!isSessionLoaded) return false;

    if (!accessToken) {
      setLoading(false);
      setError("Please sign in to view staff.");
      return false;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiRequest<unknown>("/staff?limit=100");
      const page = parseStaffPage(response);

      setStaff(page.data);
      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load staff.";

      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiRequest, isSessionLoaded]);

  // Fetch additional staff records using the cursor.
  const loadMoreStaff = useCallback(async () => {
    if (!nextCursor || loadingMore || !hasMore) return;

    setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        limit: "100",
        cursor: nextCursor,
      });

      const response = await apiRequest<unknown>(
        `/staff?${params.toString()}`,
      );

      const page = parseStaffPage(response);

      setStaff((current) => {
        const existingIds = new Set(current.map((member) => member.id));

        return [
          ...current,
          ...page.data.filter((member) => !existingIds.has(member.id)),
        ];
      });

      setNextCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to load more staff.";

      showToast("error", message);
    } finally {
      setLoadingMore(false);
    }
  }, [apiRequest, hasMore, loadingMore, nextCursor, showToast]);

  useEffect(() => {
    if (isSessionLoaded) {
      void fetchStaff();
    }
  }, [isSessionLoaded, fetchStaff]);

  // Search and filter the loaded staff records.
  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();

    return staff.filter((member) => {
      const fullName =
        `${member.firstName} ${member.lastName}`.toLowerCase();

      const matchesSearch =
        !query ||
        fullName.includes(query) ||
        member.email.toLowerCase().includes(query) ||
        (member.phone ?? "").toLowerCase().includes(query);

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
    value: StaffForm[K],
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

    if (!isSessionLoaded || !accessToken) {
      setFormError("Your session is still loading or has expired.");
      return;
    }

    setSaving(true);

    try {
      const result = await apiRequest<EnrollResponse>("/staff", {
        method: "POST",
        body: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          role: form.role,
        },
      });

      setForm(EMPTY_FORM);
      setModalOpen(false);

      showToast(
        result.invitationSent ? "success" : "error",
        result.message,
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
    if (!isSessionLoaded || !accessToken) {
      showToast("error", "Your session is still loading or has expired.");
      return;
    }

    const nextStatus = !member.isActive;
    const action = nextStatus ? "reactivate" : "suspend";

    const confirmed = window.confirm(
      nextStatus
        ? `Are you sure you want to reactivate ${member.firstName} ${member.lastName}'s account?`
        : `Are you sure you want to suspend ${member.firstName} ${member.lastName}'s account? They will no longer be able to access the system.`,
    );

    if (!confirmed) return;

    setActionLoading(member.id);

    try {
      const updated = await apiRequest<StaffMember>(
        `/staff/${member.id}/status`,
        {
          method: "PATCH",
          body: {
            isActive: nextStatus,
          },
        },
      );

      setStaff((current) =>
        current.map((item) =>
          item.id === member.id
            ? { ...item, ...updated }
            : item,
        ),
      );

      showToast(
        "success",
        nextStatus
          ? `${member.firstName} ${member.lastName} has been reactivated.`
          : `${member.firstName} ${member.lastName} has been suspended.`,
      );
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

  // Resend the initial staff invitation.
  async function handleResendInvitation(member: StaffMember) {
    if (!isSessionLoaded || !accessToken) {
      showToast("error", "Your session is still loading or has expired.");
      return;
    }

    const confirmed = window.confirm(
      `Resend the initial login invitation to ${member.email}?`,
    );

    if (!confirmed) return;

    setActionLoading(`${member.id}-resend`);

    try {
      const result = await apiRequest<{
        invitationSent: boolean;
        message: string;
      }>(`/staff/${member.id}/resend-invitation`, {
        method: "POST",
      });

      showToast(
        result.invitationSent ? "success" : "error",
        result.message,
      );

      await fetchStaff();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to resend the invitation.";

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
              {filteredStaff.length === 1 ? "" : "s"} shown
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
          <table className="w-full min-w-[1150px] text-left text-sm">
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
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading staff...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
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
                      <div className="flex flex-wrap items-center gap-2">
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

                        {member.isActive && member.mustChangePassword && (
                          <button
                            type="button"
                            disabled={
                              actionLoading === `${member.id}-resend`
                            }
                            onClick={() =>
                              void handleResendInvitation(member)
                            }
                            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionLoading === `${member.id}-resend`
                              ? "Sending..."
                              : "Resend invitation"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && hasMore && (
          <div className="flex justify-center border-t border-slate-100 p-4">
            <button
              type="button"
              disabled={loadingMore}
              onClick={() => void loadMoreStaff()}
              className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more staff"}
            </button>
          </div>
        )}
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
                    maxLength={50}
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
                    maxLength={50}
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
                  maxLength={254}
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
                  maxLength={20}
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



