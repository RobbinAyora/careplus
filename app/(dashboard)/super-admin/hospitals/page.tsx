
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { useAuth } from "@/lib/auth/session";
import { useApiClient } from "@/lib/api/client";

type HospitalStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

interface Hospital {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  status: HospitalStatus;
  createdAt: string;
}

interface HospitalForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

const EMPTY_FORM: HospitalForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "Kenya",
};

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

function StatusBadge({ status }: { status: HospitalStatus }) {
  const styles: Record<HospitalStatus, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    INACTIVE: "bg-slate-100 text-slate-600",
    SUSPENDED: "bg-red-50 text-red-700",
  };

  const labels: Record<HospitalStatus, string> = {
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    SUSPENDED: "Suspended",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export default function HospitalsPage() {
  const { accessToken, isSessionLoaded } = useAuth();
  const apiRequest = useApiClient();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [detailsHospital, setDetailsHospital] =
    useState<Hospital | null>(null);

  const [hospitalToChange, setHospitalToChange] =
    useState<Hospital | null>(null);

  const [form, setForm] = useState<HospitalForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [saving, setSaving] = useState(false);
  const [updatingHospitalId, setUpdatingHospitalId] =
    useState<string | null>(null);

  const [toast, setToast] = useState("");

  // FETCH HOSPITALS
  const fetchHospitals = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setError("Please sign in.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest<unknown>("/hospitals");

      if (!Array.isArray(data)) {
        throw new Error("Unexpected hospital list received.");
      }

      setHospitals(data as Hospital[]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load hospitals."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiRequest]);

  useEffect(() => {
    if (isSessionLoaded) {
      void fetchHospitals();
    }
  }, [isSessionLoaded, fetchHospitals]);

  // TOAST AUTO DISMISS
  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast("");
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  // STATISTICS
  const statistics = useMemo(
    () => ({
      total: hospitals.length,

      active: hospitals.filter(
        (hospital) => hospital.status === "ACTIVE"
      ).length,

      suspended: hospitals.filter(
        (hospital) => hospital.status === "SUSPENDED"
      ).length,

      inactive: hospitals.filter(
        (hospital) => hospital.status === "INACTIVE"
      ).length,
    }),
    [hospitals]
  );

  // SEARCH AND FILTER
  const filteredHospitals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return hospitals.filter((hospital) => {
      const matchesSearch =
        !query ||
        hospital.name.toLowerCase().includes(query) ||
        hospital.email.toLowerCase().includes(query) ||
        (hospital.city ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        hospital.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [hospitals, search, statusFilter]);

  // FORM FIELD UPDATE
  function updateField<K extends keyof HospitalForm>(
    field: K,
    value: HospitalForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // REGISTER HOSPITAL
  async function handleRegister(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setFormError("");

    if (!accessToken) {
      setFormError("Your session has expired. Please sign in again.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      country: form.country.trim() || "Kenya",
    };

    if (!payload.name || !payload.email) {
      setFormError("Hospital name and email are required.");
      return;
    }

    setSaving(true);

    try {
      // useApiClient automatically attaches an Idempotency-Key.
      await apiRequest<unknown>("/hospitals", {
        method: "POST",
        body: payload,
      });

      setForm(EMPTY_FORM);
      setModalOpen(false);

      setToast("Hospital registered successfully.");

      await fetchHospitals();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to register hospital."
      );
    } finally {
      setSaving(false);
    }
  }

  // SUSPEND OR REACTIVATE HOSPITAL
  async function handleHospitalStatusChange() {
    if (!accessToken || !hospitalToChange) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    if (updatingHospitalId) return;

    const hospital = hospitalToChange;

    const newStatus: HospitalStatus =
      hospital.status === "ACTIVE"
        ? "SUSPENDED"
        : "ACTIVE";

    setUpdatingHospitalId(hospital.id);
    setError("");

    try {
      await apiRequest<unknown>(
        `/hospitals/${hospital.id}/status`,
        {
          method: "PATCH",
          body: {
            status: newStatus,
          },
        }
      );

      // Update the directory immediately.
      setHospitals((current) =>
        current.map((item) =>
          item.id === hospital.id
            ? { ...item, status: newStatus }
            : item
        )
      );

      // Keep the details modal updated.
      setDetailsHospital((current) =>
        current?.id === hospital.id
          ? { ...current, status: newStatus }
          : current
      );

      setToast(
        newStatus === "SUSPENDED"
          ? `${hospital.name} has been suspended.`
          : `${hospital.name} has been reactivated.`
      );

      setHospitalToChange(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update hospital status."
      );
    } finally {
      setUpdatingHospitalId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 xl:px-8">

      {/* SUCCESS TOAST */}
      {toast && (
        <div
          role="status"
          className="fixed right-5 top-5 z-[100] rounded-xl border border-green-200 bg-white px-5 py-4 text-sm font-medium text-green-700 shadow-lg"
        >
          ✓ {toast}
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#2d91e8]">
            System administration
          </p>

          <h1 className="text-2xl font-bold text-[#102f5f] sm:text-3xl">
            Hospital Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Register, review and manage hospitals on the CarePlus network.
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
          + Add Hospital
        </button>
      </div>

      {/* STATISTICS */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Hospitals"
          value={statistics.total}
          description="Registered hospitals"
        />

        <StatCard
          title="Active Hospitals"
          value={statistics.active}
          description="Currently active"
        />

        <StatCard
          title="Suspended Hospitals"
          value={statistics.suspended}
          description="Currently suspended"
        />

        <StatCard
          title="Inactive Hospitals"
          value={statistics.inactive}
          description="Currently inactive"
        />
      </section>

      {/* HOSPITAL DIRECTORY */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">

        {/* SEARCH AND FILTER */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-[#102f5f]">
              Hospital Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredHospitals.length} hospital
              {filteredHospitals.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or city..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2d91e8] sm:w-64"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-[#2d91e8]"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
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

        {/* ERROR MESSAGE */}
        {error && (
          <div
            role="alert"
            className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}

            <button
              type="button"
              onClick={() => void fetchHospitals()}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* HOSPITAL TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">
                  Hospital
                </th>

                <th className="px-5 py-4 font-semibold">
                  Location
                </th>

                <th className="px-5 py-4 font-semibold">
                  Phone
                </th>

                <th className="px-5 py-4 font-semibold">
                  Status
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
                    Loading hospitals...
                  </td>
                </tr>
              ) : filteredHospitals.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    {hospitals.length === 0
                      ? "No hospitals registered yet."
                      : "No hospitals match your search."}
                  </td>
                </tr>
              ) : (
                filteredHospitals.map((hospital) => (
                  <tr
                    key={hospital.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#102f5f]">
                        {hospital.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {hospital.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {[
                        hospital.city,
                        hospital.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {hospital.phone || "—"}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={hospital.status} />
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(hospital.createdAt)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setDetailsHospital(hospital)
                          }
                          className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-semibold text-[#197dcc] transition hover:bg-blue-50"
                        >
                          View details
                        </button>

                        <button
                          type="button"
                          disabled={updatingHospitalId !== null}
                          onClick={() =>
                            setHospitalToChange(hospital)
                          }
                          className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            hospital.status === "ACTIVE"
                              ? "border border-red-200 text-red-600 hover:bg-red-50"
                              : "border border-green-200 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {hospital.status === "ACTIVE"
                            ? "Suspend"
                            : "Reactivate"}
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

      {/* REGISTER HOSPITAL MODAL */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setModalOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="register-title"
                  className="text-xl font-bold text-[#102f5f]"
                >
                  Register Hospital
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new hospital to the CarePlus network.
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
              <FormField label="Hospital name">
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  placeholder="e.g. Nairobi Medical Centre"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Hospital email">
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  placeholder="info@hospital.com"
                  className={inputClass}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Phone number">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      updateField("phone", event.target.value)
                    }
                    placeholder="+254..."
                    className={inputClass}
                  />
                </FormField>

                <FormField label="City">
                  <input
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    placeholder="Nairobi"
                    className={inputClass}
                  />
                </FormField>
              </div>

              <FormField label="Physical address">
                <input
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  placeholder="Street, building or area"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Country">
                <input
                  value={form.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
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
                  disabled={saving}
                  className="rounded-lg bg-[#2d91e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#197dcc] disabled:opacity-60"
                >
                  {saving
                    ? "Registering..."
                    : "Register Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HOSPITAL DETAILS MODAL */}
      {detailsHospital && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailsHospital(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="details-title"
                  className="text-xl font-bold text-[#102f5f]"
                >
                  Hospital Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Registered hospital information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailsHospital(null)}
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <DetailItem
                label="Hospital name"
                value={detailsHospital.name}
              />

              <DetailItem
                label="Email"
                value={detailsHospital.email}
              />

              <DetailItem
                label="Phone"
                value={detailsHospital.phone || "Not provided"}
              />

              <DetailItem
                label="City"
                value={detailsHospital.city || "Not provided"}
              />

              <DetailItem
                label="Country"
                value={detailsHospital.country}
              />

              <DetailItem
                label="Physical address"
                value={
                  detailsHospital.address || "Not provided"
                }
              />

              <DetailItem
                label="Date registered"
                value={formatDate(detailsHospital.createdAt)}
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Status
                </p>

                <div className="mt-2">
                  <StatusBadge
                    status={detailsHospital.status}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                disabled={updatingHospitalId !== null}
                onClick={() =>
                  setHospitalToChange(detailsHospital)
                }
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${
                  detailsHospital.status === "ACTIVE"
                    ? "border border-red-200 text-red-600 hover:bg-red-50"
                    : "border border-green-200 text-green-700 hover:bg-green-50"
                }`}
              >
                {detailsHospital.status === "ACTIVE"
                  ? "Suspend Hospital"
                  : "Reactivate Hospital"}
              </button>

              <button
                type="button"
                onClick={() => setDetailsHospital(null)}
                className="rounded-lg bg-[#2d91e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#197dcc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HOSPITAL STATUS CONFIRMATION POPUP */}
      {hospitalToChange && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !updatingHospitalId
            ) {
              setHospitalToChange(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="hospital-status-title"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
          >
            {/* POPUP HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#2d91e8]">
                  Hospital management
                </p>

                <h2
                  id="hospital-status-title"
                  className="mt-1 text-xl font-bold text-[#102f5f]"
                >
                  {hospitalToChange.status === "ACTIVE"
                    ? "Suspend hospital?"
                    : "Reactivate hospital?"}
                </h2>
              </div>

              <button
                type="button"
                disabled={updatingHospitalId !== null}
                onClick={() => setHospitalToChange(null)}
                className="rounded-lg px-3 py-2 text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* POPUP CONTENT */}
            <div className="p-6">
              <div
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                  hospitalToChange.status === "ACTIVE"
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {hospitalToChange.status === "ACTIVE" ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4v18" />
                    <path d="M19 21V11l-6-4" />
                    <path d="M9 9v.01" />
                    <path d="M9 12v.01" />
                    <path d="M9 15v.01" />
                    <path d="M9 18v.01" />
                    <path d="M16 14v.01" />
                    <path d="M16 17v.01" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V7l8-4v18" />
                    <path d="M19 21V11l-6-4" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                )}
              </div>

              <p className="text-sm leading-6 text-slate-600">
                {hospitalToChange.status === "ACTIVE"
                  ? "You are about to suspend this hospital. Its administrators and other users will no longer be able to access the hospital system while the hospital is suspended."
                  : "You are about to reactivate this hospital. Users whose individual accounts are still active will be able to access the hospital system again."}
              </p>

              {/* HOSPITAL INFORMATION */}
              <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <p className="font-bold text-[#102f5f]">
                  {hospitalToChange.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {hospitalToChange.email}
                </p>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Current status
                  </span>

                  <StatusBadge status={hospitalToChange.status} />
                </div>
              </div>

              {/* CONFIRMATION ACTIONS */}
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={updatingHospitalId !== null}
                  onClick={() => setHospitalToChange(null)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={updatingHospitalId !== null}
                  onClick={() => void handleHospitalStatusChange()}
                  className={`rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    hospitalToChange.status === "ACTIVE"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {updatingHospitalId === hospitalToChange.id
                    ? "Updating..."
                    : hospitalToChange.status === "ACTIVE"
                      ? "Yes, suspend hospital"
                      : "Yes, reactivate hospital"}
                </button>
              </div>
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
  children: ReactNode;
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
