import Hero from "@/components/sections/Hero";
import WhoSection from "@/components/sections/WhoSection";
import KnowMe from "@/components/sections/KnowMe";
import WorkSection from "@/components/sections/WorkSection";
import ContactSection from "@/components/sections/ContactSection";

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <WhoSection />
      <KnowMe />
      <WorkSection />
      <ContactSection />
    </main>
  );
}
