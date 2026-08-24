import { Zap } from "lucide-react";
import { marqueeItems } from "@/lib/mockData";

export function MarqueeTicker() {
  const items = [...marqueeItems, ...marqueeItems];

  return (
    <section
      className="overflow-hidden border-y-2 border-black bg-[#0A0A0A] py-4"
      aria-label="Feature highlights"
    >
      <div className="flex w-max animate-marquee-fast items-center">
        {items.map((item, index) => (
          <div key={`${item}-${index}`} className="flex items-center gap-6 px-6">
            <span className="whitespace-nowrap text-lg font-extrabold uppercase tracking-tight text-white sm:text-xl">
              {item}
            </span>
            <Zap className="h-4 w-4 shrink-0 fill-lime-custom text-lime-custom" />
          </div>
        ))}
      </div>
    </section>
  );
}
