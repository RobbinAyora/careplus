
import {
  Activity,
  Droplets,
  HeartPulse,
  Scale,
  Thermometer,
} from "lucide-react";
import type { Vitals } from "@/lib/patients/patient-types";

interface Props {
  vitals: Vitals;
}

export default function VitalsSnapshot({
  vitals,
}: Props) {
  const items = [
    {
      label: "Blood Pressure",
      value: vitals.bloodPressure,
      icon: Activity,
    },
    {
      label: "Temperature",
      value: `${vitals.temperature} °C`,
      icon: Thermometer,
    },
    {
      label: "Weight",
      value: `${vitals.weight} kg`,
      icon: Scale,
    },
    {
      label: "Pulse",
      value: `${vitals.pulse} bpm`,
      icon: HeartPulse,
    },
  ];

  return (
    <section className="rounded-2xl border border-blue-50 bg-white p-5 shadow-[0_4px_20px_rgba(37,99,235,0.04)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#102a56]">
            Vitals Snapshot
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Most recently recorded
          </p>
        </div>

        <HeartPulse className="h-5 w-5 text-blue-500" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-xl bg-blue-50/60 p-4"
            >
              <Icon className="h-4 w-4 text-blue-500" />

              <p className="mt-3 text-[11px] text-slate-400">
                {item.label}
              </p>

              <p className="mt-1 text-sm font-bold text-[#102a56]">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

