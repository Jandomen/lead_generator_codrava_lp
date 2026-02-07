'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Lead {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    rating?: number;
    reviewsCount?: number;
    value?: number;
    aiScore?: number;
    aiAnalysis?: {
        reasoning?: string;
        suggestedAproach?: string;
        category?: string;
    };
    status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted';
    nextFollowUp?: string;
    reminderSent?: boolean;
    autoFollowUp?: boolean;
    createdAt: string;
}

interface Campaign {
    _id: string;
    name: string;
    leadsCount: number;
    status: string;
    targetLocation?: string;
    targetCategory?: string;
}

export default function CRM() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [activeTab, setActiveTab] = useState<'campaigns' | 'pipeline' | 'integrations' | 'agenda'>('pipeline');
    const [agendaLeads, setAgendaLeads] = useState<Lead[]>([]);

    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [leadSearchFilter, setLeadSearchFilter] = useState('');
    const [interactions, setInteractions] = useState<any[]>([]);
    const [isInteractionsLoading, setIsInteractionsLoading] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [isTestingN8N, setIsTestingN8N] = useState(false);
    const [n8nTestStatus, setN8nTestStatus] = useState<{ success?: boolean; message?: string } | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [isSendingProposal, setIsSendingProposal] = useState(false);
    const [customProposalEmail, setCustomProposalEmail] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmDeleteLeadId, setConfirmDeleteLeadId] = useState<string | null>(null);

    const fetchCampaigns = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/api/campaigns');
            const data = response.data;
            setCampaigns(data);
            if (data.length > 0 && !selectedCampaignId) {
                setSelectedCampaignId(data[0]._id);
            }
        } catch (error: any) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchLeads = async (campaignId: string) => {
        try {
            const response = await axios.get(`/api/leads?campaignId=${campaignId}`);
            setLeads(response.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    };

    const fetchAgenda = async () => {
        try {
            const response = await axios.get('/api/leads?agenda=true');
            setAgendaLeads(response.data);
        } catch (error) {
            console.error('Error fetching agenda:', error);
        }
    };

    const fetchInteractions = async (leadId: string) => {
        setIsInteractionsLoading(true);
        try {
            const response = await axios.get(`/api/interactions?leadId=${leadId}`);
            setInteractions(response.data);
        } catch (error) {
            console.error('Error fetching interactions:', error);
        } finally {
            setIsInteractionsLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (selectedCampaignId && activeTab !== 'agenda') {
            fetchLeads(selectedCampaignId);
        }
        if (activeTab === 'agenda') {
            fetchAgenda();
        }
    }, [selectedCampaignId, activeTab]);

    // Auto-refresh durante la generación de leads
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isGenerating && selectedCampaignId) {
            interval = setInterval(() => {
                fetchLeads(selectedCampaignId);
                fetchCampaigns(); // Para actualizar los contadores
            }, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isGenerating, selectedCampaignId]);


    const handleDeleteCampaign = async (campaignId: string) => {
        try {
            await axios.delete(`/api/campaigns/${campaignId}`);
            setCampaigns(campaigns.filter(c => c._id !== campaignId));
            if (selectedCampaignId === campaignId) setSelectedCampaignId(null);
            showNotification('Campaña eliminada correctamente');
            setConfirmDeleteId(null);
        } catch (error) {
            console.error('Error deleting campaign:', error);
            showNotification('Error al eliminar la campaña', 'error');
        }
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCampaignName) return;

        try {
            const response = await axios.post('/api/campaigns', { name: newCampaignName });
            setCampaigns([response.data, ...campaigns]);
            setSelectedCampaignId(response.data._id);
            setNewCampaignName('');
            setShowNewCampaignModal(false);
        } catch (error) {
            console.error('Error creating campaign:', error);
        }
    };

    const startVoiceSearch = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showNotification('Tu navegador no soporta reconocimiento de voz. Usa Chrome.', 'error');
            return;
        }

        if (isListening) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-ES';
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;

            try {
                showNotification('Procesando comando...', 'success');
                const response = await axios.post('/api/ai/voice-command', { transcript });
                const result = response.data;

                if (result.intent === 'search') {
                    setSearchQuery(result.query || '');
                    setLocationQuery(result.location || '');
                    handleGenerate(null as any, result.query, result.location);
                } else if (result.intent === 'schedule') {
                    const { scheduleResult } = result;
                    const leadName = scheduleResult.lead.name;
                    const formattedDate = new Date(scheduleResult.confirmedDate).toLocaleString('es-ES', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    });

                    if (scheduleResult.wasAdjusted) {
                        showNotification(`Slot ocupado. Reagendado con ${leadName} para el ${formattedDate}`, 'success');
                    } else {
                        showNotification(`Cita agendada con ${leadName} para el ${formattedDate}`, 'success');
                    }

                    if (activeTab === 'agenda') fetchAgenda();
                    if (selectedCampaignId) fetchLeads(selectedCampaignId);
                } else {
                    showNotification('No entendí el comando. Prueba "Busca abogados en Madrid" o "Agenda cita con Juan"', 'error');
                }
            } catch (error) {
                console.error('Error processing voice command:', error);
                showNotification('Error al procesar el comando de voz', 'error');
            }
        };

        try {
            recognition.start();
        } catch (e) {
            setIsListening(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent, overrideQuery?: string, overrideLocation?: string) => {
        if (e) e.preventDefault();
        const q = (overrideQuery || searchQuery).trim();
        const l = (overrideLocation || locationQuery).trim();

        if (!selectedCampaignId || !q) return;

        setIsGenerating(true);
        try {
            const response = await axios.post('/api/leads/generate', {
                campaignId: selectedCampaignId,
                query: q,
                location: l
            });

            if (response.data.count > 0) {
                fetchLeads(selectedCampaignId);
                fetchCampaigns();
                setSearchQuery('');
                setLocationQuery('');
            }
        } catch (error: any) {
            console.error('Error generating leads:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStatusChange = async (leadId: string, newStatus: string) => {
        try {
            const response = await axios.patch('/api/leads', { leadId, status: newStatus });
            setLeads(leads.map(l => l._id === leadId ? response.data : l));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSaveNote = async () => {
        if (!selectedLead || !noteText.trim()) return;
        setIsSavingNote(true);
        try {
            const response = await axios.post('/api/interactions', {
                leadId: selectedLead._id,
                type: 'note',
                content: noteText
            });
            setInteractions([response.data, ...interactions]);
            setNoteText('');
        } catch (error) {
            console.error('Error saving note:', error);
        } finally {
            setIsSavingNote(false);
        }
    };

    const handleTestN8N = async () => {
        setIsTestingN8N(true);
        setN8nTestStatus(null);
        try {
            await axios.post('/api/integrations/test-n8n');
            setN8nTestStatus({ success: true, message: '¡Test enviado!' });
        } catch (error: any) {
            setN8nTestStatus({ success: false, message: 'Error de conexión' });
        } finally {
            setIsTestingN8N(false);
        }
    };

    const handleDeleteLead = async (leadId: string) => {
        try {
            await axios.delete(`/api/leads/${leadId}`);
            setLeads(leads.filter(l => l._id !== leadId));
            if (selectedLead?._id === leadId) setSelectedLead(null);
            showNotification('Lead eliminado correctamente');
            setConfirmDeleteLeadId(null);
        } catch (error) {
            console.error('Error deleting lead:', error);
            showNotification('Error al eliminar el lead', 'error');
        }
    };

    const handleUpdateField = async (leadId: string, field: string, value: any) => {
        try {
            const response = await axios.patch('/api/leads', { leadId, [field]: value });
            setLeads(leads.map(l => l._id === leadId ? response.data : l));
            if (selectedLead?._id === leadId) setSelectedLead(response.data);
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
        }
    };

    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleSendProposal = async (lead: Lead, customEmail?: string) => {
        const targetEmail = customEmail || lead.email;
        if (!targetEmail) {
            showNotification('Por favor introduce un correo electrónico', 'error');
            return;
        }

        setIsSendingProposal(true);
        try {
            await axios.post('/api/leads/send-proposal', {
                leadId: lead._id,
                email: targetEmail
            });
            showNotification('¡Propuesta enviada con éxito!');
            setCustomProposalEmail('');
            fetchInteractions(lead._id);
        } catch (error: any) {
            console.error('Error sending proposal:', error);
            showNotification('Error al enviar la propuesta: ' + (error.response?.data?.error || error.message), 'error');
        } finally {
            setIsSendingProposal(false);
        }
    };
    const handleSendQuickProposal = async () => {
        if (!customProposalEmail.includes('@')) {
            alert('Por favor introduce un correo válido');
            return;
        }

        setIsSendingProposal(true);
        try {
            await axios.post('/api/leads/send-proposal', {
                email: customProposalEmail
            });
            alert(`¡Propuesta enviada a ${customProposalEmail}!`);
            setCustomProposalEmail('');
        } catch (error: any) {
            console.error('Error in Quick Send:', error);
            alert('Error al enviar: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSendingProposal(false);
        }
    };

    const handleSelectLead = (lead: Lead) => {
        setSelectedLead(lead);
        fetchInteractions(lead._id);
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(leadSearchFilter.toLowerCase()) ||
        lead.website?.toLowerCase().includes(leadSearchFilter.toLowerCase())
    );

    return (
        <div className="flex min-h-screen bg-[#050505] text-white overflow-hidden flex-col">
            {/* Header */}
            <header className="glass sticky top-4 z-40 p-4 mb-6 mx-4 mt-4 gold-glow flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden border border-white/10 bg-black/20">
                        <img src="/logo-circle.png" alt="CODRAVA LP" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tighter gold-text">CODRAVA LP</h1>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-60">JandoSoft Intelligence</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {activeTab === 'pipeline' && (
                        <select
                            className="px-4 py-2 rounded-xl border border-border/50 bg-[#0A0A0A] text-sm outline-none focus:border-primary transition-all text-white"
                            value={selectedCampaignId || ''}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                        >
                            <option value="" disabled>Seleccionar Campaña</option>
                            {campaigns.map(camp => <option key={camp._id} value={camp._id}>{camp.name}</option>)}
                        </select>
                    )}
                    <button
                        onClick={() => setShowNewCampaignModal(true)}
                        className="gold-button px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                    >
                        <span className="text-xl">+</span> Nueva Campaña
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <aside className="w-72 border-r border-border/30 bg-[#050505] hidden lg:flex flex-col">
                    <div className="p-6">
                        <nav className="space-y-2">
                            <button
                                onClick={() => setActiveTab('pipeline')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'pipeline' ? 'gold-button' : 'text-muted-foreground hover:bg-white/5'}`}
                            >
                                📊 Pipeline de Ventas
                            </button>
                            <button
                                onClick={() => setActiveTab('campaigns')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'campaigns' ? 'gold-button' : 'text-muted-foreground hover:bg-white/5'}`}
                            >
                                🚀 Mis Campañas
                            </button>
                            <button
                                onClick={() => setActiveTab('agenda')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'agenda' ? 'gold-button' : 'text-muted-foreground hover:bg-white/5'}`}
                            >
                                📅 Mi Agenda
                            </button>
                            <button
                                onClick={() => setActiveTab('integrations')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'integrations' ? 'gold-button' : 'text-muted-foreground hover:bg-white/5'}`}
                            >
                                🔌 Conexiones n8n
                            </button>
                        </nav>
                    </div>
                </aside>

                <div className="flex-1 overflow-auto">
                    <header className="sticky top-0 z-10 bg-[#050505]/80 backdrop-blur-md border-b border-border px-8 py-4">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold">{activeTab === 'campaigns' ? 'Buscador de Leads' : activeTab === 'pipeline' ? 'Pipeline de Ventas' : 'Configuración CRM'}</h1>
                            {activeTab === 'campaigns' && (
                                <div className="flex items-center gap-4">
                                    <select className="px-4 py-2 rounded-lg border border-border bg-[#0A0A0A] text-sm outline-none" value={selectedCampaignId || ''} onChange={(e) => setSelectedCampaignId(e.target.value)}>
                                        <option value="" disabled>Campaña...</option>
                                        {campaigns.map(camp => <option key={camp._id} value={camp._id}>{camp.name}</option>)}
                                    </select>
                                    <button
                                        onClick={() => setShowNewCampaignModal(true)}
                                        className="gold-button px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                                    >
                                        <span className="text-lg">+</span> Crear Campaña
                                    </button>
                                </div>
                            )}
                        </div>
                    </header>

                    {isLoading ? (
                        <div className="h-96 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                        </div>
                    ) : (
                        <div className="p-8 space-y-8">
                            {activeTab === 'campaigns' && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="glass premium-card p-6 rounded-[2rem] shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-secondary text-[10px] font-black uppercase tracking-widest">Total Leads</p>
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                </div>
                                            </div>
                                            <h3 className="text-4xl font-black tracking-tight">{campaigns.reduce((acc, c) => acc + c.leadsCount, 0)}</h3>
                                            <div className="mt-2 text-[10px] text-green-500 font-bold">+12% este mes</div>
                                        </div>
                                        <div className="glass premium-card p-6 rounded-[2rem] shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-secondary text-[10px] font-black uppercase tracking-widest">Interesados</p>
                                                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                </div>
                                            </div>
                                            <h3 className="text-4xl font-black tracking-tight">{leads.filter(l => l.status === 'interested').length}</h3>
                                            <div className="mt-2 text-[10px] text-purple-500 font-bold">Alta conversión</div>
                                        </div>
                                        <div className="glass premium-card p-6 rounded-[2rem] shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-secondary text-[10px] font-black uppercase tracking-widest">Pipeline Value</p>
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                            </div>
                                            <h3 className="text-4xl font-black tracking-tight">${leads.reduce((acc, l) => acc + (l.value || 0), 0).toLocaleString()}</h3>
                                            <div className="mt-2 text-[10px] text-emerald-500 font-bold">Crecimiento constante</div>
                                        </div>
                                        <div className="vibrant-gradient premium-card p-6 rounded-[2rem] shadow-xl text-white">
                                            <div className="flex justify-between items-start mb-4">
                                                <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest">AI Accuracy</p>
                                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                                                </div>
                                            </div>
                                            <h3 className="text-4xl font-black tracking-tight">94%</h3>
                                            <div className="mt-2 text-[10px] text-blue-100 font-bold">Gemini Flash</div>
                                        </div>
                                    </div>

                                    {/* Nueva Sección: Gestión de Campañas */}
                                    <section className="bg-[#0A0A0A] rounded-3xl border border-border overflow-hidden">
                                        <div className="p-6 border-b border-border">
                                            <h2 className="font-bold gold-text">Gestión de Campañas</h2>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {campaigns.map(camp => (
                                                    <div key={camp._id} className="glass p-4 rounded-2xl border border-border/50 flex justify-between items-center group">
                                                        <div>
                                                            <p className="font-bold text-sm tracking-tight">{camp.name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{camp.leadsCount} leads</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => setSelectedCampaignId(camp._id)}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedCampaignId === camp._id ? 'gold-button' : 'bg-white/5 hover:bg-white/10'}`}
                                                            >
                                                                {selectedCampaignId === camp._id ? 'Activa' : 'Usar'}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmDeleteId(camp._id)}
                                                                className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] font-bold transition-all border border-red-500/20"
                                                            >
                                                                Borrar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    <section className="bg-[#0A0A0A] rounded-3xl border border-border overflow-hidden">
                                        <div className="p-6 border-b border-border flex items-center justify-between">
                                            <h2 className="font-bold">Prospecting (Lead Gen)</h2>
                                            <button
                                                onClick={startVoiceSearch}
                                                className={`p-3 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 group ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'glass border border-white/10 text-primary hover:border-primary/50'}`}
                                                title={isListening ? 'Escuchando...' : 'Búsqueda por voz'}
                                            >
                                                {isListening ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                                                        <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                                        <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                                    </div>
                                                ) : (
                                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <form onSubmit={handleGenerate} className="p-8 flex gap-4">
                                            <input type="text" placeholder="¿Qué buscas?" className="flex-1 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-[#121212] outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} required />
                                            <input type="text" placeholder="¿Dónde?" className="flex-1 px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-[#121212] outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} />
                                            <button
                                                type="submit"
                                                disabled={isGenerating}
                                                className="gold-button px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isGenerating ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                        Minando...
                                                    </>
                                                ) : (
                                                    <>🚀 Generar Leads</>
                                                )}
                                            </button>
                                        </form>
                                    </section>

                                    {/* Leads Grid View */}
                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h2 className="text-xl font-black gold-text uppercase tracking-widest">Leads Descubiertos</h2>
                                            <input
                                                type="text"
                                                placeholder="Buscar en leads..."
                                                className="px-4 py-2 rounded-xl border border-border bg-[#0A0A0A] text-xs outline-none focus:border-primary transition-all w-64"
                                                value={leadSearchFilter}
                                                onChange={(e) => setLeadSearchFilter(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {filteredLeads.map(lead => (
                                                <div
                                                    key={lead._id}
                                                    onClick={() => handleSelectLead(lead)}
                                                    className="glass premium-card p-6 rounded-[2.5rem] border border-white/10 hover:border-primary/50 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                                                >
                                                    {/* AI Badge Overlay */}
                                                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-tighter shadow-sm ${(lead.aiScore || 0) > 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : (lead.aiScore || 0) > 40 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                                                        {lead.aiScore || 0}% AI
                                                    </div>

                                                    <div className="mb-4">
                                                        <h4 className="font-black text-lg leading-tight group-hover:gold-text transition-colors truncate pr-12">{lead.name}</h4>
                                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1 truncate">{lead.website || 'Sin Web'}</p>
                                                    </div>

                                                    <div className="space-y-3 mb-6">
                                                        <div className="flex items-center gap-2 text-xs text-secondary opacity-80">
                                                            <span>📞</span>
                                                            <span className="truncate">{lead.phone || 'No disponible'}</span>
                                                        </div>
                                                        {lead.email && (
                                                            <div className="flex items-center gap-2 text-xs text-green-400">
                                                                <span>📧</span>
                                                                <span className="truncate">{lead.email}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2 text-xs text-yellow-500 font-black">
                                                            <span>⭐</span>
                                                            <span>{lead.rating || 0} ({lead.reviewsCount || 0} reviews)</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                                        <div onClick={e => e.stopPropagation()}>
                                                            <select
                                                                value={lead.status}
                                                                onChange={e => handleStatusChange(lead._id, e.target.value)}
                                                                className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-white/10 bg-[#121212] outline-none cursor-pointer hover:bg-white/5 transition-all text-secondary"
                                                            >
                                                                <option value="new">Nuevo</option>
                                                                <option value="contacted">Contactado</option>
                                                                <option value="interested">Interesado</option>
                                                                <option value="not_interested">Perdido</option>
                                                                <option value="converted">Cerrado</option>
                                                            </select>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-all">
                                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {filteredLeads.length === 0 && (
                                                <div className="col-span-full py-20 text-center glass rounded-[3rem] border-2 border-dashed border-white/5 opacity-30">
                                                    <p className="text-xl font-bold uppercase tracking-[0.2em]">No se encontraron leads</p>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </>
                            )}

                            {activeTab === 'pipeline' && (
                                <div className="flex gap-8 overflow-x-auto pb-8 h-[calc(100vh-200px)] px-2">
                                    {[
                                        { id: 'new', label: 'Nuevos', color: 'bg-blue-500', gradient: 'from-blue-500/15 to-blue-500/5', border: 'border-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
                                        { id: 'contacted', label: 'Contactados', color: 'bg-orange-500', gradient: 'from-orange-500/15 to-orange-500/5', border: 'border-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
                                        { id: 'interested', label: 'Interesados', color: 'bg-purple-500', gradient: 'from-purple-500/15 to-purple-500/5', border: 'border-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
                                        { id: 'converted', label: 'Cerrados', color: 'bg-emerald-500', gradient: 'from-emerald-500/15 to-emerald-500/5', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
                                        { id: 'not_interested', label: 'Perdidos', color: 'bg-rose-500', gradient: 'from-rose-500/15 to-rose-500/5', border: 'border-rose-500/20', text: 'text-rose-600 dark:text-rose-400' }
                                    ].map(column => (
                                        <div key={column.id} className="w-80 flex flex-col gap-5 flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className={`flex justify-between items-center p-4 rounded-2xl bg-gradient-to-r ${column.gradient} border ${column.border} backdrop-blur-md shadow-sm`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${column.color} shadow-[0_0_12px_rgba(255,255,255,0.2)]`}></div>
                                                    <h3 className={`font-black text-xs uppercase tracking-[0.1em] ${column.text}`}>{column.label}</h3>
                                                </div>
                                                <span className="text-xs font-black bg-white/40 dark:bg-slate-900/40 px-3 py-1 rounded-xl shadow-sm border border-white/10">
                                                    {leads.filter(l => l.status === column.id).length}
                                                </span>
                                            </div>

                                            <div className="flex-1 bg-indigo-50/30 dark:bg-slate-900/60 rounded-[2.5rem] p-4 space-y-4 overflow-y-auto border border-indigo-200/20 dark:border-indigo-500/10 backdrop-blur-xl shadow-inner custom-scrollbar">
                                                {leads.filter(l => l.status === column.id).map(lead => (
                                                    <div key={lead._id} onClick={() => handleSelectLead(lead)} className="glass premium-card p-6 rounded-3xl shadow-sm hover:shadow-2xl cursor-pointer group border border-white/20 transition-all duration-300 hover:-translate-y-1 active:scale-95">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-sm group-hover:text-primary transition-colors leading-tight">{lead.name}</h4>
                                                        </div>
                                                        <p className="text-[10px] text-secondary font-medium truncate mb-4 opacity-80">{lead.website || 'Sin sitio web'}</p>

                                                        <div className="flex items-center gap-2 mb-4">
                                                            <div className={`w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden`}>
                                                                <div className={`h-full ${column.color} opacity-60`} style={{ width: `${lead.aiScore || 0}%` }}></div>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-secondary whitespace-nowrap">{lead.aiScore || 0}% AI</span>
                                                        </div>

                                                        <div className="flex justify-between items-end pt-4 border-t border-border/50">
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-secondary uppercase font-black tracking-widest opacity-60">Valor</span>
                                                                <span className="text-sm font-black text-slate-900 dark:text-white">${(lead.value || 0).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-500 px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm border border-yellow-400/10">
                                                                ⭐️ {lead.rating}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {leads.filter(l => l.status === column.id).length === 0 && (
                                                    <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-border/30 rounded-3xl opacity-30">
                                                        <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                                                        <p className="text-[10px] font-bold uppercase tracking-widest">Sin leads</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'agenda' && (
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-3xl font-black gold-text">Próximos Seguimientos</h2>
                                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest opacity-60">
                                            {agendaLeads.length} Tareas pendientes
                                        </div>
                                    </div>
                                    <div className="grid gap-4">
                                        {agendaLeads.length > 0 ? agendaLeads.map(lead => (
                                            <div
                                                key={lead._id}
                                                onClick={() => handleSelectLead(lead)}
                                                className="glass premium-card p-6 rounded-3xl border border-white/10 flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center border border-primary/20">
                                                        <span className="text-xl">📅</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg group-hover:text-primary transition-colors">{lead.name}</h4>
                                                        <p className="text-xs text-secondary font-medium">{lead.website || 'Sin web'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8 text-right">
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Fecha Programada</p>
                                                        <p className={`text-sm font-bold ${new Date(lead.nextFollowUp!) < new Date() ? 'text-red-400' : 'text-primary'}`}>
                                                            {new Date(lead.nextFollowUp!).toLocaleString('es-ES', {
                                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-20 text-center glass rounded-3xl border border-dashed border-white/10">
                                                <p className="text-xl font-bold opacity-30">No hay seguimientos programados</p>
                                                <p className="text-sm opacity-20 uppercase tracking-widest mt-2">Usa el panel de lead para agendar uno</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'integrations' && (
                                <div className="max-w-xl mx-auto bg-[#0A0A0A] p-8 rounded-3xl border border-border shadow-sm">
                                    <h2 className="text-xl font-bold mb-6">n8n Automation</h2>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Webhook URL</label>
                                            <div className="flex gap-2">
                                                <input type="text" readOnly value={process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''} className="flex-1 px-4 py-3 rounded-xl bg-[#121212] border-none text-xs" />
                                                <button onClick={() => { navigator.clipboard.writeText(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''); alert('Copiado'); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold text-xs">Copiar</button>
                                            </div>
                                        </div>
                                        <button onClick={handleTestN8N} disabled={isTestingN8N} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-600 disabled:opacity-50">
                                            {isTestingN8N ? 'Probando...' : 'Probar Conexión'}
                                        </button>

                                        <div className="pt-6 border-t border-white/10">
                                            <h3 className="text-sm font-bold gold-text mb-4 uppercase tracking-widest">Entorno de Pruebas</h3>
                                            <button
                                                onClick={async () => {
                                                    showNotification('Simulando tick de reloj...', 'success');
                                                    try {
                                                        const res = await axios.get('/api/cron/reminders');
                                                        showNotification(res.data.message || 'Cron ejecutado', 'success');
                                                        fetchAgenda();
                                                    } catch (e) {
                                                        showNotification('Error al ejecutar cron', 'error');
                                                    }
                                                }}
                                                className="w-full py-4 glass border border-primary/30 text-primary rounded-2xl font-bold hover:bg-primary/10 transition-all flex items-center justify-center gap-3"
                                            >
                                                🚀 SIMULAR MOTOR DE ALERTAS
                                            </button>
                                            <p className="text-[10px] text-secondary mt-3 text-center italic">
                                                * Ejecuta manualmente el escáner de citas próximas (30 min) y dispara la IA en Piloto Automático.
                                            </p>
                                        </div>

                                        {n8nTestStatus && <div className={`p-4 rounded-xl text-xs font-bold ${n8nTestStatus.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{n8nTestStatus.message}</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {showNewCampaignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-[#0A0A0A] rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6">Nueva Campaña</h2>
                        <form onSubmit={handleCreateCampaign} className="space-y-4">
                            <input autoFocus type="text" placeholder="Nombre" className="w-full px-4 py-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-[#121212] outline-none" value={newCampaignName} onChange={e => setNewCampaignName(e.target.value)} required />
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowNewCampaignModal(false)} className="flex-1 py-3 rounded-xl border border-border font-bold">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-primary text-white rounded-xl font-bold">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedLead && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-2xl bg-[#0A0A0A] h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
                        <header className="p-6 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between bg-[#0A0A0A]/50">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedLead.name}</h2>
                                <p className="text-sm text-slate-500">{selectedLead.website || 'Sin web'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleSendProposal(selectedLead)}
                                    disabled={isSendingProposal || !selectedLead.email}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${selectedLead.email ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {isSendingProposal ? 'Enviando...' : 'Enviar Propuesta'}
                                    {!isSendingProposal && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>}
                                </button>
                                <button onClick={() => setConfirmDeleteLeadId(selectedLead._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                <button onClick={() => setSelectedLead(null)} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        </header>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border">
                                    <p className="text-xs font-bold text-secondary uppercase mb-1">Email</p>
                                    <input
                                        type="email"
                                        placeholder="correo@ejemplo.com"
                                        className="bg-transparent font-medium outline-none w-full"
                                        value={selectedLead.email || ''}
                                        onChange={e => handleUpdateField(selectedLead._id, 'email', e.target.value)}
                                    />
                                </div>
                                <div className="p-4 glass rounded-2xl border border-border/30 flex gap-3">
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black gold-text uppercase mb-1">Enviar a otro correo</p>
                                        <input
                                            type="email"
                                            placeholder="ejemplo@correo.com"
                                            className="w-full bg-[#121212] border-none text-sm p-3 rounded-xl outline-none focus:ring-1 focus:ring-primary/30"
                                            value={customProposalEmail}
                                            onChange={e => setCustomProposalEmail(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleSendProposal(selectedLead, customProposalEmail)}
                                        disabled={isSendingProposal}
                                        className="gold-button self-end px-6 py-3 rounded-xl font-bold text-sm"
                                    >
                                        {isSendingProposal ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-xs font-bold text-secondary uppercase">📅 Seguimiento</p>
                                        <button
                                            onClick={() => handleUpdateField(selectedLead._id, 'autoFollowUp', !selectedLead.autoFollowUp)}
                                            className={`text-[9px] font-black px-2 py-1 rounded-md border transition-all ${selectedLead.autoFollowUp ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-muted-foreground'}`}
                                        >
                                            {selectedLead.autoFollowUp ? '🤖 PILOTO ON' : '🤖 PILOTO OFF'}
                                        </button>
                                    </div>
                                    <input
                                        type="datetime-local"
                                        className="bg-transparent font-medium outline-none w-full text-white"
                                        value={selectedLead.nextFollowUp ? new Date(selectedLead.nextFollowUp).toISOString().slice(0, 16) : ''}
                                        onChange={e => handleUpdateField(selectedLead._id, 'nextFollowUp', e.target.value)}
                                    />
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-border">
                                    <p className="text-xs font-bold text-secondary uppercase mb-1">📍 Teléfono</p>
                                    <input
                                        type="text"
                                        placeholder="+34 ..."
                                        className="bg-transparent font-medium outline-none w-full"
                                        value={selectedLead.phone || ''}
                                        onChange={e => handleUpdateField(selectedLead._id, 'phone', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 mb-8">
                                <p className="text-xs font-bold text-blue-600 uppercase mb-1">Valor Lead</p>
                                <div className="flex items-center gap-1">
                                    <span className="font-bold">$</span>
                                    <input type="number" className="bg-transparent font-bold outline-none w-full" value={selectedLead.value || 0} onChange={e => handleUpdateField(selectedLead._id, 'value', parseInt(e.target.value) || 0)} />
                                </div>
                            </div>

                            {selectedLead.aiAnalysis && (
                                <section className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl border border-blue-100/50 dark:border-blue-800/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] text-white">IA</div>
                                        <h3 className="font-bold text-primary">Análisis de Llama 3.3</h3>
                                        <div className="ml-auto bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded-lg text-xs font-bold">
                                            Score: {selectedLead.aiScore}%
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase mb-1">Razonamiento</p>
                                            <p className="text-sm italic text-slate-700 dark:text-slate-300">"{selectedLead.aiAnalysis.reasoning}"</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-secondary uppercase mb-1">Estrategia sugerida</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{selectedLead.aiAnalysis.suggestedAproach}</p>
                                        </div>
                                        {selectedLead.aiAnalysis.category && (
                                            <div className="inline-block px-3 py-1 bg-white/50 dark:bg-slate-900/50 rounded-full text-[10px] font-bold border border-blue-100 dark:border-blue-800">
                                                🏷️ {selectedLead.aiAnalysis.category}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            <section>
                                <h3 className="text-lg font-bold mb-4">Actividad</h3>
                                <div className="space-y-4">
                                    {isInteractionsLoading ? <p className="text-sm text-secondary">Cargando...</p> : interactions.map(i => (
                                        <div key={i._id} className="p-3 bg-indigo-50/40 dark:bg-slate-800 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                            <p className="text-sm">{i.content}</p>
                                            <p className="text-[10px] text-secondary mt-1">{new Date(i.createdAt).toLocaleString()} • {i.type.toUpperCase()}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                        <div className="p-6 border-t border-indigo-100 dark:border-indigo-900/30 bg-white dark:bg-slate-800/50 flex gap-4">
                            <input type="text" placeholder="Añadir nota..." className="flex-1 px-4 py-2 rounded-xl border border-border bg-white dark:bg-slate-900 outline-none" value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveNote()} />
                            <button onClick={handleSaveNote} disabled={isSavingNote || !noteText.trim()} className="bg-primary text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50">Añadir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Borrado de Campaña */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] border border-red-500/30 rounded-[2rem] p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black text-center mb-2">¿Estás seguro?</h3>
                        <p className="text-sm text-center text-muted-foreground mb-8">Esta acción eliminará la campaña y todos sus leads de forma permanente. No se puede deshacer.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteCampaign(confirmDeleteId)}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
                            >
                                Borrar Todo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Borrado de Lead */}
            {confirmDeleteLeadId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] border border-red-500/30 rounded-[2rem] p-8 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.15)] animate-in zoom-in-95 duration-300 text-center">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-black mb-2">Eliminar Lead</h3>
                        <p className="text-sm text-muted-foreground mb-8">¿Estás seguro de que quieres eliminar este lead? Esta acción es irreversible.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDeleteLeadId(null)}
                                className="flex-1 py-3 rounded-xl border border-white/10 font-bold hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleDeleteLead(confirmDeleteLeadId)}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-600/20"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-4 duration-300 flex items-center gap-3 ${notification.type === 'success'
                    ? 'glass border-primary/50 text-white'
                    : 'bg-red-500/10 border-red-500/50 text-red-200'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-primary animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-sm font-bold tracking-tight">{notification.message}</span>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-auto py-8 border-t border-border/50 text-center glass">
                <div className="max-container">
                    <p className="text-muted-foreground text-sm font-light tracking-widest">
                        © 2026 <span className="gold-text font-bold">JANDOSOFT</span> — POTENCIANDO EL FUTURO DE LAS VENTAS
                    </p>
                    <p className="text-[10px] text-muted-foreground/50 mt-2 uppercase tracking-[0.2em]">
                        Codrava OSINT Engine v2.0 • LeadGen Intelligence
                    </p>
                </div>
            </footer>
        </div>
    );
}
