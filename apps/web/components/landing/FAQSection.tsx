"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { faqs } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-y-2 border-black bg-lime-custom px-5 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-12 text-center text-4xl font-extrabold tracking-tight text-black md:text-6xl">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border-2 border-black bg-black text-white shadow-neo transition-shadow"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <span className="text-base font-extrabold leading-snug tracking-tight sm:text-lg">
                    {faq.q}
                  </span>
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                      isOpen
                        ? "border-lime-custom bg-lime-custom text-black"
                        : "border-zinc-700 text-lime-custom",
                    )}
                  >
                    {isOpen ? (
                      <Minus className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      <Plus className="h-4 w-4" strokeWidth={3} />
                    )}
                  </span>
                </button>

                {isOpen ? (
                  <div className="animate-fade-up px-6 pb-6">
                    <p className="border-t border-zinc-800 pt-4 text-[15px] leading-relaxed text-zinc-400">
                      {faq.a}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
