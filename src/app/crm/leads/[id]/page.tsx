'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

interface Lead {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    status: string;
    rating?: number;
    reviewsCount?: number;
    createdAt: string;
}

interface Interaction {
    _id: string;
    type: 'note' | 'call' | 'email' | 'meeting' | 'status_change';
    content: string;
    createdAt: string;
}

export default function LeadDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [lead, setLead] = useState<Lead | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [noteContent, setNoteContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            const [leadRes, interactionsRes] = await Promise.all([
                axios.get(`/api/leads/${id}`),
                axios.get(`/api/interactions?leadId=${id}`)
            ]);
            setLead(leadRes.data);
            setInteractions(interactionsRes.data);
        } catch (error) {
            console.error('Error fetching lead data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const handleAddInteraction = async (type: 'note' | 'call' | 'email' | 'meeting') => {
        if (!noteContent.trim() && type === 'note') return;

        setIsSaving(true);
        try {
            const content = type === 'note' ? noteContent : `Se registró una ${type}`;
            const response = await axios.post('/api/interactions', {
                leadId: id,
                type,
                content
            });
            setInteractions([response.data, ...interactions]);
            setNoteContent('');
        } catch (error) {
            console.error('Error adding interaction:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const response = await axios.patch('/api/leads', { leadId: id, status: newStatus });
            setLead(response.data);
            // Refresh interactions to see the status change log
            const interactionsRes = await axios.get(`/api/interactions?leadId=${id}`);
            setInteractions(interactionsRes.data);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    if (isLoading) return <div className="p-8 text-center">Cargando...</div>;
    if (!lead) return <div className="p-8 text-center">Lead no encontrado.</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header / Navigation */}
                <div className="flex items-center justify-between">
                    <Link href="/crm" className="text-sm font-medium text-secondary hover:text-primary flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Volver al CRM
                    </Link>
                    <div className="flex gap-2">
                        <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className={`text-sm font-bold px-4 py-2 rounded-xl outline-none shadow-sm cursor-pointer border ${lead.status === 'interested' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                lead.status === 'new' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                        >
                            <option value="new">Nuevo</option>
                            <option value="contacted">Contactado</option>
                            <option value="interested">Interesado</option>
                            <option value="not_interested">No Interesado</option>
                            <option value="converted">Convertido</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Lead Info */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                                <span className="text-2xl font-bold">{lead.name.charAt(0)}</span>
                            </div>
                            <h1 className="text-xl font-bold mb-1">{lead.name}</h1>
                            <p className="text-sm text-secondary mb-4">{lead.address || 'Sin dirección'}</p>

                            <div className="space-y-4 pt-4 border-t border-border">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-secondary">Teléfono</p>
                                    <p className="text-sm font-medium">{lead.phone || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-secondary">Email</p>
                                    <p className="text-sm font-medium">{lead.email || 'No registrado'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-secondary">Sitio Web</p>
                                    {lead.website ? (
                                        <a href={lead.website} target="_blank" className="text-sm font-medium text-blue-600 hover:underline">{lead.website}</a>
                                    ) : (
                                        <p className="text-sm font-medium">N/A</p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-secondary">Rating Google</p>
                                    <p className="text-sm font-medium">⭐️ {lead.rating} ({lead.reviewsCount} reseñas)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Activities & Notes */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* New Note Form */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border">
                            <h2 className="text-lg font-bold mb-4">Añadir Actividad</h2>
                            <textarea
                                placeholder="Escribe una nota interna sobre este lead..."
                                className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-950 outline-none focus:ring-2 focus:ring-primary transition-all mb-4 min-h-[100px]"
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value)}
                            />
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleAddInteraction('note')}
                                    disabled={isSaving || !noteContent.trim()}
                                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                >
                                    Guardar Nota
                                </button>
                                <button
                                    onClick={() => handleAddInteraction('call')}
                                    className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold border border-green-100"
                                >
                                    📞 Registrar Llamada
                                </button>
                                <button
                                    onClick={() => handleAddInteraction('email')}
                                    className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-100"
                                >
                                    ✉️ Registrar Email
                                </button>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-bold px-2">Historial</h2>
                            <div className="space-y-4">
                                {interactions.length === 0 ? (
                                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-border border-dashed">
                                        <p className="text-secondary text-sm">No hay actividad registrada aún.</p>
                                    </div>
                                ) : (
                                    interactions.map((interaction) => (
                                        <div key={interaction._id} className="relative pl-8 before:absolute before:left-[11px] before:top-8 before:bottom-[-16px] before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800 last:before:hidden">
                                            <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center z-10">
                                                {interaction.type === 'status_change' && <div className="w-2 h-2 rounded-full bg-purple-500"></div>}
                                                {interaction.type === 'note' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                                {interaction.type === 'call' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                                                {interaction.type === 'email' && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-border">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                                        {interaction.type.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-[10px] text-secondary">
                                                        {new Date(interaction.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-700 dark:text-slate-300">
                                                    {interaction.content}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
