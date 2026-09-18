import type { LucideIcon } from "lucide-react";

type NurseStatCardProps = {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
};

export default function NurseStatCard({
  label,
  value,
  change,
  icon: Icon,
}: NurseStatCardProps) {
  return (
    <div className="rounded-xl border border-[#e5eef9] bg-white p-5 shadow-[0_2px_10px_rgba(28,78,121,0.03)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#7390b4]">
            {label}
          </p>

          <p className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-[#102f5f]">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-[#6f8aaa]">
            {change}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#edf6ff] text-[#2d91e8]">
          <Icon size={20} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}