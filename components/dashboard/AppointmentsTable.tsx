import { ChevronRight } from "lucide-react";
import { appointments } from "./dashboard-data";

function statusClass(status: string) {
  if (status === "Completed") return "bg-[#dff8ee] text-[#20a579]";
  if (status === "In Progress") return "bg-[#ddecff] text-[#2489df]";
  return "bg-[#e4f1ff] text-[#2588e2]";
}

export default function AppointmentsTable() {
  return (
    <section className="rounded-xl border border-[#dfebf7] bg-white">
      <div className="flex items-center justify-between px-5 pb-4 pt-5">
        <h2 className="text-[16px] font-semibold text-[#102f5f]">Appointments Today</h2>
        <button className="text-xs font-medium text-[#1688e5]">View all</button>
      </div>

      <div className="overflow-x-auto px-5 pb-4">
        <table className="w-full min-w-[560px] text-left">
          <thead>
            <tr className="border-b border-[#edf2f7] text-[11px] text-[#536f94]">
              <th className="py-3 font-medium">Time</th>
              <th className="py-3 font-medium">Patient</th>
              <th className="py-3 font-medium">Reason</th>
              <th className="py-3 font-medium">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {appointments.map(([time, patient, id, reason, status]) => (
              <tr key={id} className="border-b border-[#edf2f7] last:border-0">
                <td className="py-4 text-xs text-[#234a79]">{time}</td>
                <td className="py-4">
                  <p className="text-xs font-semibold text-[#102f5f]">{patient}</p>
                  <p className="mt-1 text-[10px] text-[#8299b9]">{id}</p>
                </td>
                <td className="py-4 text-xs text-[#36577f]">{reason}</td>
                <td className="py-4">
                  <span className={`rounded-full px-3 py-1.5 text-[10px] font-medium ${statusClass(status)}`}>
                    {status}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <ChevronRight size={16} className="ml-auto text-[#7594ba]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
