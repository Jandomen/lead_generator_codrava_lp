'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WalletPage() {
    const [balance, setBalance] = useState(1250.50);
    const [showTopUp, setShowTopUp] = useState(false);

    const transactions = [
        { id: 1, type: 'search', amount: -2.50, description: 'Lead Generation - Restaurant Search', date: '2024-03-24 14:20' },
        { id: 2, type: 'ai', amount: -1.20, description: 'AI Analysis - 10 Leads', date: '2024-03-24 14:25' },
        { id: 3, type: 'topup', amount: 50.00, description: 'Credit Top-up', date: '2024-03-23 09:15' },
        { id: 4, type: 'search', amount: -1.50, description: 'Lead Generation - Tech Companies', date: '2024-03-22 18:40' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar (simplified for this view) */}
            <aside className="w-64 border-r border-border bg-white dark:bg-slate-900 hidden lg:flex flex-col">
                <div className="p-6 border-b border-border">
                    <Link href="/crm" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">L</div>
                        <span className="font-bold text-xl">Lead<span className="text-primary">CRM</span></span>
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/crm" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Dashboard
                    </Link>
                    <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Monedero
                    </div>
                </nav>
            </aside>

            <main className="flex-1 overflow-auto">
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-border px-8 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Monedero & Créditos</h1>
                    <Link href="/crm" className="text-sm font-medium text-primary hover:underline">Volver al CRM</Link>
                </header>

                <div className="p-8 max-w-5xl mx-auto space-y-8">
                    {/* Balance Hero Card */}
                    <div className="relative overflow-hidden group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                        <div className="relative bg-white dark:bg-slate-900 p-10 rounded-[2rem] border border-border shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                            <div>
                                <p className="text-secondary text-sm font-bold uppercase tracking-wider mb-2">Saldo Disponible</p>
                                <h2 className="text-6xl font-black tracking-tight text-slate-900 dark:text-white flex items-baseline gap-2">
                                    <span className="text-primary ring-offset-background">$</span>
                                    {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </h2>
                                <p className="text-secondary text-xs mt-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    Cuenta Premium Activa
                                </p>
                            </div>
                            <div className="flex flex-col gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => setShowTopUp(true)}
                                    className="px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-opacity-90 transform transition hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/25"
                                >
                                    Cargar Crédito
                                </button>
                                <button className="px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl font-bold text-sm hover:bg-opacity-80 transition">
                                    Historial de Facturas
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Transaction History */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-xl font-bold px-2">Transacciones Recientes</h3>
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-border shadow-sm overflow-hidden">
                                <div className="divide-y divide-border">
                                    {transactions.map((t) => (
                                        <div key={t.id} className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${t.type === 'topup' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' :
                                                        t.type === 'ai' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                                                            'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                                    }`}>
                                                    {t.type === 'topup' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
                                                    {t.type === 'ai' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                                    {t.type === 'search' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">{t.description}</p>
                                                    <p className="text-[10px] text-secondary font-medium uppercase tracking-wider">{t.date}</p>
                                                </div>
                                            </div>
                                            <div className={`font-black tracking-tight ${t.amount > 0 ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                                                {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center border-t border-border">
                                    <button className="text-secondary text-xs font-bold uppercase hover:text-primary transition">Ver todo el historial</button>
                                </div>
                            </div>
                        </div>

                        {/* Stats / Info Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-[2rem] text-white shadow-lg space-y-4">
                                <h4 className="font-bold text-lg">Plan Automático</h4>
                                <p className="text-indigo-100 text-sm opacity-90 text-pretty">
                                    Tu cuenta está configurada para recargar automáticamente cuando el saldo baje de $50.00.
                                </p>
                                <button className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-bold text-sm transition">
                                    Configurar Auto-pago
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-border space-y-4">
                                <h4 className="font-bold">Consumo de IA</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-secondary font-medium uppercase">Mensual</span>
                                        <span className="font-bold">$42.30 / $250.00</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-1/6"></div>
                                    </div>
                                    <p className="text-[10px] text-secondary">
                                        Has ahorrado aproximadamente <span className="text-green-500 font-bold">12 horas</span> de trabajo manual este mes gracias a la IA.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Top Up Modal */}
            {showTopUp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-white/10 transform animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">Cargar Saldo</h2>
                                <p className="text-secondary text-sm mt-1">Selecciona el monto a añadir</p>
                            </div>
                            <button onClick={() => setShowTopUp(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            {[25, 50, 100, 250].map(amount => (
                                <button key={amount} className="p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary transition font-bold text-xl group relative overflow-hidden">
                                    <span className="relative z-10">${amount}</span>
                                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity"></div>
                                </button>
                            ))}
                        </div>

                        <button className="w-full py-5 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02]">
                            Pagar Ahora
                        </button>

                        <p className="text-center text-[10px] text-secondary mt-6 font-medium uppercase tracking-widest">
                            ⚡️ Procesado de forma segura por Stripe
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
