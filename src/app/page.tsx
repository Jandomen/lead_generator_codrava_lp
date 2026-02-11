import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white">

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/5 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-indigo-500/5 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-50"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto mt-4 glass border-white/5 mx-4 md:mx-auto">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 flex items-center justify-center p-1 rounded-xl bg-black/40 border border-amber-500/20">
                        <img src="/logo-circle.png" alt="Codrava" className="w-10 h-10 object-contain" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-black tracking-tighter gold-text leading-tight">CODRAVA LP</span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.3em] opacity-40 ml-0.5">Intelligence OSINT</span>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-10 text-[10px] uppercase font-black tracking-[0.2em] opacity-70">
                    <a href="#" className="hover:text-amber-400 transition-colors">Características</a>
                    <a href="#" className="hover:text-amber-400 transition-colors">Precios</a>
                    <a href="#" className="hover:text-amber-400 transition-colors">Testimonios</a>
                </div>
                <Link
                    href="/crm"
                    className="gold-button px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                >
                    Acceder al CRM
                </Link>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-24 pb-32 flex flex-col items-center">

                {/* Badge Overlay */}
                <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-500 text-[10px] font-black uppercase tracking-[0.3em] mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Nueva actualización 2.0 disponible
                </div>

                <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 max-w-5xl leading-[0.9] text-center">
                    Multiplica tus Ventas con <br />
                    <span className="gold-text">Minería de Leads Avanzada</span>
                </h1>

                <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-14 leading-relaxed text-center font-medium opacity-80">
                    Potenciamos tu fuerza comercial con inteligencia artificial y datos OSINT. Encuentra, analiza y contacta a tus clientes ideales en cuestión de segundos.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 mb-24 w-full justify-center">
                    <Link
                        href="/crm"
                        className="gold-button px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all text-center"
                    >
                        🚀 Generar Leads Ahora
                    </Link>
                    <button className="px-12 py-5 glass border-white/10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all active:scale-95 text-center">
                        Ver Demo Interactiva
                    </button>
                </div>

                {/* Dashboard Preview */}
                <div className="relative w-full max-w-6xl animate-float group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/30 to-amber-200/5 rounded-[3rem] blur-[50px] opacity-20 transition duration-1000 group-hover:opacity-40"></div>

                    <div className="relative glass border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
                        {/* Browser Shell */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-black/40 backdrop-blur-md">
                            <div className="flex gap-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#FF5F57]"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E]"></div>
                                <div className="w-3.5 h-3.5 rounded-full bg-[#27C93F]"></div>
                            </div>
                            <div className="flex-1 max-w-md mx-auto hidden md:block">
                                <div className="bg-white/5 px-6 py-2 rounded-full text-[10px] text-neutral-500 font-bold border border-white/5 text-center truncate">
                                    https://crm.codrava.lp/pipeline
                                </div>
                            </div>
                            <div className="w-20"></div> {/* Spacer */}
                        </div>

                        {/* Preview Content */}
                        <div className="relative aspect-[16/10] bg-[#050505] overflow-hidden">
                            {/* Dashboard Mockup Layout */}
                            <div className="flex h-full p-4 gap-4 grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700">
                                {/* Sidebar Mockup */}
                                <div className="w-64 glass border-white/5 rounded-2xl p-4 hidden lg:flex flex-col gap-4 bg-black/40">
                                    <div className="w-32 h-8 bg-amber-500/10 border border-amber-500/20 rounded-lg"></div>
                                    <div className="flex flex-col gap-2 opacity-30">
                                        <div className="h-4 w-full bg-white/10 rounded-full"></div>
                                        <div className="h-4 w-full bg-white/10 rounded-full"></div>
                                        <div className="h-4 w-3/4 bg-white/10 rounded-full"></div>
                                    </div>
                                    <div className="mt-auto h-24 w-full bg-gradient-to-br from-amber-500/5 to-transparent rounded-2xl border border-amber-500/10"></div>
                                </div>

                                {/* Main Content Mockup */}
                                <div className="flex-1 flex flex-col gap-4">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-4 gap-3">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="h-24 glass border-white/5 rounded-2xl bg-black/30 p-4">
                                                <div className="w-1/2 h-2 bg-amber-500/20 rounded-full mb-3"></div>
                                                <div className="w-3/4 h-5 bg-white/5 rounded-lg"></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pipeline Table Mockup */}
                                    <div className="flex-1 glass border-white/5 rounded-[2rem] bg-black/40 p-6 flex flex-col gap-4">
                                        <div className="flex justify-between">
                                            <div className="w-48 h-6 bg-amber-500/10 rounded-lg"></div>
                                            <div className="w-24 h-6 bg-white/5 rounded-lg"></div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div key={i} className="h-16 w-full bg-white/2 rounded-2xl border border-white/2"></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center Logo Overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm group-hover:bg-transparent group-hover:backdrop-blur-none transition-all duration-700">
                                <div className="flex flex-col items-center gap-6 animate-float transition-all group-hover:opacity-0 group-hover:scale-150 duration-700">
                                    <div className="w-32 h-32 p-4 glass border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(212,175,55,0.15)] flex items-center justify-center">
                                        <img src="/logo-circle.png" alt="Codrava" className="w-24 h-24 object-contain" />
                                    </div>
                                    <div className="text-center">
                                        <h2 className="text-2xl font-black gold-text tracking-tight">CODRAVA INTELLIGENCE</h2>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-neutral-500 mt-2">Acceso al Sistema Pro</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hover Action */}
                            <div className="absolute bottom-12 inset-x-0 flex justify-center opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                                <Link
                                    href="/crm"
                                    className="gold-button px-12 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl"
                                >
                                    Abrir Panel de Control
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Section */}
            <footer className="relative z-10 border-t border-white/5 bg-black/20 py-20">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-amber-500/20">
                            <img src="/logo-circle.png" alt="CODRAVA" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-sm font-black gold-text">CODRAVA LP</span>
                    </div>
                    <div className="flex gap-10 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                        <a href="#" className="hover:text-white transition-colors">Twitter</a>
                        <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
                        <a href="#" className="hover:text-white transition-colors">Discord</a>
                    </div>
                    <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                        © 2026 CODRAVA OSINT ENGINE V2.0
                    </p>
                </div>
            </footer>
        </div>
    );
}
