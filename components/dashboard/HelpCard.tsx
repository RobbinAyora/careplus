import { ArrowRight, Stethoscope } from "lucide-react";

export default function HelpCard() {
  return (
    <section className="rounded-xl bg-[#edf6ff] p-5">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#258ce8]">
          <Stethoscope size={20} />
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-[#102f5f]">Need help?</h2>
          <p className="mt-2 text-xs leading-5 text-[#5c79a0]">
            Contact support for any issues or assistance.
          </p>
          <button className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#1688e5]">
            Get Support <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}
