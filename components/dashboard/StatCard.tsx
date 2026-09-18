import type { LucideIcon } from "lucide-react";

const tones = {
  blue: "bg-[#e7f3ff] text-[#238de7] border-[#d6eaff]",
  green: "bg-[#e9fbf7] text-[#39bf98] border-[#d5f5ec]",
  purple: "bg-[#f0edff] text-[#8d7af1] border-[#e6e1ff]",
  red: "bg-[#fff0f0] text-[#f47c7c] border-[#ffe0e0]",
};

export default function StatCard({
  label,
  value,
  trend,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string;
  trend: string;
  tone: keyof typeof tones;
  icon: LucideIcon;
}) {
  return (
    <div className={`rounded-xl border bg-white p-5 ${tones[tone].split(" ").find(x => x.startsWith("border-"))}`}>
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${tones[tone].split(" ").slice(0,2).join(" ")}`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <p className="text-[14px] text-[#3f5f89]">{label}</p>
      <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#102f5f]">
        {value}
      </p>
      <p className={`mt-4 text-xs ${tone === "red" ? "text-[#f15c62]" : tone === "purple" ? "text-[#6159e9]" : "text-[#27ad8c]"}`}>
        {trend}
      </p>
    </div>
  );
}
