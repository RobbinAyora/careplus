
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

type UserStatus = boolean;

interface HospitalAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role?: string;
  isActive?: UserStatus;
  createdAt?: string;
}

interface Hospital {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  users?: HospitalAdmin[];
}

interface AdministratorRecord extends HospitalAdmin {
  hospitalId: string;
  hospitalName: string;
  hospitalStatus: Hospital["status"];
}

interface AdminForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

const EMPTY_FORM: AdminForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

async function readResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text };
  }
}

function getErrorMessage(data: unknown): string {
  if (data && typeof data === "object" && "message" in data) {
    const message = data.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Something went wrong. Please try again.";
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function HospitalBadge({
  status,
}: {
  status: Hospital["status"];
}) {
  const styles: Record<Hospital["status"], string> = {
    ACTIVE: "bg-green-50 text-green-700",
    INACTIVE: "bg-slate-100 text-slate-600",
    SUSPENDED: "bg-red-50 text-red-700",
  };

  const labels: Record<Hospital["status"], string> = {
    ACTIVE: "Active hospital",
    INACTIVE: "Inactive hospital",
    SUSPENDED: "Suspended hospital",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function AdministratorsPage() {
  const { accessToken, isSessionLoaded } = useAuth();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);

  const [selectedAdmin, setSelectedAdmin] =
    useState<AdministratorRecord | null>(null);

  const [adminToChange, setAdminToChange] =
    useState<AdministratorRecord | null>(null);

  const [form, setForm] = useState<AdminForm>(EMPTY_FORM);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");

  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  // LOAD HOSPITALS AND THEIR ADMINISTRATORS
  const fetchHospitals = useCallback(async () => {
    if (!API_URL || !accessToken) {
      setLoading(false);
      setError(
        !API_URL
          ? "API URL is not configured."
          : "Please sign in."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/hospitals`, {
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
        throw new Error("Unexpected hospital data received.");
      }

      setHospitals(data as Hospital[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load administrators."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isSessionLoaded) {
      void fetchHospitals();
    }
  }, [isSessionLoaded, fetchHospitals]);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  // CONVERT HOSPITAL USERS INTO ADMINISTRATOR RECORDS
  const administrators = useMemo<AdministratorRecord[]>(() => {
    return hospitals.flatMap((hospital) => {
      const users = hospital.users ?? [];

      return users.map((user) => ({
        ...user,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        hospitalStatus: hospital.status,
      }));
    });
  }, [hospitals]);

  // STATISTICS
  const statistics = useMemo(() => ({
    total: administrators.length,

    active: administrators.filter(
      (admin) => admin.isActive !== false
    ).length,

    inactive: administrators.filter(
      (admin) => admin.isActive === false
    ).length,

    hospitals: new Set(
      administrators.map((admin) => admin.hospitalId)
    ).size,
  }), [administrators]);

  // SEARCH AND FILTER
  const filteredAdministrators = useMemo(() => {
    const query = search.trim().toLowerCase();

    return administrators.filter((admin) => {
      const matchesSearch =
        !query ||
        `${admin.firstName} ${admin.lastName}`
          .toLowerCase()
          .includes(query) ||
        admin.email.toLowerCase().includes(query) ||
        (admin.phone ?? "").toLowerCase().includes(query) ||
        admin.hospitalName.toLowerCase().includes(query);

      const matchesHospital =
        hospitalFilter === "ALL" ||
        admin.hospitalId === hospitalFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && admin.isActive !== false) ||
        (statusFilter === "INACTIVE" && admin.isActive === false);

      return (
        matchesSearch &&
        matchesHospital &&
        matchesStatus
      );
    });
  }, [
    administrators,
    search,
    hospitalFilter,
    statusFilter,
  ]);

  // FORM FIELD UPDATE
  function updateField<K extends keyof AdminForm>(
    field: K,
    value: AdminForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // REGISTER ADMINISTRATOR
  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setFormError("");

    if (!API_URL || !accessToken) {
      setFormError("Your session or API configuration is missing.");
      return;
    }

    if (!selectedHospitalId) {
      setFormError("Please select a hospital.");
      return;
    }

    const selectedHospital = hospitals.find(
      (hospital) => hospital.id === selectedHospitalId
    );

    if (!selectedHospital) {
      setFormError("The selected hospital could not be found.");
      return;
    }

    if (selectedHospital.status !== "ACTIVE") {
      setFormError(
        "You can only register administrators under active hospitals."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/hospitals/${selectedHospitalId}/admins`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim().toLowerCase(),
            phone: form.phone.trim() || undefined,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      setForm(EMPTY_FORM);
      setSelectedHospitalId("");
      setModalOpen(false);

      setToast("Administrator registered successfully.");

      await fetchHospitals();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to register administrator."
      );
    } finally {
      setSaving(false);
    }
  }

  // SUSPEND OR ACTIVATE ADMINISTRATOR
  async function handleAdminStatusChange() {
    if (!API_URL || !accessToken || !adminToChange) {
      setToast("Your session or API configuration is missing.");
      return;
    }

    const admin = adminToChange;
    const newStatus = admin.isActive === false;

    setChangingStatus(true);

    try {
      const response = await fetch(
        `${API_URL}/hospitals/${admin.hospitalId}/admins/${admin.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            isActive: newStatus,
          }),
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(getErrorMessage(data));
      }

      // Update the selected administrator immediately.
      setSelectedAdmin((current) =>
        current?.id === admin.id
          ? { ...current, isActive: newStatus }
          : current
      );

      setAdminToChange(null);

      setToast(
        newStatus
          ? "Administrator activated successfully."
          : "Administrator suspended successfully."
      );

      // Reload the latest records and statistics.
      await fetchHospitals();
    } catch (err) {
      setToast(
        err instanceof Error
          ? err.message
          : "Unable to update administrator status."
      );
    } finally {
      setChangingStatus(false);
    }
  }

  const activeHospitals = hospitals.filter(
    (hospital) => hospital.status === "ACTIVE"
  );

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 xl:px-8">

      {/* SUCCESS MESSAGE */}
      {toast && (
        <div
          role="status"
          className="fixed right-5 top-5 z-[100] rounded-xl border border-green-200 bg-white px-5 py-4 text-sm font-medium text-green-700 shadow-lg"
        >
          {toast}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#2d91e8]">
            System administration
          </p>

          <h1 className="text-2xl font-bold text-[#102f5f] sm:text-3xl">
            Administrators
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage hospital administrators across the CarePlus network.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm(EMPTY_FORM);
            setFormError("");
            setSelectedHospitalId("");
            setModalOpen(true);
          }}
          className="rounded-xl bg-[#2d91e8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#197dcc]"
        >
          + Add Administrator
        </button>
      </div>

      {/* STATISTICS */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Administrators"
          value={statistics.total}
          description="Registered hospital admins"
        />

        <StatCard
          title="Active Accounts"
          value={statistics.active}
          description="Accounts not marked inactive"
        />

        <StatCard
          title="Inactive Accounts"
          value={statistics.inactive}
          description="Accounts marked inactive"
        />

        <StatCard
          title="Hospitals With Admins"
          value={statistics.hospitals}
          description="Hospitals with administrators"
        />
      </section>

      {/* ADMINISTRATOR DIRECTORY */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">

        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-bold text-[#102f5f]">
              Administrator Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredAdministrators.length} administrator
              {filteredAdministrators.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search administrators..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2d91e8] sm:w-56"
            />

            <select
              value={hospitalFilter}
              onChange={(event) =>
                setHospitalFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#2d91e8]"
            >
              <option value="ALL">All hospitals</option>

              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#2d91e8]"
            >
              <option value="ALL">All account statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <button
              type="button"
              onClick={() => void fetchHospitals()}
              disabled={loading}
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Administrator
                </th>

                <th className="px-5 py-4 font-semibold">
                  Hospital
                </th>

                <th className="px-5 py-4 font-semibold">
                  Phone
                </th>

                <th className="px-5 py-4 font-semibold">
                  Account status
                </th>

                <th className="px-5 py-4 font-semibold">
                  Date registered
                </th>

                <th className="px-5 py-4 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    Loading administrators...
                  </td>
                </tr>
              ) : filteredAdministrators.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    {administrators.length === 0
                      ? "No hospital administrators were found."
                      : "No administrators match your search."}
                  </td>
                </tr>
              ) : (
                filteredAdministrators.map((admin) => (
                  <tr
                    key={admin.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#102f5f]">
                        {admin.firstName} {admin.lastName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {admin.email}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">
                        {admin.hospitalName}
                      </p>

                      <div className="mt-1">
                        <HospitalBadge
                          status={admin.hospitalStatus}
                        />
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {admin.phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          admin.isActive === false
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {admin.isActive === false
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(admin.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAdmin(admin)}
                          className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-semibold text-[#197dcc] transition hover:bg-blue-50"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => setAdminToChange(admin)}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                            admin.isActive === false
                              ? "border-green-200 text-green-700 hover:bg-green-50"
                              : "border-red-200 text-red-700 hover:bg-red-50"
                          }`}
                        >
                          {admin.isActive === false
                            ? "Activate"
                            : "Suspend"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* REGISTER ADMINISTRATOR MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-admin-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="register-admin-title"
                  className="text-xl font-bold text-[#102f5f]"
                >
                  Register Administrator
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Assign a new administrator to a hospital.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleRegister}
              className="space-y-5 p-6"
            >
              <FormField label="Select hospital">
                <select
                  required
                  value={selectedHospitalId}
                  onChange={(event) =>
                    setSelectedHospitalId(event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">
                    Choose a hospital
                  </option>

                  {activeHospitals.map((hospital) => (
                    <option
                      key={hospital.id}
                      value={hospital.id}
                    >
                      {hospital.name}
                    </option>
                  ))}
                </select>

                {activeHospitals.length === 0 && (
                  <p className="mt-2 text-xs text-red-600">
                    There are no active hospitals available for registration.
                  </p>
                )}
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="First name">
                  <input
                    required
                    maxLength={50}
                    value={form.firstName}
                    onChange={(event) =>
                      updateField("firstName", event.target.value)
                    }
                    placeholder="First name"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Last name">
                  <input
                    required
                    maxLength={50}
                    value={form.lastName}
                    onChange={(event) =>
                      updateField("lastName", event.target.value)
                    }
                    placeholder="Last name"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Email address">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  placeholder="administrator@hospital.com"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Phone number (optional)">
                <input
                  type="tel"
                  maxLength={20}
                  value={form.phone}
                  onChange={(event) =>
                    updateField("phone", event.target.value)
                  }
                  placeholder="+254..."
                  className={inputClass}
                />
              </FormField>

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
                  disabled={saving || activeHospitals.length === 0}
                  className="rounded-lg bg-[#2d91e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#197dcc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Registering..."
                    : "Register Administrator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMINISTRATOR DETAILS MODAL */}
      {selectedAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-details-title"
            className="w-full max-w-xl rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="admin-details-title"
                  className="text-xl font-bold text-[#102f5f]"
                >
                  Administrator Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Account information and hospital assignment.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedAdmin(null)}
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <DetailItem
                label="First name"
                value={selectedAdmin.firstName}
              />

              <DetailItem
                label="Last name"
                value={selectedAdmin.lastName}
              />

              <DetailItem
                label="Email"
                value={selectedAdmin.email}
              />

              <DetailItem
                label="Phone"
                value={selectedAdmin.phone || "Not provided"}
              />

              <DetailItem
                label="Hospital"
                value={selectedAdmin.hospitalName}
              />

              <DetailItem
                label="Date registered"
                value={formatDate(selectedAdmin.createdAt)}
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Account status
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${
                    selectedAdmin.isActive === false
                      ? "text-red-600"
                      : "text-green-700"
                  }`}
                >
                  {selectedAdmin.isActive === false
                    ? "Inactive"
                    : "Active"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Hospital status
                </p>

                <div className="mt-2">
                  <HospitalBadge
                    status={selectedAdmin.hospitalStatus}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setAdminToChange(selectedAdmin);
                }}
                className={`rounded-lg border px-4 py-2.5 text-sm font-semibold ${
                  selectedAdmin.isActive === false
                    ? "border-green-200 text-green-700 hover:bg-green-50"
                    : "border-red-200 text-red-700 hover:bg-red-50"
                }`}
              >
                {selectedAdmin.isActive === false
                  ? "Activate administrator"
                  : "Suspend administrator"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedAdmin(null)}
                className="rounded-lg bg-[#2d91e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#197dcc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUSPEND / ACTIVATE CONFIRMATION */}
      {adminToChange && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-status-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              {adminToChange.isActive === false ? "✓" : "!"}
            </div>

            <h2
              id="admin-status-title"
              className="text-xl font-bold text-[#102f5f]"
            >
              {adminToChange.isActive === false
                ? "Activate administrator?"
                : "Suspend administrator?"}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {adminToChange.isActive === false
                ? `You are about to reactivate ${adminToChange.firstName} ${adminToChange.lastName}. They will be able to access their account again, provided their hospital is active.`
                : `You are about to suspend ${adminToChange.firstName} ${adminToChange.lastName}. Their account will be marked inactive.`}
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-[#102f5f]">
                {adminToChange.firstName} {adminToChange.lastName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {adminToChange.email}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {adminToChange.hospitalName}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={changingStatus}
                onClick={() => setAdminToChange(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={changingStatus}
                onClick={() => void handleAdminStatusChange()}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                  adminToChange.isActive === false
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {changingStatus
                  ? "Updating..."
                  : adminToChange.isActive === false
                    ? "Yes, activate"
                    : "Yes, suspend"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// REUSABLE COMPONENTS

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-bold text-[#102f5f]">
        {value}
      </p>

      <p className="mt-3 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

