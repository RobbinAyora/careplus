
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/session";
import { useApiClient } from "@/lib/api/client";

import {
  ChevronDown,
  Grid2X2,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Clock,
  Users,
  UserCheck,
  Activity,
  Stethoscope,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import PatientTable from "@/components/dashboard/doctor/patients/PatientTable";
import PatientCard from "@/components/dashboard/doctor/patients/PatientCard";

import type {
  Gender,
  Patient,
  PatientStatus,
} from "@/lib/patients/patient-types";

type ViewMode = "table" | "grid";
type SortMode = "recent" | "alphabetical" | "flagged";

type AvailabilityStatus =
  | "AVAILABLE"
  | "ON_BREAK"
  | "OFF_DUTY";

interface DoctorWorkload {
  waitingPatients: number;
  patientsInConsultation: number;
  currentWorkload: number;
  maxPatients: number;
  remainingCapacity: number;
}

interface DoctorProfileData {
  availabilityStatus: AvailabilityStatus;
  department: string | null;
  workload: DoctorWorkload;
}

interface AssignedPatientsPagination {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
}

const PAGE_SIZE = 20;
const REFRESH_INTERVAL = 30000;

const DEFAULT_WORKLOAD: DoctorWorkload = {
  waitingPatients: 0,
  patientsInConsultation: 0,
  currentWorkload: 0,
  maxPatients: 0,
  remainingCapacity: 0,
};

const DEFAULT_PAGINATION: AssignedPatientsPagination = {
  limit: PAGE_SIZE,
  nextCursor: null,
  hasMore: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getAvailabilityStatus(
  value: unknown,
): AvailabilityStatus | null {
  if (
    value === "AVAILABLE" ||
    value === "ON_BREAK" ||
    value === "OFF_DUTY"
  ) {
    return value;
  }

  return null;
}

function parseDoctorProfile(data: unknown): DoctorProfileData {
  if (!isRecord(data)) {
    throw new Error("The server returned an invalid doctor profile.");
  }

  const profile = isRecord(data.doctorProfile)
    ? data.doctorProfile
    : isRecord(data.profile)
      ? data.profile
      : data;

  const workload = isRecord(data.workload)
    ? data.workload
    : profile;

  const departmentRef = isRecord(profile.departmentRef)
    ? profile.departmentRef
    : null;

  const availabilityStatus = getAvailabilityStatus(
    profile.availabilityStatus ?? data.availabilityStatus,
  );

  if (!availabilityStatus) {
    throw new Error(
      "The doctor availability status was missing or invalid in the server response.",
    );
  }

  const waitingPatients = getNumber(workload.waitingPatients);

  const patientsInConsultation = getNumber(
    workload.patientsInConsultation,
  );

  const currentWorkload = getNumber(
    workload.currentWorkload,
    waitingPatients + patientsInConsultation,
  );

  const maxPatients = getNumber(
    workload.maxPatients,
    getNumber(profile.maxPatients),
  );

  const remainingCapacity = getNumber(
    workload.remainingCapacity,
    Math.max(0, maxPatients - currentWorkload),
  );

  return {
    availabilityStatus,
    department:
      typeof departmentRef?.name === "string"
        ? departmentRef.name
        : typeof profile.department === "string"
          ? profile.department
          : null,
    workload: {
      waitingPatients,
      patientsInConsultation,
      currentWorkload,
      maxPatients,
      remainingCapacity,
    },
  };
}

/**
 * Calculates a patient's age from their date of birth.
 */
function calculateAge(dateOfBirth: unknown): number {
  if (typeof dateOfBirth !== "string") return 0;

  const date = new Date(dateOfBirth);

  if (Number.isNaN(date.getTime())) return 0;

  const today = new Date();

  let age = today.getFullYear() - date.getFullYear();

  const monthDifference = today.getMonth() - date.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < date.getDate())
  ) {
    age--;
  }

  return Math.max(0, age);
}

/**
 * Converts the backend's sex/gender values into the values
 * expected by the existing Patient components.
 */
function parseGender(value: unknown): Gender {
  const normalized = String(value ?? "").toUpperCase();

  if (normalized === "MALE") return "Male";
  if (normalized === "FEMALE") return "Female";

  return "Male";
}

/**
 * Converts the backend visit information into the existing
 * frontend Patient structure.
 */
function mapAssignedPatient(queueEntry: unknown): Patient {
  if (!isRecord(queueEntry)) {
    throw new Error("The server returned an invalid patient record.");
  }

  const visit = isRecord(queueEntry.visit)
    ? queueEntry.visit
    : queueEntry;

  const patient = isRecord(visit.patient)
    ? visit.patient
    : isRecord(queueEntry.patient)
      ? queueEntry.patient
      : {};

  const triageRecord = isRecord(visit.triageRecord)
    ? visit.triageRecord
    : isRecord(queueEntry.triageRecord)
      ? queueEntry.triageRecord
      : {};

  const assignedDoctor = isRecord(queueEntry.assignedDoctor)
    ? queueEntry.assignedDoctor
    : {};

  const firstName = getString(patient.firstName);
  const lastName = getString(patient.lastName);
  const otherNames = getString(patient.otherNames);

  const fullName = [firstName, otherNames, lastName]
    .filter(Boolean)
    .join(" ");

  const dateOfBirth = patient.dateOfBirth;

  const visitType = getString(visit.visitType).toUpperCase();

  const visitStatus = getString(
    queueEntry.status ?? visit.status,
  ).toUpperCase();

  const patientStatus: PatientStatus =
    visitType === "INPATIENT" ? "Admitted" : "Outpatient";

  const priority = getString(triageRecord.priority).toUpperCase();

  const allergies = Array.isArray(triageRecord.allergies)
    ? triageRecord.allergies.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  const medications = Array.isArray(
    triageRecord.currentMedications,
  )
    ? triageRecord.currentMedications.filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  const patientId = getString(patient.id);

  return {
    id: patientId,
    name: fullName || "Unnamed Patient",
    age: calculateAge(dateOfBirth),
    gender: parseGender(patient.sex ?? patient.gender),
    phone: getString(patient.phone),
    email: getString(patient.email),
    avatar: getString(patient.avatar),
    status: patientStatus,
    doctor: [
      getString(assignedDoctor.firstName),
      getString(assignedDoctor.lastName),
    ]
      .filter(Boolean)
      .join(" ") || "Assigned Doctor",
    ward: getString(visit.ward),
    bed: getString(visit.bed),
    lastVisit: getString(
      visit.createdAt ?? queueEntry.checkedInAt,
    ),
    nextAppointment: "",
    insurance: getString(patient.insuranceType),
    allergies,
    chronicConditions: [],
    flagged:
      priority === "EMERGENCY" ||
      priority === "URGENT" ||
      visitStatus === "REFERRED",
    assignedDoctorId: getString(queueEntry.assignedDoctorId),
  } as Patient;
}

/**
 * Extracts patient records and cursor pagination from the backend response.
 *
 * Expected backend response:
 * {
 *   message: string,
 *   data: [],
 *   pagination: {
 *     nextCursor: string | null,
 *     hasMore: boolean,
 *     limit: number
 *   }
 * }
 */
function parseAssignedPatientsResponse(data: unknown): {
  patients: Patient[];
  pagination: AssignedPatientsPagination;
} {
  if (!isRecord(data)) {
    throw new Error("The server returned an invalid patients response.");
  }

  let records: unknown[] = [];

  if (Array.isArray(data.data)) {
    records = data.data;
  } else if (Array.isArray(data.items)) {
    records = data.items;
  } else if (Array.isArray(data.results)) {
    records = data.results;
  } else if (Array.isArray(data.queueEntries)) {
    records = data.queueEntries;
  }

  const paginationSource = isRecord(data.pagination)
    ? data.pagination
    : isRecord(data.meta)
      ? data.meta
      : {};

  const nextCursor =
    typeof paginationSource.nextCursor === "string"
      ? paginationSource.nextCursor
      : null;

  const hasMore = paginationSource.hasMore === true;

  const limit = getNumber(
    paginationSource.limit,
    PAGE_SIZE,
  );

  return {
    patients: records.map(mapAssignedPatient),
    pagination: {
      nextCursor,
      hasMore,
      limit,
    },
  };
}

export default function DoctorPatientsPage() {
  const { accessToken } = useAuth();
  const apiRequest = useApiClient();

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<PatientStatus | "All">("All");
  const [gender, setGender] = useState<Gender | "All">("All");
  const [ageRange, setAgeRange] = useState("All");

  const [sort, setSort] = useState<SortMode>("recent");
  const [view, setView] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);

  // Cursor history allows the Previous button to return
  // to the cursor used to load the previous page.
  const [cursorHistory, setCursorHistory] = useState<
    Record<number, string>
  >({});

  const currentCursor = cursorHistory[page];

  // DOCTOR AVAILABILITY STATE

  const [availability, setAvailability] =
    useState<AvailabilityStatus>("OFF_DUTY");

  const [showAvailabilityOptions, setShowAvailabilityOptions] =
    useState(false);

  // BACKEND INTEGRATION STATE

  const [profileLoading, setProfileLoading] = useState(true);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  const [patientsLoading, setPatientsLoading] = useState(true);

  const [apiError, setApiError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [department, setDepartment] = useState<string | null>(null);

  const [workload, setWorkload] =
    useState<DoctorWorkload>(DEFAULT_WORKLOAD);

  // BACKEND PATIENT DATA

  const [assignedPatients, setAssignedPatients] = useState<Patient[]>([]);

  const [pagination, setPagination] =
    useState<AssignedPatientsPagination>(DEFAULT_PAGINATION);

  const waitingPatients = workload.waitingPatients;
  const patientsInConsultation = workload.patientsInConsultation;
  const currentWorkload = workload.currentWorkload;
  const maxPatients = workload.maxPatients;
  const remainingCapacity = workload.remainingCapacity;

  // LOAD DOCTOR PROFILE FROM BACKEND

  const loadDoctorProfile = useCallback(async () => {
    setProfileLoading(true);

    try {
      const data = await apiRequest<unknown>(
        "/doctors/me/profile",
      );

      const profile = parseDoctorProfile(data);

      setAvailability(profile.availabilityStatus);
      setDepartment(profile.department);
      setWorkload(profile.workload);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Unable to load your doctor profile.",
      );
    } finally {
      setProfileLoading(false);
    }
  }, [apiRequest]);

  // LOAD ASSIGNED PATIENTS FROM BACKEND USING CURSOR PAGINATION

  const loadAssignedPatients = useCallback(
    async (
      currentPage: number,
      searchTerm: string,
      cursor?: string,
    ) => {
      setPatientsLoading(true);

      try {
        const queryParams = new URLSearchParams({
          limit: String(PAGE_SIZE),
        });

        if (searchTerm.trim()) {
          queryParams.set("search", searchTerm.trim());
        }

        if (cursor) {
          queryParams.set("cursor", cursor);
        }

        const data = await apiRequest<unknown>(
          `/doctors/me/assigned-patients?${queryParams.toString()}`,
        );

        const result = parseAssignedPatientsResponse(data);

        setAssignedPatients(result.patients);
        setPagination(result.pagination);
        setApiError(null);
      } catch (error) {
        setAssignedPatients([]);

        setApiError(
          error instanceof Error
            ? error.message
            : "Unable to load your assigned patients.",
        );
      } finally {
        setPatientsLoading(false);
      }
    },
    [apiRequest],
  );

  // LOAD DOCTOR PROFILE WHEN AUTHENTICATION IS READY

  useEffect(() => {
    if (!accessToken) {
      setProfileLoading(false);
      setPatientsLoading(false);
      return;
    }

    void loadDoctorProfile();
  }, [accessToken, loadDoctorProfile]);

  // FETCH ASSIGNED PATIENTS WHEN TOKEN, PAGE, SEARCH OR CURSOR CHANGES

  useEffect(() => {
    if (!accessToken) return;

    void loadAssignedPatients(page, search, currentCursor);
  }, [
    accessToken,
    page,
    search,
    currentCursor,
    loadAssignedPatients,
  ]);

  // AUTOMATICALLY REFRESH DOCTOR PROFILE AND ASSIGNED PATIENTS

  useEffect(() => {
    if (!accessToken) return;

    const refreshData = () => {
      void loadDoctorProfile();
      void loadAssignedPatients(page, search, currentCursor);
    };

    const interval = window.setInterval(
      refreshData,
      REFRESH_INTERVAL,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [
    accessToken,
    page,
    search,
    currentCursor,
    loadDoctorProfile,
    loadAssignedPatients,
  ]);

  // MANUALLY REFRESH DOCTOR PROFILE AND ASSIGNED PATIENTS

  const handleRefresh = useCallback(() => {
    if (!accessToken) return;

    setApiError(null);

    void loadDoctorProfile();
    void loadAssignedPatients(page, search, currentCursor);
  }, [
    accessToken,
    page,
    search,
    currentCursor,
    loadDoctorProfile,
    loadAssignedPatients,
  ]);

  // UPDATE DOCTOR AVAILABILITY

  async function handleAvailabilityChange(
    newAvailability: AvailabilityStatus,
  ) {
    if (!accessToken) {
      setApiError(
        "Your session is unavailable. Please sign in again.",
      );
      return;
    }

    if (newAvailability === availability) {
      setShowAvailabilityOptions(false);
      return;
    }

    setAvailabilitySaving(true);
    setApiError(null);
    setSuccessMessage(null);
    setShowAvailabilityOptions(false);

    try {
      await apiRequest<unknown>(
        "/doctors/me/availability",
        {
          method: "PATCH",
          body: {
            availabilityStatus: newAvailability,
          },
        },
      );

      await loadDoctorProfile();

      // Refresh the assigned-patient list after availability changes.
      // The backend may automatically assign waiting patients.
      await loadAssignedPatients(page, search, currentCursor);

      setSuccessMessage(
        "Your availability has been updated successfully.",
      );
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Unable to update your availability.",
      );
    } finally {
      setAvailabilitySaving(false);
    }
  }

  // AVAILABILITY OPTIONS

  const availabilityOptions: {
    value: AvailabilityStatus;
    label: string;
    description: string;
    color: string;
    dotColor: string;
  }[] = [
    {
      value: "AVAILABLE",
      label: "Available",
      description: "You can receive new patients",
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      dotColor: "bg-emerald-500",
    },
    {
      value: "ON_BREAK",
      label: "On Break",
      description: "Temporarily unavailable",
      color: "text-amber-700 bg-amber-50 border-amber-200",
      dotColor: "bg-amber-500",
    },
    {
      value: "OFF_DUTY",
      label: "Off Duty",
      description: "Not receiving new patients",
      color: "text-slate-600 bg-slate-100 border-slate-200",
      dotColor: "bg-slate-400",
    },
  ];

  const currentAvailability = availabilityOptions.find(
    (option) => option.value === availability,
  )!;

  // FILTER AND SORT BACKEND PATIENTS

  const filteredPatients = useMemo(() => {
    let result = [...assignedPatients];

    if (status !== "All") {
      result = result.filter(
        (patient) => patient.status === status,
      );
    }

    if (gender !== "All") {
      result = result.filter(
        (patient) => patient.gender === gender,
      );
    }

    if (ageRange !== "All") {
      result = result.filter((patient) => {
        if (ageRange === "0-17") return patient.age <= 17;

        if (ageRange === "18-35") {
          return patient.age >= 18 && patient.age <= 35;
        }

        if (ageRange === "36-55") {
          return patient.age >= 36 && patient.age <= 55;
        }

        if (ageRange === "56+") return patient.age >= 56;

        return true;
      });
    }

    if (sort === "alphabetical") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "flagged") {
      result.sort(
        (a, b) =>
          Number(Boolean(b.flagged)) -
          Number(Boolean(a.flagged)),
      );
    }

    if (sort === "recent") {
      result.sort((a, b) => {
        const aDate = a.lastVisit
          ? new Date(a.lastVisit).getTime()
          : 0;

        const bDate = b.lastVisit
          ? new Date(b.lastVisit).getTime()
          : 0;

        return bDate - aDate;
      });
    }

    return result;
  }, [
    assignedPatients,
    status,
    gender,
    ageRange,
    sort,
  ]);

  const visiblePatients = filteredPatients;

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
    setCursorHistory({});
  }

  function handleNextPage() {
    if (!pagination.hasMore || !pagination.nextCursor) return;

    const nextPage = page + 1;

    setCursorHistory((current) => ({
      ...current,
      [nextPage]: pagination.nextCursor!,
    }));

    setPage(nextPage);
  }

  function handlePreviousPage() {
    if (page <= 1) return;

    setPage((current) => Math.max(1, current - 1));
  }

  return (
    <main className="min-h-full bg-[#f8fbff] px-4 pb-10 pt-4 sm:px-6 lg:px-8">
      {/* HEADER */}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#102a56] sm:text-3xl">
            Patients
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            View and manage your clinical patient roster.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={!accessToken || patientsLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-[#54709c] shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                patientsLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              console.log("Add new patient clicked")
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <Plus className="h-4 w-4" />
            Add New Patient
          </button>
        </div>
      </div>

      {/* DOCTOR AVAILABILITY */}

      <section className="mt-6 rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                <Stethoscope className="h-5 w-5 text-blue-600" />
              </div>

              <div>
                <h2 className="font-bold text-[#102a56]">
                  Doctor Availability
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Manage your availability to receive patients.
                </p>
              </div>
            </div>

            {department && (
              <p className="mt-3 text-xs font-medium text-slate-500">
                Department: {department}
              </p>
            )}
          </div>

          {/* AVAILABILITY SELECTOR */}

          <div className="relative">
            <button
              type="button"
              disabled={
                profileLoading ||
                availabilitySaving ||
                !accessToken
              }
              onClick={() =>
                setShowAvailabilityOptions(
                  !showAvailabilityOptions,
                )
              }
              className={`flex w-full items-center justify-between gap-5 rounded-xl border px-4 py-3 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-[220px] ${currentAvailability.color}`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${currentAvailability.dotColor}`}
                />

                <span className="text-sm font-semibold">
                  {profileLoading
                    ? "Loading..."
                    : availabilitySaving
                      ? "Updating..."
                      : currentAvailability.label}
                </span>
              </span>

              <ChevronDown className="h-4 w-4" />
            </button>

            {showAvailabilityOptions && (
              <div className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-xl border border-blue-100 bg-white p-1 shadow-xl">
                {availabilityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={availabilitySaving}
                    onClick={() =>
                      void handleAvailabilityChange(option.value)
                    }
                    className="flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-blue-50 disabled:opacity-50"
                  >
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${option.dotColor}`}
                    />

                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-[#102a56]">
                        {option.label}
                      </span>

                      <span className="mt-0.5 block text-xs text-slate-400">
                        {option.description}
                      </span>
                    </span>

                    {availability === option.value && (
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AVAILABILITY DESCRIPTION */}

        <div className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${currentAvailability.dotColor}`}
          />

          <p className="text-sm text-slate-600">
            {profileLoading
              ? "Loading your availability..."
              : currentAvailability.description + "."}
          </p>
        </div>

        {/* API SUCCESS MESSAGE */}

        {successMessage && (
          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* API ERROR MESSAGE */}

        {apiError && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}
      </section>

      {/* DOCTOR WORKLOAD STATISTICS */}

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* WAITING PATIENTS */}

        <div className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Waiting
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold text-[#102a56]">
            {profileLoading ? "..." : waitingPatients}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Patients awaiting consultation
          </p>
        </div>

        {/* IN CONSULTATION */}

        <div className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Activity className="h-5 w-5 text-indigo-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Active
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold text-[#102a56]">
            {profileLoading ? "..." : patientsInConsultation}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Patients in consultation
          </p>
        </div>

        {/* MAXIMUM CAPACITY */}

        <div className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Capacity
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold text-[#102a56]">
            {profileLoading
              ? "..."
              : `${currentWorkload}/${maxPatients}`}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Current patient workload
          </p>
        </div>

        {/* AVAILABLE SLOTS */}

        <div className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <UserCheck className="h-5 w-5 text-emerald-600" />
            </div>

            <span className="text-xs font-medium text-slate-400">
              Remaining
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold text-[#102a56]">
            {profileLoading ? "..." : remainingCapacity}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Available patient slots
          </p>
        </div>
      </section>

      {/* SEARCH + SCOPE */}

      <div className="mt-6 rounded-2xl border border-blue-50 bg-white p-4 shadow-[0_4px_20px_rgba(37,99,235,0.04)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6680a8]" />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                handleSearch(event.target.value)
              }
              placeholder="Search by name, patient ID, or phone number..."
              className="h-12 w-full rounded-xl border border-blue-100 bg-white pl-12 pr-4 text-sm text-[#102a56] outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="flex rounded-xl bg-slate-50 p-1">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              My Patients
            </button>

            <button
              type="button"
              disabled
              title="Doctors can only view patients assigned to them."
              className="cursor-not-allowed rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-300"
            >
              All Patients
            </button>
          </div>
        </div>

        {/* FILTERS */}

        <div className="mt-4 flex flex-wrap gap-2">
          <div className="relative">
            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value as PatientStatus | "All",
                );
              }}
              className="appearance-none rounded-lg border border-blue-100 bg-white py-2.5 pl-3 pr-9 text-xs font-medium text-[#54709c] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            >
              <option value="All">All statuses</option>
              <option value="Admitted">Admitted</option>
              <option value="Outpatient">Outpatient</option>
              <option value="Discharged">Discharged</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={gender}
              onChange={(event) => {
                setGender(
                  event.target.value as Gender | "All",
                );
              }}
              className="appearance-none rounded-lg border border-blue-100 bg-white py-2.5 pl-3 pr-9 text-xs font-medium text-[#54709c] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            >
              <option value="All">All genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={ageRange}
              onChange={(event) => {
                setAgeRange(event.target.value);
              }}
              className="appearance-none rounded-lg border border-blue-100 bg-white py-2.5 pl-3 pr-9 text-xs font-medium text-[#54709c] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            >
              <option value="All">All ages</option>
              <option value="0-17">0–17</option>
              <option value="18-35">18–35</option>
              <option value="36-55">36–55</option>
              <option value="56+">56+</option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(event) =>
                setSort(event.target.value as SortMode)
              }
              className="appearance-none rounded-lg border border-blue-100 bg-white py-2.5 pl-3 pr-9 text-xs font-medium text-[#54709c] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            >
              <option value="recent">
                Sort: Recent visit
              </option>
              <option value="alphabetical">
                Sort: Alphabetical
              </option>
              <option value="flagged">
                Sort: Flagged first
              </option>
            </select>

            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-100 px-3 py-2.5 text-xs font-medium text-[#54709c] hover:bg-blue-50"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            More filters
          </button>
        </div>
      </div>

      {/* PATIENT LIST */}

      <section className="mt-5 overflow-hidden rounded-2xl border border-blue-50 bg-white shadow-[0_4px_20px_rgba(37,99,235,0.04)]">
        <div className="flex items-center justify-between border-b border-blue-50 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-bold text-[#102a56]">
              My Patients
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {patientsLoading
                ? "Loading assigned patients..."
                : `${assignedPatients.length} patients on this page`}
            </p>
          </div>

          <div className="flex rounded-lg border border-blue-100 p-1">
            <button
              type="button"
              onClick={() => setView("table")}
              className={`rounded-md p-2 ${
                view === "table"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-400"
              }`}
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setView("grid")}
              className={`rounded-md p-2 ${
                view === "grid"
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-400"
              }`}
              aria-label="Grid view"
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {patientsLoading ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

            <p className="mt-4 text-sm font-medium text-slate-500">
              Loading your assigned patients...
            </p>
          </div>
        ) : visiblePatients.length > 0 ? (
          <>
            {view === "table" && (
              <PatientTable patients={visiblePatients} />
            )}

            {view === "grid" && (
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                  />
                ))}
              </div>
            )}

            {/* MOBILE CARDS ALWAYS VISIBLE */}

            {view === "table" && (
              <div className="space-y-3 p-4 lg:hidden">
                {visiblePatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                  />
                ))}
              </div>
            )}

            {/* CURSOR PAGINATION */}

            <div className="flex flex-col gap-3 border-t border-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Page {page} · Showing {visiblePatients.length} patients
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1 || patientsLoading}
                  onClick={handlePreviousPage}
                  className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-medium text-[#54709c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                  {page}
                </span>

                <button
                  type="button"
                  disabled={
                    !pagination.hasMore ||
                    !pagination.nextCursor ||
                    patientsLoading
                  }
                  onClick={handleNextPage}
                  className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-medium text-[#54709c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Search className="h-7 w-7 text-blue-500" />
            </div>

            <h3 className="mt-4 font-semibold text-[#102a56]">
              {apiError
                ? "Unable to load patients"
                : "No patients found"}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-400">
              {apiError
                ? "There was a problem retrieving your assigned patients. Check your connection and try again."
                : "You currently have no patients assigned to you, or your search and filters returned no results."}
            </p>

            {apiError && accessToken && (
              <button
                type="button"
                onClick={() =>
                  void loadAssignedPatients(page, search, currentCursor)
                }
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
 






