import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24 relative">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid pointer-events-none z-0 opacity-40"></div>
        <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Hero />
        <Features />
        <Footer />
      </main>
    </>
  );
}
