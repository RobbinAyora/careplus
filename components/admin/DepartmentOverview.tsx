import { Building2 } from "lucide-react";
import { departments } from "./admin-data";

export default function DepartmentOverview() {
  return (
    <section className="rounded-xl border border-[#e0ebf7] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#102f5f]">Department Overview</h2>
        <button className="text-xs font-medium text-[#168bea]">View all</button>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_60px_70px] border-b border-[#edf2f8] pb-3 text-[11px] text-[#55749c]">
        <span>Department</span><span>Patients</span><span>Status</span>
      </div>

      <div>
        {departments.map(([name, patients, status]) => (
          <div key={name} className="grid grid-cols-[1fr_60px_70px] items-center border-b border-[#edf2f8] py-2.5 last:border-0">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#168bea]">
                <Building2 size={14} />
              </span>
              <span className="truncate text-xs font-medium text-[#183b6c]">{name}</span>
            </div>
            <span className="text-xs text-[#315b91]">{patients}</span>
            <span className={`rounded-full px-2 py-1 text-center text-[10px] ${
              status === "High"
                ? "bg-[#ffe5e7] text-[#ed4f5a]"
                : status === "Moderate"
                ? "bg-[#fff2cf] text-[#bd7b00]"
                : "bg-[#def8ee] text-[#12956f]"
            }`}>
              {status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
