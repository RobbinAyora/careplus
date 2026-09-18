"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartPulse, LayoutDashboard, UsersRound, CalendarDays, FileText,
  Package, CreditCard, BarChart3, Settings, X
} from "lucide-react";

const adminNavigation = [
  ["Dashboard", "/admin/dashboard", LayoutDashboard],
  ["Users & Staff", "/admin/users", UsersRound],
  ["Patients", "/admin/patients", UsersRound],
  ["Appointments", "/admin/appointments", CalendarDays],
  ["Medical Records", "/admin/medical-records", FileText],
  ["Inventory", "/admin/inventory", Package],
  ["Billing & Finance", "/admin/billing", CreditCard],
  ["Reports", "/admin/reports", BarChart3],
  ["Settings", "/admin/settings", Settings],
] as const;

export default function Sidebar({
  mobileOpen,
  onClose,
  role = "admin",
}: {
  mobileOpen: boolean;
  onClose: () => void;
  role?: "admin";
}) {
  const pathname = usePathname();

  return (
    <>
      {mobileOpen && <button aria-label="Close navigation" onClick={onClose} className="fixed inset-0 z-40 bg-black/20 lg:hidden" />}
      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-[273px] flex-col border-r border-[#e1ebf7] bg-white transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="flex h-[96px] items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#168bea] text-white"><HeartPulse size={27} /></div>
            <div>
              <h1 className="text-[24px] font-bold tracking-[-0.04em] text-[#102f5f]">CarePlus</h1>
              <p className="text-[11px] font-medium text-[#102f5f]">Hospital Management System</p>
            </div>
          </div>
          <button onClick={onClose} className="ml-auto lg:hidden"><X size={20} /></button>
        </div>

        <nav className="flex-1 px-6 py-4">
          {adminNavigation.map(([label, href, Icon]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={label} href={href} onClick={onClose}
                className={`mb-2 flex h-[44px] items-center gap-4 rounded-[9px] px-4 text-[14px] font-medium transition ${active ? "bg-[#2d91e8] text-white shadow-sm" : "text-[#294b76] hover:bg-[#f1f7fe]"}`}>
                <Icon size={20} strokeWidth={1.8} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6 pb-6">
          <div className="relative overflow-hidden rounded-xl bg-[#edf6ff] p-5">
            <div className="relative z-10">
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#168bea]"><HeartPulse size={17} /></div>
              <p className="text-xs font-medium text-[#365d8c]">Better Care</p>
              <p className="text-xs text-[#365d8c]">Healthier Communities</p>
            </div>
            <div className="absolute -bottom-10 -left-4 h-20 w-[130%] rounded-[50%] bg-[#dfefff]" />
          </div>
        </div>
      </aside>
    </>
  );
}
