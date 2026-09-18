"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import type { DashboardRole } from "./navigation";

type DashboardShellProps = {
  children: React.ReactNode;
};

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const pathname = usePathname();

  // Determine the dashboard role from the current URL
  const role: DashboardRole =
    pathname.startsWith("/hospital-admin")
      ? "admin"
      : pathname.startsWith("/doctor")
        ? "doctor"
        : pathname.startsWith("/nurse")
          ? "nurse"
          : pathname.startsWith("/receptionist")
            ? "receptionist"
            : pathname.startsWith("/super-admin")
              ? "super_admin"
              : "doctor";

  return (
    <div className="min-h-screen bg-[#f8fbff]">
      {/* Sidebar */}
      <Sidebar
        role={role}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="lg:pl-[273px]">
        <Topbar
          onMenuClick={() => setMobileSidebarOpen(true)}
        />

        <main>{children}</main>
      </div>
    </div>
  );
}
