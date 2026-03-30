import Link from 'next/link';

interface HeroProps {
  userName?: string;
}

export function Hero({ userName = 'Designer' }: HeroProps) {
  return (
    <div className="mb-10 rounded-xl overflow-hidden relative h-48 group">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(90deg, rgba(19, 16, 34, 0.9) 0%, rgba(19, 16, 34, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAtRCSQVb85JQmudFxAKJIoRZ1HrjnneYx8sbPH3GzvF2r4op963-jOIHluHug-c-ucKm3gdfrRO3KFJxjObGWteeHHVlw_SG72JMnknbSKzens7TpkiSyF-YNRVGlXgXS0comNoGjDvb2g2LsjQFu7FNkAe9Lf3UfTGou4rPnE_KgoJk3tHtQIrNDa-NTtPKnDGwEKd7gE2AcFKXPyYq8a6kTfy9yvOOs3fxUcvozOaNh9fSR-qXKoMBwYws0EhV3BdHqvQnhc6wxA")' }}></div>
      <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Welcome back, {userName}</h2>
        <p className="text-slate-300 max-w-xl text-sm md:text-base line-clamp-2 md:line-clamp-none">Ready to architect your next big system? Create a new design or continue working on existing ones.</p>
        <div className="mt-4 md:mt-6 flex gap-3">
          <Link href="/practice" className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 rounded-lg text-xs md:text-sm font-medium text-white transition-colors cursor-pointer text-center">
            Browse Templates
          </Link>
        </div>
      </div>
    </div>
  );
}
