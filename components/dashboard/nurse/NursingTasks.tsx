import {
  CheckCircle2,
  Circle,
  Clock3,
} from "lucide-react";

import { nursingTasks } from "./nurse-data";

export default function NursingTasks() {
  return (
    <section className="rounded-xl border border-[#e5eef9] bg-white shadow-[0_2px_10px_rgba(28,78,121,0.03)]">
      <div className="border-b border-[#edf2f8] px-5 py-4">
        <h2 className="text-[16px] font-semibold text-[#102f5f]">
          Nursing Tasks
        </h2>

        <p className="mt-1 text-xs text-[#7892b2]">
          Your tasks for today
        </p>
      </div>

      <div className="divide-y divide-[#edf2f8]">
        {nursingTasks.map((task) => (
          <div
            key={`${task.title}-${task.patient}`}
            className="flex items-center gap-3 px-5 py-4"
          >
            {task.completed ? (
              <CheckCircle2
                size={19}
                className="shrink-0 text-[#35a56b]"
              />
            ) : (
              <Circle
                size={19}
                className="shrink-0 text-[#b8c8da]"
              />
            )}

            <div className="min-w-0 flex-1">
              <p
                className={`text-[13px] font-medium ${
                  task.completed
                    ? "text-[#9aacc2] line-through"
                    : "text-[#294b76]"
                }`}
              >
                {task.title}
              </p>

              <p className="mt-0.5 text-[11px] text-[#8aa0bc]">
                {task.patient}
              </p>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-[10px] text-[#8aa0bc]">
                <Clock3 size={12} />
                {task.time}
              </div>

              <span
                className={`mt-1 inline-block text-[9px] font-medium ${
                  task.priority === "High"
                    ? "text-[#d45b5b]"
                    : task.priority === "Medium"
                      ? "text-[#b27a17]"
                      : "text-[#7892b2]"
                }`}
              >
                {task.priority} priority
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}