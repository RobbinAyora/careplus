import { admissions } from "./admin-data";

export default function RecentAdmissions() {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e0ebf7] bg-white">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-[16px] font-semibold text-[#102f5f]">Recent Admissions</h2>
        <button className="text-xs font-medium text-[#168bea]">View all</button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[1.3fr_.45fr_.55fr_1.1fr_1.45fr_.75fr] gap-3 bg-[#f7fbff] px-5 py-2 text-[10px] text-[#55749c]">
            <span>Patient Name</span><span>Age</span><span>Gender</span><span>Department</span><span>Admission Date</span><span>Status</span>
          </div>

          {admissions.map(([initials, name, age, gender, dept, date, status]) => (
            <div key={name} className="grid grid-cols-[1.3fr_.45fr_.55fr_1.1fr_1.45fr_.75fr] items-center gap-3 border-t border-[#edf2f8] px-5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e7f3ff] text-[9px] font-semibold text-[#168bea]">
                  {initials}
                </span>
                <span className="text-xs font-medium text-[#183b6c]">{name}</span>
              </div>
              <span className="text-xs text-[#55749c]">{age}</span>
              <span className="text-xs text-[#55749c]">{gender}</span>
              <span className="text-xs text-[#315b91]">{dept}</span>
              <span className="text-[11px] text-[#6685ab]">{date}</span>
              <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] ${
                status === "Discharged" ? "bg-[#e4f0ff] text-[#2687dd]" : "bg-[#def8ee] text-[#12956f]"
              }`}>
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
