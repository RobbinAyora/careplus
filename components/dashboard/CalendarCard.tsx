import { ChevronLeft, ChevronRight } from "lucide-react";

const weeks = [
  [1, 2, 3, 4, 5, 6, 7],
  [8, 9, 10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19, 20, 21],
  [22, 23, 24, 25, 26, 27, 28],
  [29, 30, "", "", "", "", ""],
];

export default function CalendarCard() {
  return (
    <section className="rounded-xl border border-[#dfebf7] bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#102f5f]">September 2025</h2>
        <div className="flex gap-3 text-[#7895b8]">
          <button aria-label="Previous month"><ChevronLeft size={16} /></button>
          <button aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-4 text-center text-[10px] text-[#6d86a7]">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}

        {weeks.flat().map((day, i) => (
          <span
            key={`${day}-${i}`}
            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
              day === 16 ? "bg-[#258ce8] font-semibold text-white shadow-sm" : "text-[#234873]"
            }`}
          >
            {day}
          </span>
        ))}
      </div>
    </section>
  );
}
