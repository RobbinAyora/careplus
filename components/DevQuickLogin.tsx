"use client";

import { useState } from "react";
import { mockUsers } from "@/lib/auth/mock-users";

export default function DevQuickLogin({
  onSelect,
}: {
  onSelect: (email: string, password: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs font-medium text-slate-500 hover:text-slate-700"
      >
        {open ? "Hide" : "Show"} Dev: quick login
      </button>

      {open && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mockUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => onSelect(user.email, user.password)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue"
            >
              {user.email} — {user.role}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
