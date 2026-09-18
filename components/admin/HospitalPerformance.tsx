const points = [
  [0, 68], [1, 102], [2, 76], [3, 110], [4, 104], [5, 166], [6, 137],
];

export default function HospitalPerformance() {
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x * 67 + 20} ${180 - y}`)
    .join(" ");

  return (
    <section className="rounded-xl border border-[#e0ebf7] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-[#102f5f]">
          Hospital Performance
        </h2>
        <button className="rounded-lg bg-[#f5f9fe] px-3 py-2 text-xs text-[#315b91]">
          This Month⌄
        </button>
      </div>

      <div className="mt-5 grid grid-cols-4">
        {[
          ["Admissions", "324", "↑ 10%"],
          ["Discharges", "298", "↑ 8%"],
          ["ER Visits", "64", "↑ 12%"],
          ["Avg. Stay (Days)", "3.2", "↓ 6%"],
        ].map(([label, value, trend]) => (
          <div key={label} className="border-r border-[#e4edf7] px-3 first:pl-1 last:border-r-0">
            <p className="text-[11px] text-[#55749c]">{label}</p>
            <p className="mt-1 text-[20px] font-semibold text-[#173b70]">{value}</p>
            <p className={`text-xs ${trend.startsWith("↓") ? "text-[#168bea]" : "text-[#16ad84]"}`}>
              {trend}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 h-[170px] w-full">
        <svg viewBox="0 0 490 190" className="h-full w-full" preserveAspectRatio="none">
          {[0, 50, 100, 150, 200].map((n, i) => (
            <g key={n}>
              <line x1="20" x2="475" y1={180 - i * 40} y2={180 - i * 40} stroke="#e9f0f7" />
              <text x="0" y={184 - i * 40} fontSize="10" fill="#6685ab">{n}</text>
            </g>
          ))}
          <path d={`${path} L 422 180 L 20 180 Z`} fill="#e9f4ff" />
          <path d={path} fill="none" stroke="#248ce9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x * 67 + 20} cy={180 - y} r="3.5" fill="#248ce9" />
          ))}
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
            <text key={d} x={i * 67 + 10} y="188" fontSize="10" fill="#6685ab">{d}</text>
          ))}
        </svg>
      </div>
    </section>
  );
}
