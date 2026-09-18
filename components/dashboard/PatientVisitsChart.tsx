import { visitValues } from "./dashboard-data";

export default function PatientVisitsChart() {
  const max = 40;
  const points = visitValues.map((value, i) => {
    const x = 18 + i * 35;
    const y = 130 - (value / max) * 105;
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="rounded-xl border border-[#dfebf7] bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#102f5f]">Patient Visits Overview</h2>
        <button className="text-xs text-[#526f95]">This Week⌄</button>
      </div>

      <div className="h-[180px]">
        <svg viewBox="0 0 245 155" className="h-full w-full" preserveAspectRatio="none">
          {[0, 10, 20, 30, 40].map((n) => {
            const y = 130 - (n / max) * 105;
            return (
              <g key={n}>
                <line x1="18" x2="235" y1={y} y2={y} stroke="#e8eef5" strokeWidth="1" />
                <text x="0" y={y + 4} fontSize="9" fill="#7590b3">{n}</text>
              </g>
            );
          })}
          <polyline
            points={points}
            fill="none"
            stroke="#258ce8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {visitValues.map((value, i) => {
            const x = 18 + i * 35;
            const y = 130 - (value / max) * 105;
            return <circle key={i} cx={x} cy={y} r="3.5" fill="#258ce8" />;
          })}
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
            <text key={d} x={18 + i * 35} y="150" textAnchor="middle" fontSize="9" fill="#718caf">
              {d}
            </text>
          ))}
        </svg>
      </div>
    </section>
  );
}
