
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  Edit3,
  Loader2,
  Plus,
  Search,
  Stethoscope,
  ToggleLeft,
  ToggleRight,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/lib/auth/session";
import { useApiClient } from "@/lib/api/client";

type Department = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  version: number;
  _count?: {
    doctors: number;
    visits?: number;
  };
};

type DepartmentsResponse = {
  data: Department[];
  nextCursor: string | null;
  hasMore: boolean;
};

type DepartmentForm = {
  name: string;
  description: string;
};

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

const emptyForm: DepartmentForm = {
  name: "",
  description: "",
};

export default function DepartmentsPage() {
  const { accessToken, isSessionLoaded } = useAuth();
  const apiRequest = useApiClient();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDepartments = useCallback(async () => {
    if (!isSessionLoaded) return;

    if (!accessToken) {
      setError("Your session has expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setError("");

      const allDepartments: Department[] = [];

      let cursor: string | null = null;
      let hasMore = true;

      const visitedCursors = new Set<string>();

      while (hasMore) {
        const params = new URLSearchParams({
          includeInactive: "true",
          limit: "100",
        });

        if (cursor) {
          params.set("cursor", cursor);
        }

        const response = await apiRequest<DepartmentsResponse>(
          `/departments?${params.toString()}`,
        );

        if (
          !response ||
          !Array.isArray(response.data) ||
          typeof response.hasMore !== "boolean"
        ) {
          throw new Error(
            "The departments response from the server is invalid.",
          );
        }

        allDepartments.push(...response.data);

        hasMore = response.hasMore;
        cursor = response.nextCursor;

        if (hasMore) {
          if (!cursor || visitedCursors.has(cursor)) {
            throw new Error(
              "Unable to continue loading departments. Invalid pagination cursor.",
            );
          }

          visitedCursors.add(cursor);
        }
      }

      setDepartments(allDepartments);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load departments.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, apiRequest, isSessionLoaded]);

  useEffect(() => {
    if (isSessionLoaded) {
      void loadDepartments();
    }
  }, [isSessionLoaded, loadDepartments]);

  useEffect(() => {
    if (!success) return;

    const timeout = window.setTimeout(() => setSuccess(""), 3500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  const statistics = useMemo(() => {
    const active = departments.filter((item) => item.isActive).length;
    const inactive = departments.length - active;

    const totalDoctors = departments.reduce(
      (total, item) => total + (item._count?.doctors ?? 0),
      0,
    );

    return {
      total: departments.length,
      active,
      inactive,
      doctors: totalDoctors,
    };
  }, [departments]);

  const filteredDepartments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return departments.filter((department) => {
      const matchesSearch =
        department.name.toLowerCase().includes(normalizedSearch) ||
        (department.description ?? "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && department.isActive) ||
        (statusFilter === "INACTIVE" && !department.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [departments, search, statusFilter]);

  function openCreateModal() {
    setEditingDepartment(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(department: Department) {
    setEditingDepartment(department);
    setForm({
      name: department.name,
      description: department.description ?? "",
    });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (submitting) return;

    setModalOpen(false);
    setEditingDepartment(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSessionLoaded || !accessToken) {
      setError("Your session is still loading or has expired.");
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Please enter a department name.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      if (editingDepartment) {
        await apiRequest<unknown>(
          `/departments/${editingDepartment.id}`,
          {
            method: "PATCH",
            body: {
              name,
              description,
              expectedVersion: editingDepartment.version,
            },
          },
        );

        setSuccess("Department updated successfully.");
      } else {
        await apiRequest<unknown>(
          "/departments",
          {
            method: "POST",
            body: {
              name,
              description,
            },
          },
        );

        setSuccess("Department created successfully.");
      }

      setModalOpen(false);
      setEditingDepartment(null);
      setForm(emptyForm);

      await loadDepartments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save department.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleDepartment(department: Department) {
    if (!isSessionLoaded || !accessToken) {
      setError("Your session is still loading or has expired.");
      return;
    }

    const action = department.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      department.isActive
        ? `Are you sure you want to deactivate ${department.name}?`
        : `Are you sure you want to reactivate ${department.name}?`,
    );

    if (!confirmed) return;

    try {
      setActionId(department.id);
      setError("");

      await apiRequest<unknown>(
        `/departments/${department.id}/${action}`,
        {
          method: "PATCH",
        },
      );

      setSuccess(
        department.isActive
          ? "Department deactivated successfully."
          : "Department reactivated successfully.",
      );

      await loadDepartments();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update department status.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-7">

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#64748B]">
              <span>Administration</span>
              <span>/</span>
              <span className="text-[#2563EB]">Departments</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#172B4D] sm:text-3xl">
              Departments
            </h1>

            <p className="mt-2 text-sm text-[#64748B]">
              Manage hospital departments and their doctor assignments.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <Plus size={18} />
            Add department
          </button>
        </div>

        {/* Success message */}
        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check size={18} />
            {success}
            <button
              onClick={() => setSuccess("")}
              className="ml-auto"
              aria-label="Dismiss success message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && !modalOpen && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert size={18} />
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-auto"
              aria-label="Dismiss error message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total departments"
            value={statistics.total}
            description="All registered departments"
            icon={<Building2 size={21} />}
            iconClass="bg-blue-50 text-[#2563EB]"
          />

          <StatCard
            title="Active departments"
            value={statistics.active}
            description="Currently available"
            icon={<Activity size={21} />}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <StatCard
            title="Inactive departments"
            value={statistics.inactive}
            description="Currently deactivated"
            icon={<ToggleLeft size={21} />}
            iconClass="bg-amber-50 text-amber-600"
          />

          <StatCard
            title="Assigned doctors"
            value={statistics.doctors}
            description="Across all departments"
            icon={<Stethoscope size={21} />}
            iconClass="bg-violet-50 text-violet-600"
          />
        </div>

        {/* Main table card */}
        <div className="overflow-hidden rounded-2xl border border-[#E8EDF4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-[#EEF2F7] p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#172B4D]">
                Department directory
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                View and manage all hospital departments.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search departments..."
                  className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#172B4D] outline-none transition placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 sm:w-64"
                />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as StatusFilter)
                  }
                  className="h-11 w-full appearance-none rounded-xl border border-[#E2E8F0] bg-white pl-4 pr-10 text-sm font-medium text-[#475569] outline-none transition focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50 sm:w-40"
                >
                  <option value="ALL">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-[#F8FAFC]">
                <tr className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Doctors</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F5F9]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <Loader2
                        size={25}
                        className="mx-auto animate-spin text-[#2563EB]"
                      />
                      <p className="mt-3 text-sm text-[#64748B]">
                        Loading departments...
                      </p>
                    </td>
                  </tr>
                ) : filteredDepartments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
                        <Building2 size={23} />
                      </div>

                      <h3 className="mt-4 font-semibold text-[#172B4D]">
                        {departments.length === 0
                          ? "No departments yet"
                          : "No matching departments"}
                      </h3>

                      <p className="mx-auto mt-1 max-w-sm text-sm text-[#64748B]">
                        {departments.length === 0
                          ? "Start by adding your first hospital department."
                          : "Try changing your search or status filter."}
                      </p>

                      {departments.length === 0 && (
                        <button
                          onClick={openCreateModal}
                          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          <Plus size={16} />
                          Add first department
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDepartments.map((department) => (
                    <tr
                      key={department.id}
                      className="transition hover:bg-[#FAFCFF]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
                            <Building2 size={19} />
                          </div>

                          <div>
                            <p className="font-semibold text-[#172B4D]">
                              {department.name}
                            </p>
                            <p className="mt-0.5 text-xs text-[#94A3B8]">
                              Hospital department
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-[260px] px-6 py-4">
                        <p className="truncate text-sm text-[#64748B]">
                          {department.description || "No description provided"}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm font-medium text-[#475569]">
                          <Users size={15} className="text-[#64748B]" />
                          {department._count?.doctors ?? 0}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            department.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              department.isActive
                                ? "bg-emerald-500"
                                : "bg-slate-400"
                            }`}
                          />
                          {department.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(department)}
                            title="Edit department"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#2563EB]"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={() => void toggleDepartment(department)}
                            disabled={actionId === department.id}
                            title={
                              department.isActive
                                ? "Deactivate department"
                                : "Reactivate department"
                            }
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-50 ${
                              department.isActive
                                ? "border-[#E2E8F0] text-[#64748B] hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {actionId === department.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : department.isActive ? (
                              <ToggleRight size={18} />
                            ) : (
                              <ToggleLeft size={18} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-[#EEF2F7] px-5 py-4 text-xs text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>
              Showing {filteredDepartments.length} of {departments.length} departments
            </p>
            <p>Department records are specific to your hospital.</p>
          </div>
        </div>

        {/* Department modal */}
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/50 p-4 backdrop-blur-[2px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeModal();
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="department-modal-title"
              className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#E8EDF4] bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-[#EEF2F7] px-6 py-5">
                <div>
                  <h2
                    id="department-modal-title"
                    className="text-xl font-bold text-[#172B4D]"
                  >
                    {editingDepartment
                      ? "Edit department"
                      : "Add department"}
                  </h2>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {editingDepartment
                      ? "Update the department information below."
                      : "Enter the details of the new hospital department."}
                  </p>
                </div>

                <button
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg p-2 text-[#94A3B8] transition hover:bg-slate-100 hover:text-[#172B4D]"
                  aria-label="Close modal"
                >
                  <X size={19} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-5 px-6 py-6">
                  {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <CircleAlert size={17} className="mt-0.5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="department-name"
                      className="mb-2 block text-sm font-semibold text-[#334155]"
                    >
                      Department name
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <input
                      id="department-name"
                      type="text"
                      required
                      maxLength={100}
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="e.g. Cardiology"
                      className="h-12 w-full rounded-xl border border-[#E2E8F0] px-4 text-sm text-[#172B4D] outline-none transition placeholder:text-[#A0AEC0] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50"
                    />

                    <p className="mt-1.5 text-xs text-[#94A3B8]">
                      Use a clear name that identifies the medical department.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="department-description"
                      className="mb-2 block text-sm font-semibold text-[#334155]"
                    >
                      Description
                      <span className="ml-2 text-xs font-normal text-[#94A3B8]">
                        Optional
                      </span>
                    </label>

                    <textarea
                      id="department-description"
                      rows={4}
                      maxLength={500}
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      placeholder="Briefly describe the services offered by this department..."
                      className="w-full resize-none rounded-xl border border-[#E2E8F0] px-4 py-3 text-sm text-[#172B4D] outline-none transition placeholder:text-[#A0AEC0] focus:border-[#2563EB] focus:ring-4 focus:ring-blue-50"
                    />

                    <p className="mt-1 text-right text-xs text-[#94A3B8]">
                      {form.description.length}/500
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-[#EEF2F7] bg-[#FAFCFE] px-6 py-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={submitting}
                    className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-semibold text-[#475569] transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {submitting
                      ? "Saving..."
                      : editingDepartment
                        ? "Save changes"
                        : "Create department"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E8EDF4] bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#64748B]">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#172B4D]">
            {value}
          </p>
          <p className="mt-1 text-xs text-[#94A3B8]">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}


