import { FileText } from "lucide-react";

import { recentNotes } from "./nurse-data";

export default function RecentNursingNotes() {
  return (
    <section className="rounded-xl border border-[#e5eef9] bg-white shadow-[0_2px_10px_rgba(28,78,121,0.03)]">
      <div className="flex items-center gap-3 border-b border-[#edf2f8] px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf6ff] text-[#2d91e8]">
          <FileText size={17} />
        </div>

        <div>
          <h2 className="text-[16px] font-semibold text-[#102f5f]">
            Recent Nursing Notes
          </h2>

          <p className="mt-1 text-xs text-[#7892b2]">
            Latest updates you've recorded
          </p>
        </div>
      </div>

      <div className="divide-y divide-[#edf2f8]">
        {recentNotes.map((note) => (
          <div
            key={`${note.patient}-${note.time}`}
            className="px-5 py-4"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-[13px] font-medium text-[#294b76]">
                {note.patient}
              </p>

              <span className="shrink-0 text-[10px] text-[#9aacc2]">
                {note.time}
              </span>
            </div>

            <p className="mt-2 text-xs leading-5 text-[#7892b2]">
              {note.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}