import { CalendarPlus, ChevronRight, CreditCard, FlaskConical, Pill, UserRound } from "lucide-react";

const actions = [
  ["View Patient Records", UserRound],
  ["Prescribe Medication", Pill],
  ["Order Lab Tests", FlaskConical],
  ["View Billing", CreditCard],
] as const;

export default function QuickActions() {
  return (
    <div className="space-y-2">
      {actions.map(([label, Icon]) => (
        <button
          key={label}
          className="flex h-[60px] w-full items-center gap-4 rounded-xl border border-[#e0ebf7] bg-white px-5 text-left transition hover:border-[#bcdafa] hover:bg-[#f8fbff]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f8fd] text-[#163b6c]">
            <Icon size={19} strokeWidth={1.8} />
          </span>
          <span className="flex-1 text-[14px] font-medium text-[#163b6c]">{label}</span>
          <ChevronRight size={18} className="text-[#7b98bc]" />
        </button>
      ))}
    </div>
  );
}

export function NewAppointmentButton() {
  return (
    <button className="flex h-[56px] w-full items-center justify-center gap-3 rounded-xl bg-[#2d91e8] text-sm font-semibold text-white shadow-sm transition hover:bg-[#187fd8]">
      <CalendarPlus size={20} />
      New Appointment
    </button>
  );
}
