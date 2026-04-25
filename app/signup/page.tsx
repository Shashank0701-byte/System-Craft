import AuthCard from "../../components/AuthCard";

export default function SignupPage() {
    return (
        <main className="h-screen w-screen flex overflow-hidden">
            {/* Left panel — brand visual */}
            <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#0b0618]">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: "url('https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80')",
                        opacity: 0.25,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b0618] via-primary/20 to-[#120b2a]" />

                <div className="absolute inset-0 flex flex-col items-center justify-center px-12 z-10">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                            <span className="material-symbols-outlined text-primary text-[24px]">hub</span>
                        </div>
                        <span className="text-2xl font-bold text-white tracking-tight">SystemCraft</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white text-center leading-tight mb-4">
                        Start your journey<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary/60">
                            to interview mastery.
                        </span>
                    </h2>
                    <p className="text-slate-400 text-center max-w-sm leading-relaxed">
                        Join thousands of engineers who practice system design with real AI feedback.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-3 justify-center">
                        {[
                            { icon: 'group', label: '2,400+ engineers' },
                            { icon: 'star', label: '4.9 rating' },
                            { icon: 'bolt', label: 'Real-time AI' },
                        ].map(s => (
                            <div key={s.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-300">
                                <span className="material-symbols-outlined text-primary text-[16px]">{s.icon}</span>
                                {s.label}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex-1 flex items-center justify-center bg-[#0d0b1a] lg:bg-[#0f0d1f] px-6 py-12 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex lg:hidden items-center gap-2 mb-8">
                        <div className="size-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
                            <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                        </div>
                        <span className="text-lg font-bold text-white">SystemCraft</span>
                    </div>
                    <AuthCard mode="signup" />
                </div>
            </div>
        </main>
    );
}
