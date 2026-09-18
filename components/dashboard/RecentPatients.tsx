import { recentPatients } from "./dashboard-data";

export default function RecentPatients() {
  return (
    <section className="rounded-xl border border-[#dfebf7] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#102f5f]">Recent Patients</h2>
        <button className="text-xs font-medium text-[#1688e5]">View all</button>
      </div>

      <div className="space-y-5">
        {recentPatients.map(([name, id, age, gender, time], index) => (
          <div key={id} className="flex items-center gap-3">
            <img
              src={`https://i.pravatar.cc/80?img=${index + 32}`}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#173a6a]">{name}</p>
              <p className="mt-1 text-[10px] text-[#8298b7]">
                {id} • {age} • {gender}
              </p>
            </div>
            <span className="text-[10px] text-[#56769e]">{time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
