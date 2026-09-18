import type { LucideIcon } from "lucide-react";

type Tone = "blue" | "green" | "purple" | "red";

const tones = {
  blue: {
    icon: "bg-[#e7f3ff] text-[#238de7]",
    border: "border-[#d6eaff]",
    trend: "text-[#19aa84]",
  },
  green: {
    icon: "bg-[#e7faf5] text-[#18ae84]",
    border: "border-[#d5f3e9]",
    trend: "text-[#19aa84]",
  },
  purple: {
    icon: "bg-[#f0edff] text-[#8b72e9]",
    border: "border-[#e5e0ff]",
    trend: "text-[#19aa84]",
  },
  red: {
    icon: "bg-[#fff0f1] text-[#ed5e67]",
    border: "border-[#ffe0e2]",
    trend: "text-[#ef5350]",
  },
};

export default function AdminStatCard({
  label,
  value,
  trend,
  comparison,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend: string;
  comparison: string;
  tone: Tone;
  icon: LucideIcon;
}) {
  const style = tones[tone];

  return (
    <article className={`rounded-xl border bg-white p-5 ${style.border}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${style.icon}`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>

      <p className="text-[14px] text-[#3f5f89]">{label}</p>

      <p className="mt-2 text-[27px] font-semibold leading-none tracking-[-0.03em] text-[#102f5f]">
        {value}
      </p>

      <p className={`mt-3 text-xs font-medium ${style.trend}`}>
        {trend}
      </p>
      <p className="mt-0.5 text-[11px] text-[#7290b5]">{comparison}</p>
    </article>
  );
}
