import { BarChart3, CreditCard, Settings, UsersRound, ChevronRight } from "lucide-react";

const actions = [
  ["Manage Users", UsersRound],
  ["View Reports", BarChart3],
  ["Hospital Settings", Settings],
  ["System Logs", CreditCard],
] as const;

export default function QuickActions() {
  return (
    <div className="space-y-2">
      {actions.map(([label, Icon]) => (
        <button
          key={label}
          className="flex h-[55px] w-full items-center gap-4 rounded-xl border border-[#deebf7] bg-white px-4 text-left transition hover:border-[#bcd9f4] hover:bg-[#fbfdff]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f7fd] text-[#173f74]">
            <Icon size={18} />
          </span>
          <span className="flex-1 text-sm font-medium text-[#173b6c]">{label}</span>
          <ChevronRight size={17} className="text-[#7190b6]" />
        </button>
      ))}
    </div>
  );
}
