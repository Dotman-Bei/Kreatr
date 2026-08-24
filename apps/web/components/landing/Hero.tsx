import { ArrowRight, Zap } from "lucide-react";
import { NeoLink } from "@/components/ui/NeoButton";
import { FloatingCards, StackedCards } from "@/components/landing/FloatingCards";
import { socialProof } from "@/lib/images";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-[132px] sm:px-6 sm:pt-[150px]">
      {/* Soft radial disc behind the headline */}
      <div
        className="absolute left-1/2 top-1/2 -z-10 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-200/50 blur-3xl"
        aria-hidden
      />
      <div className="grid-lines absolute inset-0 -z-10 opacity-60" aria-hidden />

      <div className="relative mx-auto min-h-[640px] max-w-7xl xl:min-h-[830px] 2xl:max-w-[1440px]">
        <FloatingCards />

        <div className="relative z-10 mx-auto max-w-[640px] text-center lg:max-w-3xl xl:max-w-[700px] 2xl:max-w-[880px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-black px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
            <Zap className="h-3.5 w-3.5 fill-lime-custom text-lime-custom" />
            Powered by Strands Agents SDK &amp; AWS Bedrock
          </div>

          {/* Sizes step down at xl so "Your Post-Production," stays on one line
              in the narrower column the floating cards leave behind. */}
          <h1 className="mx-auto text-5xl font-extrabold leading-[1.08] tracking-tight text-[#0A0A0A] sm:text-6xl lg:text-7xl xl:text-[54px] 2xl:text-[68px]">
            Your Post-Production,
            <br />
            <span className="underline decoration-lime-custom decoration-wavy decoration-4 underline-offset-[6px]">
              Handled.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg font-medium leading-relaxed text-zinc-600">
            One finished video in. An autonomous multi-platform workflow out. Kreatr observes,
            extracts the hooks worth keeping, rejects the fluff, and only asks for your approval.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
            <NeoLink href="/dashboard" variant="lime" size="lg" className="w-full sm:w-auto">
              Try Live Demo
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </NeoLink>
            <NeoLink href="#architecture" variant="white" size="lg" className="w-full sm:w-auto">
              View Agent Architecture
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </NeoLink>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <div className="flex -space-x-2.5">
              {socialProof.map((person) => (
                <img
                  key={person.name}
                  src={person.src}
                  alt={`${person.name}, Kreatr creator`}
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="h-9 w-9 rounded-full border-2 border-lime-custom object-cover ring-2 ring-white"
                />
              ))}
            </div>
            <p className="text-sm font-medium text-zinc-600">
              <span className="font-bold text-black">2,400+</span> creators stopped doing the second
              job
            </p>
          </div>
        </div>

        <StackedCards />
      </div>
    </section>
  );
}
