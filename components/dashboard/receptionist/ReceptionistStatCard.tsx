import type { LucideIcon } from "lucide-react";
import { ArrowDown, ArrowUp } from "lucide-react";

type ReceptionistStatCardProps = {
  label: string;
  value: string;
  change: string;
  changeType: "up" | "down";
  icon: LucideIcon;
  iconStyle: "blue" | "green" | "purple" | "red";
};

const iconStyles = {
  blue: "bg-[#e5f2ff] text-[#2d91e8]",
  green: "bg-[#e5f9ee] text-[#34c58a]",
  purple: "bg-[#f0ebff] text-[#8b70e8]",
  red: "bg-[#fff0f0] text-[#f47777]",
};

export default function ReceptionistStatCard({
  label,
  value,
  change,
  changeType,
  icon: Icon,
  iconStyle,
}: ReceptionistStatCardProps) {
  return (
    <div className="rounded-xl border border-[#e1ecf8] bg-white p-5 shadow-[0_3px_14px_rgba(28,73,125,0.035)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-[#55749c]">
            {label}
          </p>

          <p className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[#102f5f]">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${iconStyles[iconStyle]}`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </div>
      </div>

      <div
        className={`mt-3 flex items-center gap-1 text-xs ${
          changeType === "up"
            ? "text-[#22a66f]"
            : "text-[#ef5d68]"
        }`}
      >
        {changeType === "up" ? (
          <ArrowUp size={13} />
        ) : (
          <ArrowDown size={13} />
        )}

        <span>{change}</span>
      </div>
    </div>
  );
}