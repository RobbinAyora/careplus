
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AvailabilityStatus = "AVAILABLE" | "ON_BREAK" | "OFF_DUTY";

interface Department {
  id: string;
  name: string;
  isActive: boolean;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  doctorProfile?: {
    id: string;
    department?: string | null;
    departmentId?: string | null;
    departmentRef?: {
      id: string;
      name: string;
      isActive: boolean;
    } | null;
    availabilityStatus: AvailabilityStatus;
    maxPatients: number;
  } | null;
  waitingPatients?: number;
  patientsInConsultation?: number;
  currentWorkload?: number;
  remainingCapacity?: number;
}

interface ApiError {
  message?: string | string[];
}

function getErrorMessage(data: ApiError, fallback: string) {
  if (Array.isArray(data.message)) {
    return data.message.join(", ");
  }

  return data.message || fallback;
}

export default function DoctorsPage() {
  const { accessToken, isSessionLoaded } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [maxPatients, setMaxPatients] = useState("5");

  const apiRequest = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      if (!API_URL) {
        throw new Error(
          "NEXT_PUBLIC_API_URL is not configured in your frontend environment."
        );
      }

      if (!accessToken) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data as ApiError, "Something went wrong.")
        );
      }

      return data;
    },
    [accessToken]
  );

  const loadData = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    try {
      const [doctorsData, departmentsData] = await Promise.all([
        apiRequest("/doctors"),
        apiRequest("/departments"),
      ]);

      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      setDepartments(
        Array.isArray(departmentsData) ? departmentsData : []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load doctors."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiRequest]);

  useEffect(() => {
    if (isSessionLoaded && accessToken) {
      void loadData();
    }
  }, [isSessionLoaded, accessToken, loadData]);

  const doctorsWithoutProfiles = useMemo(
    () => doctors.filter((doctor) => !doctor.doctorProfile),
    [doctors]
  );

  const doctorsWithProfiles = useMemo(
    () => doctors.filter((doctor) => doctor.doctorProfile),
    [doctors]
  );

  const filteredDoctors = useMemo(() => {
    return doctorsWithProfiles.filter((doctor) => {
      const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch =
        fullName.includes(query) ||
        doctor.email.toLowerCase().includes(query) ||
        (doctor.phone || "").includes(query);

      const departmentName =
        doctor.doctorProfile?.departmentRef?.name ||
        doctor.doctorProfile?.department ||
        "Unassigned";

      const matchesDepartment =
        departmentFilter === "ALL" ||
        departmentName === departmentFilter;

      return matchesSearch && matchesDepartment;
    });
  }, [doctorsWithProfiles, search, departmentFilter]);

  const openAddModal = () => {
    setSelectedDoctorId("");
    setSelectedDepartmentId("");
    setMaxPatients("5");
    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  const handleAddDoctor = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDoctorId || !selectedDepartmentId) {
      setError("Please select a doctor and a department.");
      return;
    }

    const capacity = Number(maxPatients);

    if (!Number.isInteger(capacity) || capacity < 1) {
      setError("Maximum patients must be a whole number greater than zero.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiRequest(`/doctors/${selectedDoctorId}/profile`, {
        method: "POST",
        body: JSON.stringify({
          departmentId: selectedDepartmentId,
          maxPatients: capacity,
        }),
      });

      setShowAddModal(false);
      setSuccess("Doctor profile created successfully.");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create doctor profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const getAvailabilityStyle = (status?: AvailabilityStatus) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-50 text-green-700";

      case "ON_BREAK":
        return "bg-amber-50 text-amber-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const formatAvailability = (status?: AvailabilityStatus) => {
    if (!status) return "Not set";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  if (!isSessionLoaded || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-sm font-medium text-slate-500">
          Loading doctors...
        </div>
      </div>
    );
  }

  const availableDoctors = doctorsWithProfiles.filter(
    (doctor) => doctor.doctorProfile?.availabilityStatus === "AVAILABLE"
  ).length;

  return (
    <div className="space-y-6 pb-10">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            HOSPITAL MANAGEMENT
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Doctors
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage doctors, departments and patient capacity.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Add Doctor
        </button>
      </div>

      {/* Notifications */}
      {error && !showAddModal && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Doctors"
          value={doctors.length}
          description="Enrolled doctor accounts"
        />

        <StatCard
          label="Profiles Completed"
          value={doctorsWithProfiles.length}
          description="Doctors assigned to departments"
        />

        <StatCard
          label="Available Doctors"
          value={availableDoctors}
          description="Currently available for patients"
        />

        <StatCard
          label="Awaiting Setup"
          value={doctorsWithoutProfiles.length}
          description="Doctors without a profile"
        />
      </div>

      {/* Doctors table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Doctor Directory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View doctors and their department assignments.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search doctors..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-64"
            />

            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            >
              <option value="ALL">All departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.name}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Doctor</th>
                <th className="px-5 py-4 font-semibold">Department</th>
                <th className="px-5 py-4 font-semibold">Availability</th>
                <th className="px-5 py-4 font-semibold">Workload</th>
                <th className="px-5 py-4 font-semibold">Capacity</th>
                <th className="px-5 py-4 font-semibold">Account</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredDoctors.map((doctor) => {
                const profile = doctor.doctorProfile;
                const department =
                  profile?.departmentRef?.name ||
                  profile?.department ||
                  "Unassigned";

                const workload =
                  doctor.currentWorkload ??
                  ((doctor.waitingPatients || 0) +
                    (doctor.patientsInConsultation || 0));

                return (
                  <tr
                    key={doctor.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                          {doctor.firstName.charAt(0)}
                          {doctor.lastName.charAt(0)}
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {doctor.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-700">
                        {department}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${getAvailabilityStyle(
                          profile?.availabilityStatus
                        )}`}
                      >
                        {formatAvailability(profile?.availabilityStatus)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {workload} patients
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {profile?.maxPatients ?? "-"} patients
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                          doctor.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {doctor.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredDoctors.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    <p className="font-medium text-slate-700">
                      No doctors found
                    </p>
                    <p className="mt-1 text-xs">
                      Try another search or add a doctor profile.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">
          Showing {filteredDoctors.length} of {doctorsWithProfiles.length} doctors
        </div>
      </div>

      {/* Doctors awaiting profile setup */}
      {doctorsWithoutProfiles.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold text-slate-900">
                Doctors awaiting profile setup
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                These doctors have staff accounts but have not yet been
                assigned a department.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
            >
              Complete profile
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {doctorsWithoutProfiles.map((doctor) => (
              <span
                key={doctor.id}
                className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-medium text-slate-700"
              >
                {doctor.firstName} {doctor.lastName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Add doctor modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Doctor
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Assign an enrolled doctor to a department.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setShowAddModal(false)}
                className="rounded-lg px-3 py-1 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-5 p-6">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Doctor
                </label>

                <select
                  required
                  value={selectedDoctorId}
                  onChange={(event) =>
                    setSelectedDoctorId(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Choose an enrolled doctor</option>

                  {doctorsWithoutProfiles.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.firstName} {doctor.lastName} — {doctor.email}
                    </option>
                  ))}
                </select>

                {doctorsWithoutProfiles.length === 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    There are no enrolled doctors awaiting profile setup.
                    Enroll a doctor under Staff Management first.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Department
                </label>

                <select
                  required
                  value={selectedDepartmentId}
                  onChange={(event) =>
                    setSelectedDepartmentId(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Choose a department</option>

                  {departments
                    .filter((department) => department.isActive)
                    .map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                </select>

                {departments.filter((department) => department.isActive)
                  .length === 0 && (
                  <p className="mt-2 text-xs text-amber-700">
                    Create an active department before assigning a doctor.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Maximum patients
                </label>

                <input
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={maxPatients}
                  onChange={(event) => setMaxPatients(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

                <p className="mt-1.5 text-xs text-slate-500">
                  Maximum number of patients this doctor can handle at a time,
                  according to your workload assignment rules.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    doctorsWithoutProfiles.length === 0 ||
                    departments.filter((department) => department.isActive)
                      .length === 0
                  }
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Create Doctor Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}
