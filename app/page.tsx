import { HeroSection } from "@/components/landing/hero-section";
import { Features } from "@/components/landing/features";
import { Statistics } from "@/components/landing/statistics";
import { Testimonials } from "@/components/landing/testimonials";
import { PricingSection } from "@/components/landing/pricing";
import { LandingNav } from "@/components/landing/landing-nav";
import { Footer } from "@/components/landing/footer";
import { ScrollToTop } from "@/components/landing/scroll-to-top";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <main>
        <HeroSection />
        <Features />
        <Statistics />
        <Testimonials />
        <PricingSection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
