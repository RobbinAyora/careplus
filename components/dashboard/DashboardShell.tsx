
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

const ROLE_TO_SIDEBAR: Partial<Record<string, DashboardRole>> = {
  doctor: "doctor",
  hospital_admin: "admin",
  nurse: "nurse",
  receptionist: "receptionist",
  super_admin: "super_admin",
};

export default function DashboardShell({
  children,
}: DashboardShellProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  const { user, accessToken, isSessionLoaded } = useAuth();

  const dashboardPath = user
    ? DASHBOARD_PATHS[user.role]
    : undefined;

  const role = user
    ? ROLE_TO_SIDEBAR[user.role]
    : undefined;

  const hasCorrectRole =
    dashboardPath !== undefined &&
    (pathname === dashboardPath.replace("/dashboard", "") ||
      pathname.startsWith(
        `${dashboardPath.replace("/dashboard", "")}/`,
      ));

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

    // No configured dashboard for this role.
    if (!dashboardPath) {
      return;
    }

    // Ensure users only access their own dashboard section.
    if (!hasCorrectRole) {
      router.replace(dashboardPath);
    }
  }, [
    isSessionLoaded,
    user,
    accessToken,
    dashboardPath,
    hasCorrectRole,
    router,
  ]);

  if (
    !isSessionLoaded ||
    !user ||
    !accessToken ||
    user.mustChangePassword
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fbff]">
        <p className="text-sm text-slate-500">
          Checking your session...
        </p>
      </div>
    );
  }

  // Handle roles without configured dashboard routes.
  if (!dashboardPath || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fbff]">
        <p className="text-sm text-slate-500">
          Your dashboard is not available yet.
        </p>
      </div>
    );
  }

  // Prevent dashboard content from rendering while redirecting.
  if (!hasCorrectRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fbff]">
        <p className="text-sm text-slate-500">
          Redirecting to your dashboard...
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

