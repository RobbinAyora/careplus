"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import type { DashboardRole } from "./navigation";
import { useAuth } from "@/lib/auth/session";
import { DASHBOARD_PATHS } from "@/lib/auth/role-routes";

type DashboardShellProps = {
  children: React.ReactNode;
};

const ROLE_TO_SIDEBAR: Record<string, DashboardRole> = {
  doctor: "doctor",
  hospital_admin: "admin",
  nurse: "nurse",
  receptionist: "receptionist",
  super_admin: "super_admin",
};

export default function DashboardShell({ children }: DashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const { user, accessToken, isSessionLoaded } = useAuth();

  useEffect(() => {
    if (!isSessionLoaded) return;

    // No authenticated session: return to login.
    if (!user || !accessToken) {
      router.replace("/login");
      return;
    }

    // Force users to change their temporary password first.
    if (user.mustChangePassword) {
      router.replace("/change-password");
      return;
    }

    // Ensure users only access their own dashboard section.
    const dashboardPath = DASHBOARD_PATHS[user.role];
    const rolePrefix = dashboardPath.replace("/dashboard", "");

    const hasCorrectRole =
      pathname === rolePrefix || pathname.startsWith(`${rolePrefix}/`);

    if (!hasCorrectRole) {
      router.replace(dashboardPath);
    }
  }, [isSessionLoaded, user, accessToken, pathname, router]);

  if (!isSessionLoaded || !user || !accessToken || user.mustChangePassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fbff]">
        <p className="text-sm text-slate-500">Checking your session...</p>
      </div>
    );
  }

  const role = ROLE_TO_SIDEBAR[user.role];

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fbff]">
        <p className="text-sm text-slate-500">
          Your dashboard is not available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fbff]">
      <Sidebar
        role={role}
        mobileOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="lg:pl-[273px]">
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main>{children}</main>
      </div>
    </div>
  );
}
