import { Headphones } from "lucide-react";

export default function HelpCard() {
  return (
    <section className="rounded-xl bg-[#edf6ff] p-5">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#168bea]">
          <Headphones size={20} />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-[#173b6c]">Need help?</h2>
          <p className="mt-2 text-xs leading-5 text-[#55749c]">Contact support for any issues or assistance.</p>
          <button className="mt-3 text-xs font-semibold text-[#168bea]">Get Support →</button>
        </div>
      </div>
    </section>
  );
}
