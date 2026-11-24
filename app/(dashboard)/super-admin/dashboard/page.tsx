
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


type HospitalStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

interface HospitalAdmin {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

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
  users: HospitalAdmin[];
}

interface HospitalForm {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

type ToastType = "success" | "error";

interface ToastMessage {
  type: ToastType;
  message: string;
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
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

function statusLabel(status: HospitalStatus) {
  switch (status) {
    case "ACTIVE":
      return "Active";
    case "SUSPENDED":
      return "Suspended";
    case "INACTIVE":
      return "Inactive";
  }
}

function StatusBadge({ status }: { status: HospitalStatus }) {
  const styles: Record<HospitalStatus, string> = {
    ACTIVE: "bg-green-50 text-green-700",
    SUSPENDED: "bg-red-50 text-red-700",
    INACTIVE: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {statusLabel(status)}
    </span>
  );
}

function getHospitalAdmins(hospital: Hospital): HospitalAdmin[] {
  return Array.isArray(hospital.users) ? hospital.users : [];
}

export default function SuperAdminPage() {
  const { accessToken, isSessionLoaded } = useAuth();
  const apiRequest = useApiClient();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] =
    useState<Hospital | null>(null);

  const [form, setForm] = useState<HospitalForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      setToast({ type, message });
    },
    []
  );

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  // Fetch hospitals from the backend.
  const fetchHospitals = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setError("Please sign in to view hospitals.");
      return false;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest<unknown>("/hospitals");

      if (!Array.isArray(data)) {
        throw new Error("The server returned an unexpected hospital list.");
      }

      setHospitals(data as Hospital[]);
      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load hospitals.";

      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiRequest]);

  useEffect(() => {
    if (isSessionLoaded) {
      void fetchHospitals();
    }
  }, [isSessionLoaded, fetchHospitals]);

  // Calculate dashboard statistics from actual hospital records.
  const statistics = useMemo(() => {
    const totalHospitals = hospitals.length;

    const activeHospitals = hospitals.filter(
      (hospital) => hospital.status === "ACTIVE"
    ).length;

    const suspendedHospitals = hospitals.filter(
      (hospital) => hospital.status === "SUSPENDED"
    ).length;

    const inactiveHospitals = hospitals.filter(
      (hospital) => hospital.status === "INACTIVE"
    ).length;

    const allAdmins = hospitals.flatMap(getHospitalAdmins);

    return {
      totalHospitals,
      activeHospitals,
      suspendedHospitals,
      inactiveHospitals,
      totalAdmins: allAdmins.length,
      activeAdmins: allAdmins.filter((admin) => admin.isActive).length,
    };
  }, [hospitals]);

  // Search and filter hospitals.
  const filteredHospitals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return hospitals.filter((hospital) => {
      const matchesSearch =
        !query ||
        hospital.name.toLowerCase().includes(query) ||
        hospital.email.toLowerCase().includes(query) ||
        (hospital.city ?? "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" || hospital.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [hospitals, search, statusFilter]);

  function updateField<K extends keyof HospitalForm>(
    field: K,
    value: HospitalForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  // Register a hospital.
  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!accessToken) {
      setFormError("Your session or API configuration is missing.");
      return;
    }

    setSaving(true);

    try {
      await apiRequest<unknown>("/hospitals", {
        method: "POST",
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          country: form.country.trim() || "Kenya",
        },
      });

      setForm(EMPTY_FORM);
      setModalOpen(false);

      showToast("success", "Hospital registered successfully.");

      await fetchHospitals();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to register hospital.";

      setFormError(message);
      showToast("error", message);
    } finally {
      setSaving(false);
    }
  }

  function openHospitalDetails(hospital: Hospital) {
    setSelectedHospital(hospital);
    setDetailsOpen(true);
  }

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 xl:px-8">

      {/* Toast notification */}
      {toast && (
        <div
          role="alert"
          className={`fixed right-5 top-5 z-[100] flex max-w-sm items-start gap-3 rounded-xl border bg-white px-5 py-4 shadow-lg ${
            toast.type === "success"
              ? "border-green-200 text-green-800"
              : "border-red-200 text-red-800"
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
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[#2d91e8]">
            System administration
          </p>

          <h1 className="text-2xl font-bold text-[#102f5f] sm:text-3xl">
            Super Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor hospitals and manage your CarePlus HMS network.
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
          + Register Hospital
        </button>
      </div>

      {/* Statistics */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Hospitals"
          value={statistics.totalHospitals}
          description="Registered hospitals"
          icon="H"
          iconStyle="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Active Hospitals"
          value={statistics.activeHospitals}
          description="Currently active"
          icon="✓"
          iconStyle="bg-green-50 text-green-700"
        />

        <StatCard
          title="Suspended Hospitals"
          value={statistics.suspendedHospitals}
          description="Currently suspended"
          icon="!"
          iconStyle="bg-red-50 text-red-700"
        />

        <StatCard
          title="Hospital Administrators"
          value={statistics.totalAdmins}
          description={`${statistics.activeAdmins} active accounts`}
          icon="A"
          iconStyle="bg-violet-50 text-violet-700"
        />
      </section>

      {/* Additional overview */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Inactive hospitals</p>
          <p className="mt-2 text-2xl font-bold text-slate-700">
            {statistics.inactiveHospitals}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total active administrators</p>
          <p className="mt-2 text-2xl font-bold text-[#102f5f]">
            {statistics.activeAdmins}
          </p>
        </div>
      </section>

      {/* Hospital directory */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
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
              placeholder="Search hospital, email or city..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-[#2d91e8] sm:w-64"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
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
              className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
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

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Hospital</th>
                <th className="px-5 py-4 font-semibold">Location</th>
                <th className="px-5 py-4 font-semibold">Administrators</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Date registered</th>
                <th className="px-5 py-4 font-semibold">Action</th>
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
                      ? "No hospitals have been registered yet."
                      : "No hospitals match your search."}
                  </td>
                </tr>
              ) : (
                filteredHospitals.map((hospital) => {
                  const admins = getHospitalAdmins(hospital);

                  return (
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
                        {[hospital.city, hospital.country]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {admins.length}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={hospital.status} />
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(hospital.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => openHospitalDetails(hospital)}
                          className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-semibold text-[#197dcc] transition hover:bg-blue-50"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Hospital registration modal */}
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
                aria-label="Close registration form"
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Hospital name
                </label>

                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  placeholder="e.g. Nairobi Medical Centre"
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Hospital email
                </label>

                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField("email", event.target.value)
                  }
                  placeholder="info@hospital.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    placeholder="+254..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    City
                  </label>

                  <input
                    value={form.city}
                    onChange={(event) =>
                      updateField("city", event.target.value)
                    }
                    placeholder="Nairobi"
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Physical address
                </label>

                <input
                  value={form.address}
                  onChange={(event) =>
                    updateField("address", event.target.value)
                  }
                  placeholder="Street, building or area"
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Country
                </label>

                <input
                  value={form.country}
                  onChange={(event) =>
                    updateField("country", event.target.value)
                  }
                  placeholder="Kenya"
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-[#2d91e8]"
                />
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
                  className="rounded-lg bg-[#2d91e8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#197dcc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Registering..." : "Register Hospital"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hospital details modal */}
      {detailsOpen && selectedHospital && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setDetailsOpen(false);
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
                  Hospital information and administrator accounts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                aria-label="Close hospital details"
                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-lg font-bold text-[#102f5f]">
                    {selectedHospital.name}
                  </h3>

                  <StatusBadge status={selectedHospital.status} />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Email address"
                    value={selectedHospital.email}
                  />

                  <DetailItem
                    label="Phone number"
                    value={selectedHospital.phone || "Not provided"}
                  />

                  <DetailItem
                    label="City"
                    value={selectedHospital.city || "Not provided"}
                  />

                  <DetailItem
                    label="Country"
                    value={selectedHospital.country}
                  />

                  <DetailItem
                    label="Physical address"
                    value={selectedHospital.address || "Not provided"}
                  />

                  <DetailItem
                    label="Date registered"
                    value={formatDate(selectedHospital.createdAt)}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-[#102f5f]">
                    Hospital Administrators
                  </h3>

                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {getHospitalAdmins(selectedHospital).length} account(s)
                  </span>
                </div>

                {getHospitalAdmins(selectedHospital).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                    <p className="text-sm text-slate-500">
                      No hospital administrators have been enrolled yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getHospitalAdmins(selectedHospital).map((admin) => (
                      <div
                        key={admin.id}
                        className="flex flex-col justify-between gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="font-semibold text-[#102f5f]">
                            {admin.firstName} {admin.lastName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {admin.email}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {admin.phone || "No phone number"}
                          </p>
                        </div>

                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            admin.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {admin.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="rounded-lg bg-[#2d91e8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#197dcc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  iconStyle,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
  iconStyle: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-3 text-3xl font-bold text-[#102f5f]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold ${iconStyle}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500">{description}</p>
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
