"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  HeartPulse,
  Headphones,
  X,
} from "lucide-react";

import { roleNavigation, type DashboardRole } from "./navigation";

type SidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
  role: DashboardRole;
};

export default function Sidebar({
  mobileOpen,
  onClose,
  role,
}: SidebarProps) {
  const pathname = usePathname();

  const navigation = roleNavigation[role];

  return (
    <>
      {/* =================================
          MOBILE OVERLAY
      ================================== */}
      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
        />
      )}

      {/* =================================
          SIDEBAR
      ================================== */}
      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-[273px]
          flex-col
          border-r
          border-[#e1ebf7]
          bg-white
          transition-transform
          duration-300

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* =================================
            LOGO
        ================================== */}
        <div className="flex h-[96px] items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#168bea] text-white">
              <HeartPulse
                size={27}
                strokeWidth={2}
              />
            </div>

            <div>
              <h1 className="text-[24px] font-bold tracking-[-0.04em] text-[#102f5f]">
                CarePlus
              </h1>

              <p className="text-[11px] font-medium text-[#102f5f]">
                Hospital Management System
              </p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-[#55749a] lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* =================================
            ROLE-SPECIFIC NAVIGATION
        ================================== */}
        <nav className="flex-1 overflow-y-auto px-6 py-4">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  mb-2
                  flex
                  h-[44px]
                  items-center
                  gap-4
                  rounded-[9px]
                  px-4
                  text-[14px]
                  font-medium
                  transition

                  ${
                    active
                      ? "bg-[#2d91e8] text-white shadow-sm"
                      : "text-[#294b76] hover:bg-[#f1f7fe]"
                  }
                `}
              >
                <Icon
                  size={20}
                  strokeWidth={1.8}
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* =================================
            BOTTOM CARD
        ================================== */}
        <div className="px-6 pb-6">
          <div className="relative overflow-hidden rounded-xl bg-[#edf6ff] p-5">
            <div className="relative z-10">
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#168bea]">
                <HeartPulse size={17} />
              </div>

              <p className="text-xs font-medium text-[#365d8c]">
                Better Care
              </p>

              <p className="text-xs text-[#365d8c]">
                Healthier Communities
              </p>
            </div>

            <div className="absolute -bottom-10 -left-4 h-20 w-[130%] rounded-[50%] bg-[#dfefff]" />
          </div>

          {/* Support */}
          <div className="mt-5 flex items-center gap-3 px-2 text-[#7390b4]">
            <Headphones size={19} />

            <div>
              <p className="text-xs font-medium">
                Need help?
              </p>

              <p className="text-[11px]">
                Contact support
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
