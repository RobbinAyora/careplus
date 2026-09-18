"use client";

import { Search, UsersRound } from "lucide-react";

type StatusFilter =
  | "all"
  | "checked_in"
  | "in_progress"
  | "scheduled"
  | "completed"
  | "no_show"
  | "cancelled";

type AppointmentFiltersProps = {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
  waitingCount: number;
};

const filters: {
  value: StatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "checked_in", label: "Checked-in" },
  { value: "in_progress", label: "In consultation" },
  { value: "scheduled", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "cancelled", label: "Cancelled" },
];

export default function AppointmentFilters({
  status,
  onStatusChange,
  search,
  onSearchChange,
  waitingCount,
}: AppointmentFiltersProps) {
  return (
    <div className="rounded-2xl border border-[#e3edf8] bg-white p-3 shadow-[0_4px_18px_rgba(28,73,125,0.04)]">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 xl:pb-0">
          {filters.map((filter) => {
            const active = status === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => onStatusChange(filter.value)}
                className={`
                  shrink-0
                  rounded-full
                  px-3.5
                  py-2
                  text-xs
                  font-medium
                  transition
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#2d91e8]/40
                  ${
                    active
                      ? "bg-[#2d91e8] text-white"
                      : "bg-[#f3f7fc] text-[#55749c] hover:bg-[#e9f3ff] hover:text-[#1677d2]"
                  }
                `}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 sm:w-[245px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8ba2bd]"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search patient name or ID"
              className="
                h-10
                w-full
                rounded-xl
                border
                border-[#dce8f5]
                bg-[#fbfdff]
                pl-9
                pr-3
                text-xs
                text-[#294b76]
                outline-none
                placeholder:text-[#9aacc1]
                focus:border-[#5aa7ef]
                focus:ring-2
                focus:ring-[#2d91e8]/10
              "
            />
          </div>

          <div className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#eef6ff] px-3 text-xs font-medium text-[#1677d2]">
            <UsersRound size={15} />
            <span>8 today · {waitingCount} waiting</span>
          </div>
        </div>
      </div>
    </div>
  );
}