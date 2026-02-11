'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Plus, Trash2, Download, Send, X, BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

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

interface Quote {
    _id: string;
    leadId: string;
    quoteNumber: string;
    total: number;
    status: string;
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
    const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'pipeline' | 'integrations' | 'agenda' | 'clients' | 'tasks'>('dashboard');
    const [tasks, setTasks] = useState<any[]>([]);
    const [isTasksLoading, setIsTasksLoading] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [interactionType, setInteractionType] = useState<'note' | 'call' | 'meeting'>('note');
    const [agendaLeads, setAgendaLeads] = useState<Lead[]>([]);

    // Quote System States
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteItems, setQuoteItems] = useState<{ description: string; quantity: number; price: number }[]>([
        { description: '', quantity: 1, price: 0 }
    ]);
    const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
    const [quoteNotes, setQuoteNotes] = useState('');

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
    const [leadLimit, setLeadLimit] = useState(20);
    const [quotes, setQuotes] = useState<Quote[]>([]);

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

    const fetchQuotes = async (leadId: string) => {
        try {
            const response = await axios.get(`/api/quotes?leadId=${leadId}`);
            setQuotes(response.data);
        } catch (error) {
            console.error('Error fetching quotes:', error);
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

    const fetchTasks = async () => {
        setIsTasksLoading(true);
        try {
            const response = await axios.get('/api/tasks');
            setTasks(response.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsTasksLoading(true);
        }
    };

    useEffect(() => {
        fetchCampaigns();
        fetchTasks();
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
                    if (result.limit) setLeadLimit(Math.min(result.limit, 20));
                    handleGenerate(null as any, result.query, result.location, result.limit || leadLimit);
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

    const handleGenerate = async (e: React.FormEvent, overrideQuery?: string, overrideLocation?: string, overrideLimit?: number) => {
        if (e) e.preventDefault();
        const q = (overrideQuery || searchQuery).trim();
        const l = (overrideLocation || locationQuery).trim();
        const lim = Math.min(overrideLimit || leadLimit, 20); // Hard cap at 20

        if (!selectedCampaignId || !q) return;

        setIsGenerating(true);
        try {
            const response = await axios.post('/api/leads/generate', {
                campaignId: selectedCampaignId,
                query: q,
                location: l,
                limit: lim
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
            const updatedLead = response.data;
            setLeads(leads.map(l => l._id === leadId ? updatedLead : l));

            // Automation: Trigger n8n if status is 'interested'
            if (newStatus === 'interested') {
                showNotification('Activando automatización de seguimiento...', 'success');
                axios.post('/api/integrations/interested-trigger', { lead: updatedLead })
                    .then(() => showNotification('Secuencia de seguimiento iniciada en n8n', 'success'))
                    .catch(() => showNotification('Error al disparar automatización', 'error'));
            }
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
                type: interactionType,
                content: noteText
            });
            setInteractions([response.data, ...interactions]);
            setNoteText('');
            setInteractionType('note');
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

    const generateQuotePDF = async () => {
        if (!selectedLead) return;
        setIsGeneratingQuote(true);

        try {
            const doc = new jsPDF() as any;
            const subtotal = quoteItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const tax = subtotal * 0.16; // 16% IVA example
            const total = subtotal + tax;

            // Brand Header
            doc.setFillColor(10, 10, 10);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(212, 175, 55); // Gold
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            doc.text('CODRAVA', 20, 25);
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('LEAD GENERATOR & CRM', 20, 32);

            // Quote Title
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(22);
            doc.text('COTIZACIÓN COMERCIAL', 120, 60);
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 120, 68);
            doc.text(`Expira: ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()}`, 120, 73);

            // Client Info
            doc.setTextColor(212, 175, 55);
            doc.setFontSize(12);
            doc.text('PREPARADO PARA:', 20, 60);
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.text(selectedLead.name, 20, 68);
            doc.text(selectedLead.email || 'N/A', 20, 73);
            doc.text(selectedLead.website || '', 20, 78);

            // Table
            autoTable(doc, {
                startY: 90,
                head: [['DESCRIPCIÓN', 'CANTIDAD', 'PRECIO UNIT.', 'TOTAL']],
                body: quoteItems.map(item => [
                    item.description,
                    item.quantity,
                    `$${item.price.toLocaleString()}`,
                    `$${(item.price * item.quantity).toLocaleString()}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [10, 10, 10], textColor: [212, 175, 55], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 5 },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { halign: 'center' },
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                }
            });

            // Summary
            const finalY = (doc as any).lastAutoTable.finalY + 10;
            doc.setFont('helvetica', 'bold');
            doc.text(`Subtotal:`, 140, finalY);
            doc.text(`IVA (16%):`, 140, finalY + 7);
            doc.setFontSize(14);
            doc.setTextColor(212, 175, 55);
            doc.text(`TOTAL:`, 140, finalY + 17);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`$${subtotal.toLocaleString()}`, 180, finalY, { align: 'right' });
            doc.text(`$${tax.toLocaleString()}`, 180, finalY + 7, { align: 'right' });
            doc.setFontSize(14);
            doc.setTextColor(212, 175, 55);
            doc.text(`$${total.toLocaleString()}`, 180, finalY + 17, { align: 'right' });

            // Notes
            if (quoteNotes) {
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(10);
                doc.text('NOTAS:', 20, finalY + 30);
                doc.setFont('helvetica', 'italic');
                doc.text(quoteNotes, 20, finalY + 37);
            }

            // Footer
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(8);
            doc.text('Este documento es una propuesta comercial y no constituye un contrato legal.', 105, 285, { align: 'center' });

            doc.save(`Cotizacion_${selectedLead.name.replace(/\s+/g, '_')}.pdf`);

            // Save to DB
            await axios.post('/api/quotes', {
                leadId: selectedLead._id,
                items: quoteItems,
                subtotal,
                tax,
                total,
                notes: quoteNotes,
                validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            });

            showNotification('Cotización generada y guardada correctamente');
            setShowQuoteModal(false);
            setQuoteItems([{ description: '', quantity: 1, price: 0 }]);
            setQuoteNotes('');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showNotification('Error al generar la cotización', 'error');
        } finally {
            setIsGeneratingQuote(false);
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
    };

    useEffect(() => {
        if (selectedLead) {
            fetchInteractions(selectedLead._id);
            fetchQuotes(selectedLead._id);
            setCustomProposalEmail('');
        }
    }, [selectedLead]);

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
                <div className="hidden lg:flex items-center gap-1 bg-white/5 p-1.5 rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'gold-button text-black' : 'text-muted-foreground hover:text-white'}`}>Dashboard</button>
                    <button onClick={() => setActiveTab('pipeline')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pipeline' ? 'gold-button text-black' : 'text-muted-foreground hover:text-white'}`}>Pipeline</button>
                    <button onClick={() => setActiveTab('campaigns')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'campaigns' ? 'gold-button text-black' : 'text-muted-foreground hover:text-white'}`}>Explorar</button>
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
                                onClick={() => setActiveTab('dashboard')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'gold-button' : 'text-muted-foreground hover:bg-white/5'}`}
                            >
                                📈 Dashboard Global
                            </button>
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
                                onClick={() => setActiveTab('clients')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'clients' ? 'gold-button' : 'text-muted-foreground hover:bg-white/5'}`}
                            >
                                💎 Mis Clientes
                            </button>
                            <button
                                onClick={() => setActiveTab('agenda')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'agenda' ? 'gold-button' : 'text-muted-foreground hover:bg-white/5'}`}
                            >
                                📅 Mi Agenda
                            </button>
                            <button
                                onClick={() => setActiveTab('tasks')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'tasks' ? 'gold-button' : 'text-muted-foreground hover:bg-white/5'}`}
                            >
                                ✅ Lista de Tareas
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
                            <h1 className="text-2xl font-black tracking-tighter">
                                {activeTab === 'dashboard' ? 'Dashboard de Inteligencia' :
                                    activeTab === 'campaigns' ? 'Buscador de Leads' :
                                        activeTab === 'pipeline' ? 'Pipeline de Ventas' :
                                            activeTab === 'clients' ? 'Cartera de Clientes' :
                                                activeTab === 'agenda' ? 'Agenda de Seguimiento' :
                                                    'Configuración CRM'}
                            </h1>
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
                            {activeTab === 'dashboard' && (
                                <div className="space-y-8 animate-in fade-in duration-700">
                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="glass premium-card p-6 rounded-[2rem] shadow-sm">
                                            <p className="text-secondary text-[10px] font-black uppercase tracking-widest mb-4">Pipeline Total</p>
                                            <h3 className="text-4xl font-black tracking-tight gold-text">${leads.reduce((acc, l) => acc + (l.value || 0), 0).toLocaleString()}</h3>
                                            <p className="text-[10px] opacity-40 mt-2 font-bold uppercase">Proyectado de {leads.length} leads</p>
                                        </div>
                                        <div className="glass premium-card p-6 rounded-[2rem] shadow-sm">
                                            <p className="text-secondary text-[10px] font-black uppercase tracking-widest mb-4">Tasa de Cierre</p>
                                            <h3 className="text-4xl font-black tracking-tight">{leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : 0}%</h3>
                                            <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
                                                <div className="bg-emerald-500 h-full" style={{ width: `${leads.length > 0 ? (leads.filter(l => l.status === 'converted').length / leads.length) * 100 : 0}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="glass premium-card p-6 rounded-[2rem] shadow-sm">
                                            <p className="text-secondary text-[10px] font-black uppercase tracking-widest mb-4">Interés Real</p>
                                            <h3 className="text-4xl font-black tracking-tight text-purple-400">{leads.filter(l => l.status === 'interested').length}</h3>
                                            <p className="text-[10px] opacity-40 mt-2 font-bold uppercase">Leads calientes</p>
                                        </div>
                                        <div className="vibrant-gradient premium-card p-6 rounded-[2rem] shadow-xl text-white">
                                            <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-4">Conversión AI</p>
                                            <h3 className="text-4xl font-black tracking-tight">42% <span className="text-sm opacity-60">Avg</span></h3>
                                            <p className="text-[10px] text-blue-100/60 mt-2 font-bold uppercase italic">Impulsado por Gemini 2.0</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Sales Funnel */}
                                        <div className="glass p-8 rounded-[3rem] border border-white/5">
                                            <h3 className="text-lg font-black gold-text uppercase tracking-widest mb-8">Embudo de Conversión</h3>
                                            <div className="space-y-4">
                                                {[
                                                    { label: 'Leads Descubiertos', count: leads.length, color: 'bg-blue-500/20', border: 'border-blue-500/30' },
                                                    { label: 'Contactados', count: leads.filter(l => ['contacted', 'interested', 'converted'].includes(l.status)).length, color: 'bg-orange-500/20', border: 'border-orange-500/30' },
                                                    { label: 'Interesados', count: leads.filter(l => ['interested', 'converted'].includes(l.status)).length, color: 'bg-purple-500/20', border: 'border-purple-500/30' },
                                                    { label: 'Cerrados', count: leads.filter(l => l.status === 'converted').length, color: 'bg-emerald-500/20', border: 'border-emerald-500/30' }
                                                ].map((step, i) => (
                                                    <div key={i} className="relative group">
                                                        <div
                                                            className={`h-16 ${step.color} border ${step.border} rounded-2xl flex items-center justify-between px-6 transition-all duration-500 group-hover:scale-[1.02]`}
                                                            style={{ width: `${100 - (i * 10)}%`, marginLeft: `${i * 5}%` }}
                                                        >
                                                            <span className="text-xs font-black uppercase tracking-widest">{step.label}</span>
                                                            <span className="text-xl font-black">{step.count}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recent Productivity */}
                                        <div className="glass p-8 rounded-[3rem] border border-white/5">
                                            <h3 className="text-lg font-black gold-text uppercase tracking-widest mb-8">Actividad del Sistema</h3>
                                            <div className="space-y-6">
                                                {leads.slice(0, 5).map((lead, i) => (
                                                    <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                            <div>
                                                                <p className="text-sm font-bold">{lead.name}</p>
                                                                <p className="text-[10px] text-muted-foreground uppercase">Estado: {lead.status}</p>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] opacity-40 font-bold">{new Date().toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visual Analytics Row */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Leads by Status Bar Chart */}
                                        <div className="glass p-8 rounded-[3rem] border border-white/5 h-[400px]">
                                            <div className="flex items-center gap-3 mb-8">
                                                <BarChart3 className="w-5 h-5 gold-text" />
                                                <h3 className="text-lg font-black uppercase tracking-widest">Estado del Pipeline</h3>
                                            </div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={[
                                                    { name: 'Nuevos', value: leads.filter(l => l.status === 'new').length },
                                                    { name: 'Contact.', value: leads.filter(l => l.status === 'contacted').length },
                                                    { name: 'Interes.', value: leads.filter(l => l.status === 'interested').length },
                                                    { name: 'Cerrados', value: leads.filter(l => l.status === 'converted').length }
                                                ]}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                                                        itemStyle={{ color: '#d4af37' }}
                                                    />
                                                    <Bar dataKey="value" fill="#d4af37" radius={[4, 4, 0, 0]} barSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Category Distribution Pie Chart */}
                                        <div className="glass p-8 rounded-[3rem] border border-white/5 h-[400px]">
                                            <div className="flex items-center gap-3 mb-8">
                                                <PieChartIcon className="w-5 h-5 gold-text" />
                                                <h3 className="text-lg font-black uppercase tracking-widest">Distribución AI</h3>
                                            </div>
                                            <ResponsiveContainer width="100%" height="80%">
                                                <PieChart>
                                                    <Pie
                                                        data={Object.entries(leads.reduce((acc: any, lead) => {
                                                            const cat = lead.aiAnalysis?.category || 'Sin Categoría';
                                                            acc[cat] = (acc[cat] || 0) + 1;
                                                            return acc;
                                                        }, {})).map(([name, value]) => ({ name, value }))}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={80}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {['#d4af37', '#8e7116', '#cfb53b', '#5c4b14'].map((color, index) => (
                                                            <Cell key={`cell-${index}`} fill={color} stroke="none" />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '12px', fontSize: '10px' }}
                                                    />
                                                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                </div>
                            )}

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
                                <div className="space-y-8 h-[calc(100vh-200px)] flex flex-col">
                                    {/* Lead Generation Search - Fixed at the top of Pipeline */}
                                    <section className="bg-[#0A0A0A]/50 backdrop-blur-sm rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] gold-text">Minería de Leads Avanzada</h2>
                                                <div className="h-4 w-px bg-white/10"></div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase">Filtro AI:</span>
                                                    <select
                                                        className="bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase px-2 py-1 outline-none focus:border-primary"
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            setLeads(prev => [...prev].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)));
                                                            showNotification(`Ordenado por mayor Calidad AI`, 'success');
                                                        }}
                                                    >
                                                        <option value="0">Todos</option>
                                                        <option value="80">Top Premium (80%+)</option>
                                                        <option value="50">Interesantes (50%+)</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button
                                                onClick={startVoiceSearch}
                                                className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 border border-white/10 text-primary hover:border-primary/50'}`}
                                            >
                                                {isListening ? (
                                                    <span className="text-[8px] font-bold px-2">ESCUCHANDO...</span>
                                                ) : (
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <form onSubmit={(e) => handleGenerate(e)} className="p-6 flex flex-col gap-4">
                                            <div className="flex gap-3">
                                                <input type="text" placeholder="¿Qué negocio buscas?" className="flex-1 px-4 py-2.5 rounded-xl border border-white/5 bg-black/40 outline-none focus:ring-1 focus:ring-amber-500/30 transition-all font-bold text-xs" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} required />
                                                <input type="text" placeholder="¿Dónde?" className="flex-1 px-4 py-2.5 rounded-xl border border-white/5 bg-black/40 outline-none focus:ring-1 focus:ring-amber-500/30 transition-all font-bold text-xs" value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} />
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between items-center px-1">
                                                        <label className="text-[8px] font-black uppercase tracking-widest opacity-50">Límite: <span className="text-white text-xs ml-1">{leadLimit}</span></label>
                                                    </div>
                                                    <input
                                                        type="range" min="1" max="20" value={leadLimit}
                                                        onChange={(e) => setLeadLimit(parseInt(e.target.value))}
                                                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                    />
                                                </div>
                                                <button
                                                    type="submit" disabled={isGenerating}
                                                    className="gold-button px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 whitespace-nowrap shadow-lg active:scale-95 transition-transform"
                                                >
                                                    {isGenerating ? (
                                                        <>
                                                            <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                            MINANDO...
                                                        </>
                                                    ) : (
                                                        <>🚀 GENERAR {leadLimit}</>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </section>

                                    <div className="flex gap-8 overflow-x-auto pb-8 flex-1 px-2 custom-scrollbar">
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
                                <div className="max-w-xl mx-auto bg-[#0A0A0A] p-8 rounded-3xl border border-border shadow-sm animate-in fade-in duration-500">
                                    <h2 className="text-xl font-bold mb-6">n8n Automation</h2>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold">Webhook URL</label>
                                            <div className="flex gap-2">
                                                <input type="text" readOnly value={process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''} className="flex-1 px-4 py-3 rounded-xl bg-[#121212] border-none text-xs" />
                                                <button onClick={() => { navigator.clipboard.writeText(process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || ''); showNotification('Copiado'); }} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl font-bold text-xs">Copiar</button>
                                            </div>
                                        </div>
                                        <button onClick={handleTestN8N} disabled={isTestingN8N} className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-blue-600 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]">
                                            {isTestingN8N ? 'Probando...' : 'Probar Conexión'}
                                        </button>

                                        <div className="pt-6 border-t border-white/10 space-y-4">
                                            <h3 className="text-sm font-bold gold-text mb-2 uppercase tracking-widest">Seguimiento Inteligente</h3>
                                            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                                                Esta automatización se dispara cuando un lead se marca como <span className="text-purple-400">"Interesado"</span>.
                                                Envía los datos a n8n para generar un correo de presentación frío y crear tareas de seguimiento automáticas.
                                            </p>
                                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-2">Payload Enviado:</p>
                                                <pre className="text-[9px] text-blue-300 font-mono">
                                                    {`{
  event: "lead_interested",
  actions: ["send_email", "create_task"]
}`}
                                                </pre>
                                            </div>
                                        </div>

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
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h2 className="text-3xl font-black gold-text">Lista de Tareas✅</h2>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Gestión de tareas internas y recordatorios</p>
                                        </div>
                                        <div className="glass px-6 py-2 rounded-2xl border border-white/10">
                                            <span className="text-[10px] font-black uppercase opacity-40">Pendientes: {tasks.filter(t => t.status === 'pending').length}</span>
                                        </div>
                                    </div>

                                    <div className="glass p-6 rounded-[2.5rem] border border-white/10">
                                        <div className="flex gap-4">
                                            <input
                                                type="text"
                                                placeholder="¿Qué tienes que hacer hoy?..."
                                                className="flex-1 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl outline-none focus:border-primary transition-all font-medium"
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                onKeyDown={async (e) => {
                                                    if (e.key === 'Enter' && newTaskTitle.trim()) {
                                                        const res = await axios.post('/api/tasks', { title: newTaskTitle });
                                                        setTasks([res.data, ...tasks]);
                                                        setNewTaskTitle('');
                                                        showNotification('Tarea añadida con éxito');
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={async () => {
                                                    if (!newTaskTitle.trim()) return;
                                                    const res = await axios.post('/api/tasks', { title: newTaskTitle, status: 'pending', priority: 'medium' });
                                                    setTasks([res.data, ...tasks]);
                                                    setNewTaskTitle('');
                                                    showNotification('Tarea añadida');
                                                }}
                                                className="gold-button px-8 py-4 rounded-2xl font-black uppercase tracking-widest"
                                            >
                                                Añadir
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {tasks.map(task => (
                                            <div key={task._id} className={`glass p-6 rounded-3xl border transition-all flex items-center justify-between group ${task.status === 'completed' ? 'opacity-40 border-white/5' : 'border-white/10 hover:border-primary/30'}`}>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={async () => {
                                                            const newStatus = task.status === 'completed' ? 'pending' : 'completed';
                                                            await axios.patch('/api/tasks', { taskId: task._id, status: newStatus });
                                                            setTasks(tasks.map(t => t._id === task._id ? { ...t, status: newStatus } : t));
                                                        }}
                                                        className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${task.status === 'completed' ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-white/20 hover:border-primary'}`}
                                                    >
                                                        {task.status === 'completed' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                    </button>
                                                    <div>
                                                        <h4 className={`text-lg font-bold ${task.status === 'completed' ? 'line-through' : ''}`}>{task.title}</h4>
                                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Creada el {new Date(task.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        await axios.delete(`/api/tasks?taskId=${task._id}`);
                                                        setTasks(tasks.filter(t => t._id !== task._id));
                                                        showNotification('Tarea eliminada', 'error');
                                                    }}
                                                    className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'clients' && (
                                <div className="space-y-8 animate-in fade-in duration-700">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-3xl font-black gold-text">Cartera de Clientes💎</h2>
                                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Leads que ya están facturando</p>
                                        </div>
                                        <div className="glass px-6 py-3 rounded-2xl border border-white/10">
                                            <p className="text-[10px] font-black uppercase opacity-40">Revenue Total</p>
                                            <p className="text-xl font-black text-emerald-400">${leads.filter(l => l.status === 'converted').reduce((acc, l) => acc + (l.value || 0), 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {leads.filter(l => l.status === 'converted').map(client => (
                                            <div key={client._id} className="glass premium-card p-8 rounded-[2.5rem] border border-white/10 group hover:border-emerald-500/50 transition-all duration-300">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xl">
                                                        🏢
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/5 border border-emerald-500/20 px-3 py-1 rounded-full">Cliente Activo</span>
                                                </div>
                                                <h3 className="text-xl font-black mb-1 group-hover:gold-text transition-colors">{client.name}</h3>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-6">{client.website || 'Dominio no registrado'}</p>

                                                <div className="space-y-3 mb-8">
                                                    <div className="flex items-center gap-3 text-xs opacity-60"><span>📧</span> {client.email || 'N/A'}</div>
                                                    <div className="flex items-center gap-3 text-xs opacity-60"><span>📞</span> {client.phone || 'N/A'}</div>
                                                </div>

                                                <div className="pt-6 border-t border-white/5 flex gap-3">
                                                    <button className="flex-1 px-4 py-3 glass border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 transition-all outline-none">Facturación</button>
                                                    <button className="flex-1 px-4 py-3 gold-button rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">Contratos</button>
                                                </div>
                                            </div>
                                        ))}
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

            {
                selectedLead && (
                    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
                        <div className="w-full max-w-2xl bg-[#0A0A0A] h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
                            <header className="p-6 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between bg-[#0A0A0A]/50">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedLead.name}</h2>
                                    <p className="text-sm text-slate-500">{selectedLead.website || 'Sin web'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowQuoteModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Cotización
                                    </button>
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
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-lg font-black uppercase tracking-widest gold-text">Línea de Tiempo de Actividad ⏳</h3>
                                        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                                            <button
                                                onClick={() => setInteractionType('note')}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${interactionType === 'note' ? 'bg-amber-500 text-black' : 'text-muted-foreground'}`}
                                            >
                                                Nota
                                            </button>
                                            <button
                                                onClick={() => setInteractionType('call')}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${interactionType === 'call' ? 'bg-blue-500 text-white' : 'text-muted-foreground'}`}
                                            >
                                                📞 Llamada
                                            </button>
                                            <button
                                                onClick={() => setInteractionType('meeting')}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${interactionType === 'meeting' ? 'bg-purple-500 text-white' : 'text-muted-foreground'}`}
                                            >
                                                📅 Reunión
                                            </button>
                                        </div>
                                    </div>

                                    <div className="relative space-y-0 pl-8 border-l-2 border-white/5 ml-4">
                                        {/* Event: Discovery */}
                                        <div className="relative pb-10">
                                            <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-emerald-500 border-4 border-[#0A0A0A] z-10"></div>
                                            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Lead Descubierto 🚀</span>
                                                    <span className="text-[9px] opacity-40 font-bold">{new Date(selectedLead.createdAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Prospecto identificado por el escáner de CODRAVA en {selectedLead.website || 'Google Maps'}.</p>
                                            </div>
                                        </div>

                                        {/* Event: AI Analysis */}
                                        {selectedLead.aiAnalysis && (
                                            <div className="relative pb-10">
                                                <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-blue-500 border-4 border-[#0A0A0A] z-10"></div>
                                                <div className="bg-blue-500/5 p-4 rounded-3xl border border-blue-500/10">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Análisis IA Completado 🤖</span>
                                                        <span className="text-[9px] opacity-40 font-bold">Sistema</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-blue-200/80 mb-2">Calidad: {selectedLead.aiScore}% • {selectedLead.aiAnalysis.category}</p>
                                                    <p className="text-xs text-muted-foreground italic">"{selectedLead.aiAnalysis.reasoning?.substring(0, 100)}..."</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Interactions & Quotes Consolidated */}
                                        {[
                                            ...interactions.map(i => ({ ...i, timelineType: 'interaction' })),
                                            ...quotes.map(q => ({ ...q, timelineType: 'quote' }))
                                        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((item, idx) => (
                                            <div key={idx} className="relative pb-10">
                                                <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-[#0A0A0A] z-10 ${item.timelineType === 'quote' ? 'bg-amber-500' :
                                                    item.type === 'call' ? 'bg-blue-600' :
                                                        item.type === 'meeting' ? 'bg-purple-600' : 'bg-slate-500'
                                                    }`}></div>

                                                <div className={`p-4 rounded-3xl border ${item.timelineType === 'quote' ? 'bg-amber-500/5 border-amber-500/10' :
                                                    item.type === 'call' ? 'bg-blue-500/5 border-blue-500/10' :
                                                        item.type === 'meeting' ? 'bg-purple-500/5 border-purple-500/10' :
                                                            'bg-white/5 border-white/5'
                                                    }`}>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${item.timelineType === 'quote' ? 'text-amber-500' :
                                                            item.type === 'call' ? 'text-blue-400' :
                                                                item.type === 'meeting' ? 'text-purple-400' : 'text-slate-400'
                                                            }`}>
                                                            {item.timelineType === 'quote' ? '🧾 Cotización Enviada' :
                                                                item.type === 'call' ? '📞 Llamada Registrada' :
                                                                    item.type === 'meeting' ? '📅 Reunión Realizada' : '📝 Nota de Seguimiento'}
                                                        </span>
                                                        <span className="text-[9px] opacity-40 font-bold">{new Date(item.createdAt).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-xs text-white/80">
                                                        {item.timelineType === 'quote' ? `Propuesta ${item.quoteNumber} por un total de $${item.total.toLocaleString()}` : item.content}
                                                    </p>
                                                    {item.timelineType === 'quote' && (
                                                        <div className="mt-2 flex gap-2">
                                                            <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 uppercase tracking-tighter">{item.status}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-black/40 flex gap-4">
                                <input
                                    type="text"
                                    placeholder={interactionType === 'call' ? "Resultado de la llamada..." : interactionType === 'meeting' ? "Resumen de la reunión..." : "Añadir nota..."}
                                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-black/20 outline-none focus:border-primary transition-all text-sm"
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSaveNote()}
                                />
                                <button onClick={handleSaveNote} disabled={isSavingNote || !noteText.trim()} className="gold-button px-8 py-3 rounded-xl font-bold disabled:opacity-50 shadow-lg">Guardar</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal de Confirmación de Borrado de Campaña */}
            {
                confirmDeleteId && (
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
                )
            }

            {/* Modal de Confirmación de Borrado de Lead */}
            {
                confirmDeleteLeadId && (
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
                )
            }

            {
                showQuoteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                            <button onClick={() => setShowQuoteModal(false)} className="absolute top-8 right-8 text-muted-foreground hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="mb-8">
                                <h2 className="text-3xl font-black gold-text">Nueva Cotización 📄</h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                    Preparando propuesta para: <span className="text-white">{selectedLead?.name}</span>
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <div className="col-span-6">Descripción del Servicio</div>
                                    <div className="col-span-2 text-center">Cant.</div>
                                    <div className="col-span-3 text-right">Precio Unit.</div>
                                    <div className="col-span-1"></div>
                                </div>

                                <div className="space-y-3">
                                    {quoteItems.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 items-center animate-in slide-in-from-left-2 duration-300">
                                            <div className="col-span-6">
                                                <input
                                                    type="text"
                                                    placeholder="Ej: Desarrollo Web Next.js"
                                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm"
                                                    value={item.description}
                                                    onChange={(e) => {
                                                        const newItems = [...quoteItems];
                                                        newItems[index].description = e.target.value;
                                                        setQuoteItems(newItems);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-center text-sm"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...quoteItems];
                                                        newItems[index].quantity = parseInt(e.target.value) || 0;
                                                        setQuoteItems(newItems);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none text-right text-sm"
                                                    value={item.price}
                                                    onChange={(e) => {
                                                        const newItems = [...quoteItems];
                                                        newItems[index].price = parseFloat(e.target.value) || 0;
                                                        setQuoteItems(newItems);
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-center">
                                                <button
                                                    disabled={quoteItems.length === 1}
                                                    onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== index))}
                                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl disabled:opacity-30"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setQuoteItems([...quoteItems, { description: '', quantity: 1, price: 0 }])}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-all px-4 py-2"
                                >
                                    <Plus className="w-4 h-4" /> Añadir Concepto
                                </button>

                                <div className="pt-6 border-t border-white/10 space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notas / Términos del Presupuesto</label>
                                    <textarea
                                        className="w-full bg-white/5 border border-white/10 p-6 rounded-3xl outline-none h-24 text-sm"
                                        placeholder="Ej: Validez 15 días. Pago 50% anticipado."
                                        value={quoteNotes}
                                        onChange={(e) => setQuoteNotes(e.target.value)}
                                    />
                                </div>

                                <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 flex justify-between items-center">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase opacity-40">Total Proyectado (Inc. IVA 16%)</p>
                                        <div className="text-4xl font-black gold-text">
                                            ${(quoteItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) * 1.16).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setShowQuoteModal(false)}
                                            className="px-8 py-4 glass border-white/10 rounded-2xl font-black uppercase tracking-widest hover:bg-white/5 transition-all outline-none"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={generateQuotePDF}
                                            disabled={isGeneratingQuote || quoteItems.some(item => !item.description || item.price <= 0)}
                                            className="gold-button px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center gap-3 disabled:opacity-50"
                                        >
                                            {isGeneratingQuote ? 'Cocinando PDF...' : <><Download className="w-5 h-5" /> Generar y Guardar</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Notification Toast */}
            {
                notification && (
                    <div className={`fixed bottom-8 right-8 z-[100] px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-4 duration-300 flex items-center gap-3 ${notification.type === 'success'
                        ? 'glass border-primary/50 text-white'
                        : 'bg-red-500/10 border-red-500/50 text-red-200'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-primary animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-sm font-bold tracking-tight">{notification.message}</span>
                    </div>
                )
            }

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
        </div >
    );
}
