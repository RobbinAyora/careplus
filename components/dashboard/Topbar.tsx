"use client";

import {
  Bell,
  ChevronDown,
  Menu,
  Search,
} from "lucide-react";

export default function Topbar({
  onMenuClick,
}: {
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 h-[88px] border-b border-[#e5eef9] bg-white/95 backdrop-blur">
      <div className="flex h-full items-center gap-4 px-5 sm:px-7 lg:px-10">

        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-[#173a6a] hover:bg-[#eef6ff] lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={24} />
        </button>

        {/* Search */}
        <div className="relative max-w-[510px] flex-1">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#315783]"
          />

          <input
            type="search"
            placeholder="Search patients, appointments, or records..."
            className="
              h-[43px]
              w-full
              rounded-xl
              border
              border-[#dbe8f7]
              bg-white
              pl-12
              pr-20
              text-sm
              text-[#173a6a]
              outline-none
              transition
              focus:border-[#248ce9]
              focus:ring-4
              focus:ring-[#248ce9]/10
            "
          />

          <span className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md bg-[#eef5fd] px-2 py-1 text-[11px] text-[#7892b5] sm:block">
            Ctrl + K
          </span>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-5">

          {/* Notifications */}
          <button
            className="relative rounded-xl p-2 text-[#173a6a] hover:bg-[#eef6ff]"
            aria-label="Notifications"
          >
            <Bell size={22} />

            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#ef5350]" />
          </button>

          {/* User */}
          <button className="hidden items-center gap-3 sm:flex">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-[#e9f3ff]">
              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="Doctor profile"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="text-left">
              <p className="text-sm font-semibold text-[#102f5f]">
                Dr. James Mwangi
              </p>

              <p className="text-xs text-[#6f87aa]">
                General Practitioner
              </p>
            </div>

            <ChevronDown size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}