"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fbff]">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} role="admin" />
      <div className="lg:pl-[273px]">
        <Topbar onMenuClick={() => setMobileSidebarOpen(true)} />
        <main>{children}</main>
      </div>
    </div>
  );
}
