import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Interaction from '@/models/Interaction';
import { sendToN8N } from '@/lib/n8n';

export const getLeads = async (campaignId?: string) => {
    await dbConnect();
    const query = campaignId ? { campaignId } : {};
    return Lead.find(query).sort({ createdAt: -1 });
};

export const getUpcomingFollowUps = async () => {
    await dbConnect();
    return Lead.find({
        nextFollowUp: { $exists: true, $ne: null }
    }).sort({ nextFollowUp: 1 });
};

export const getLeadById = async (leadId: string) => {
    await dbConnect();
    return Lead.findById(leadId);
};

export const updateLead = async (leadId: string, data: any) => {
    await dbConnect();
    const oldLead = await Lead.findById(leadId);
    if (!oldLead) throw new Error('Lead not found');

    const lead = await Lead.findByIdAndUpdate(leadId, data, { new: true });

    // Record the status change in Interaction history
    if (data.status && oldLead.status !== data.status) {
        await Interaction.create({
            leadId,
            type: 'status_change',
            content: `Estado cambiado de "${oldLead.status}" a "${data.status}"`
        });

        // If interested, maybe send to n8n automatically
        if (data.status === 'interested') {
            await sendToN8N({ event: 'lead_interested', lead });
        }
    }

    return lead;
};

export const updateLeadStatus = updateLead;

export const deleteLead = async (leadId: string) => {
    await dbConnect();
    return Lead.findByIdAndDelete(leadId);
};

export const smartScheduleFollowUp = async (leadName: string, requestedDate: Date) => {
    await dbConnect();

    // 1. Encontrar al lead por nombre (búsqueda parcial insensible a mayúsculas)
    const lead = await Lead.findOne({ name: { $regex: leadName, $options: 'i' } }).sort({ updatedAt: -1 });
    if (!lead) throw new Error(`No se encontró ningún lead llamado "${leadName}"`);

    let finalDate = new Date(requestedDate);
    let isOccupied = true;
    const SLOT_DURATION_MS = 60 * 60 * 1000; // 1 hora por cita

    // 2. Lógica para buscar un hueco libre
    while (isOccupied) {
        const startWindow = new Date(finalDate.getTime() - SLOT_DURATION_MS + 1000); // 1ms después del inicio del slot anterior
        const endWindow = new Date(finalDate.getTime() + SLOT_DURATION_MS - 1000);

        const collision = await Lead.findOne({
            _id: { $ne: lead._id },
            nextFollowUp: {
                $gte: startWindow,
                $lte: endWindow
            }
        });

        if (collision) {
            // Si hay colisión, movemos el finalDate 1 hora adelante y volvemos a intentar
            finalDate = new Date(finalDate.getTime() + SLOT_DURATION_MS);
        } else {
            isOccupied = false;
        }
    }

    // 3. Actualizar el lead
    lead.nextFollowUp = finalDate;
    await lead.save();

    await Interaction.create({
        leadId: lead._id,
        type: 'note',
        content: `Cita agendada por Voz para el ${finalDate.toLocaleString('es-ES')}`
    });

    return {
        lead,
        confirmedDate: finalDate,
        wasAdjusted: finalDate.getTime() !== requestedDate.getTime()
    };
};

export const checkReminders = async () => {
    await dbConnect();
    const now = new Date();
    const notificationWindow = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos antes

    const pendingLeads = await Lead.find({
        nextFollowUp: { $gte: now, $lte: notificationWindow },
        reminderSent: { $ne: true }
    });

    const results = [];
    for (const lead of pendingLeads) {
        await sendToN8N({
            event: 'appointment_reminder',
            lead: {
                name: lead.name,
                email: lead.email,
                time: lead.nextFollowUp,
                phone: lead.phone
            }
        });

        if (lead.autoFollowUp) {
            await autoAIFollowUp(lead._id as string);
        }

        lead.reminderSent = true;
        await lead.save();
        results.push(lead.name);
    }

    return results;
};

export const autoAIFollowUp = async (leadId: string) => {
    await dbConnect();
    const lead = await Lead.findById(leadId);
    if (!lead || !lead.email) return null;

    const { generateFollowUpMessage } = await import('@/lib/gemini');
    const aiMessage = await generateFollowUpMessage(
        lead.name,
        lead.aiAnalysis?.category || 'General',
        lead.aiAnalysis?.reasoning || 'Seguimiento estándar'
    );

    // Enviar a n8n para que procese el envío real
    await sendToN8N({
        event: 'ai_auto_followup',
        lead: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone
        },
        aiMessage
    });

    // Registrar en actividad
    await Interaction.create({
        leadId: lead._id,
        type: 'email',
        content: `🤖 IA PILOTO envió seguimiento automático: "${aiMessage.substring(0, 50)}..."`
    });

    return true;
};
