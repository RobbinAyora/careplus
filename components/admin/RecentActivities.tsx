import { CalendarDays, ClipboardList, UserPlus, UsersRound } from "lucide-react";

const activities = [
  ["New patient registered", "Mary Wanjiku · 08:42 AM", UsersRound],
  ["Staff member added", "Dr. Peter Kamau · 07:15 AM", UserPlus],
  ["Report completed", "Lab Results · 06:30 AM", ClipboardList],
  ["Appointment updated", "Room 3 · 05:12 AM", CalendarDays],
] as const;

export default function RecentActivities() {
  return (
    <section className="rounded-xl border border-[#deebf7] bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[#102f5f]">Recent Activities</h2>
        <button className="text-[11px] font-medium text-[#168bea]">View all</button>
      </div>

      <div className="mt-3 space-y-3">
        {activities.map(([title, detail, Icon]) => (
          <div key={title} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#edf6ff] text-[#168bea]">
              <Icon size={16} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#173b6c]">{title}</p>
              <p className="truncate text-[10px] text-[#6c89ae]">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
