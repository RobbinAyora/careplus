
"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  Grid2X2,
  List,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import PatientTable from "@/components/dashboard/doctor/patients/PatientTable";
import PatientCard from "@/components/dashboard/doctor/patients/PatientCard";
import { mockPatients } from "@/lib/patients/mock-patients";
import type {
  Gender,
  Patient,
  PatientStatus,
} from "@/lib/patients/patient-types";

type ViewMode = "table" | "grid";
type SortMode = "recent" | "alphabetical" | "flagged";

const CURRENT_DOCTOR_ID = "DOC-001";

export default function DoctorPatientsPage() {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [status, setStatus] = useState<PatientStatus | "All">("All");
  const [gender, setGender] = useState<Gender | "All">("All");
  const [ageRange, setAgeRange] = useState("All");
  const [sort, setSort] = useState<SortMode>("recent");
  const [view, setView] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 20;

  const filteredPatients = useMemo(() => {
    let result = [...mockPatients];

    if (scope === "mine") {
      result = result.filter(
        (patient) =>
          patient.assignedDoctorId === CURRENT_DOCTOR_ID,
      );
    }

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
        if (ageRange === "18-35")
          return patient.age >= 18 && patient.age <= 35;
        if (ageRange === "36-55")
          return patient.age >= 36 && patient.age <= 55;
        if (ageRange === "56+") return patient.age >= 56;

        return true;
      });
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter((patient) =>
        [
          patient.name,
          patient.id,
          patient.phone,
        ].some((value) =>
          value.toLowerCase().includes(query),
        ),
      );
    }

    if (sort === "alphabetical") {
      result.sort((a, b) =>
        a.name.localeCompare(b.name),
      );
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
    search,
    scope,
    status,
    gender,
    ageRange,
    sort,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPatients.length / PAGE_SIZE),
  );

  const visiblePatients = filteredPatients.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function handleSearch(value: string) {
    setSearch(value);
    setPage(1);
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
              onClick={() => {
                setScope("mine");
                setPage(1);
              }}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                scope === "mine"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-[#102a56]"
              }`}
            >
              My Patients
            </button>

            <button
              type="button"
              onClick={() => {
                setScope("all");
                setPage(1);
              }}
              className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
                scope === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-[#102a56]"
              }`}
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
                  event.target.value as
                    | PatientStatus
                    | "All",
                );
                setPage(1);
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
                setPage(1);
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
                setPage(1);
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
              {scope === "mine"
                ? "My Patients"
                : "All Patients"}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              {filteredPatients.length} patients found
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

        {visiblePatients.length > 0 ? (
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

            {/* Mobile cards always visible */}
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

            {/* PAGINATION */}

            <div className="flex flex-col gap-3 border-t border-blue-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                Showing{" "}
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(
                  page * PAGE_SIZE,
                  filteredPatients.length,
                )}{" "}
                of {filteredPatients.length}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() =>
                    setPage((current) =>
                      Math.max(1, current - 1),
                    )
                  }
                  className="rounded-lg border border-blue-100 px-3 py-2 text-xs font-medium text-[#54709c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">
                  {page}
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(totalPages, current + 1),
                    )
                  }
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
              No patients found
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-400">
              Try changing your search or filters to find
              another patient.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}

