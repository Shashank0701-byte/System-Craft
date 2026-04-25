import Navbar from "@/components/Navbar";
import { GalaxyHero } from "@/components/ui/galaxy-hero";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow relative overflow-hidden">
        <GalaxyHero />
        <Features />
        <Footer />
      </main>
    </>
  );
}
