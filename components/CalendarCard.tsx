export default function CalendarCard() {
  const days = [
    ["1", "2", "3", "4", "5", "6", "7"],
    ["8", "9", "10", "11", "12", "13", "14"],
    ["15", "16", "17", "18", "19", "20", "21"],
    ["22", "23", "24", "25", "26", "27", "28"],
    ["29", "30", "", "", "", "", ""],
  ];

  return (
    <section className="rounded-xl border border-[#deebf7] bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[#102f5f]">Calendar</h2>
        <div className="flex gap-3 text-[#5c7da5]"><button>‹</button><button>›</button></div>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[#173b6c]">September 2025</h3>

      <div className="mt-4 grid grid-cols-7 text-center text-[10px] text-[#55749c]">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <span key={d} className="pb-3">{d}</span>)}
        {days.flat().map((day, i) => (
          <span key={`${day}-${i}`} className="flex h-9 items-center justify-center text-xs text-[#315b91]">
            {day === "16" ? (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2d91e8] font-semibold text-white">{day}</span>
            ) : day}
          </span>
        ))}
      </div>
    </section>
  );
}
