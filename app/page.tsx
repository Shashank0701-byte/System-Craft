import Navbar from "@/components/Navbar";
import { GalaxyHero } from "@/components/ui/galaxy-hero";
import { CyberneticBentoGrid } from "@/components/ui/cybernetic-bento-grid";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow relative overflow-hidden">
        <GalaxyHero />
        <CyberneticBentoGrid />
        <Footer />
      </main>
    </>
  );
}
