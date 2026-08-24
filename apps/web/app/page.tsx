import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProblemChecklist } from "@/components/landing/ProblemChecklist";
import { BentoFeatures } from "@/components/landing/BentoFeatures";
import { ProcessStepper } from "@/components/landing/ProcessStepper";
import { MarqueeTicker } from "@/components/landing/MarqueeTicker";
import { ComparisonMatrix } from "@/components/landing/ComparisonMatrix";
import { ProofAndMetrics } from "@/components/landing/ProofAndMetrics";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { DemoWaitlistForm } from "@/components/landing/DemoWaitlistForm";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface-canvas">
      <Navbar />
      <Hero />
      <ProblemChecklist />
      <BentoFeatures />
      <ProcessStepper />
      <MarqueeTicker />
      <ComparisonMatrix />
      <ProofAndMetrics />
      <ArchitectureSection />
      <FAQSection />
      <DemoWaitlistForm />
      <Footer />
    </main>
  );
}
