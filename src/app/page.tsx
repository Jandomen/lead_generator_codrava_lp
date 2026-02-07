import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-background">

            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                        L
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-foreground">LeadGen<span className="text-primary">Pro</span></span>
                </div>
                <div className="hidden md:flex items-center gap-8 text-secondary font-medium">
                    <a href="#" className="hover:text-primary transition-colors">Características</a>
                    <a href="#" className="hover:text-primary transition-colors">Precios</a>
                    <a href="#" className="hover:text-primary transition-colors">Testimonios</a>
                </div>
                <Link
                    href="/crm"
                    className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold hover:bg-blue-600 transition-all hover:shadow-lg hover:shadow-blue-500/30"
                >
                    Empezar Ahora
                </Link>
            </nav>

            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 flex flex-col items-center text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Nueva actualización 2.0 disponible
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl">
                    Genera Leads Cualificados en <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Segundos</span>
                </h1>

                <p className="text-xl text-secondary max-w-2xl mb-12 leading-relaxed">
                    Nuestra tecnología utiliza IA y Google Maps para encontrar clientes potenciales perfectamente segmentados para tu negocio local o digital.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-20">
                    <Link
                        href="/crm"
                        className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20"
                    >
                        Acceder al CRM
                    </Link>
                    <button className="px-8 py-4 bg-white dark:bg-slate-900 border border-border rounded-2xl font-bold text-lg hover:bg-accent transition-all">
                        Ver Demo
                    </button>
                </div>

                <div className="relative w-full max-w-5xl">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-white dark:bg-slate-900 border border-border rounded-3xl overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="mx-auto bg-white dark:bg-slate-700 px-4 py-1 rounded-lg text-xs text-secondary border border-border">
                                crm.leadgenpro.com
                            </div>
                        </div>
                        <div className="p-8 aspect-video flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-secondary">
                            Panel del CRM (Previsualización)
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
