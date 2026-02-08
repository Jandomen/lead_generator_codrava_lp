import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Interaction from '@/models/Interaction';

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const body = await req.json();
        console.log('📥 [Email Webhook] Recibido payload:', JSON.stringify(body, null, 2));

        let { email, subject, content, from, From, sender } = body;

        // Intentar extraer el email de varios campos posibles
        let targetEmail = email || from || From || sender;

        // Si es un objeto (ej. n8n a veces envía objetos), intentar sacar la propiedad address o text
        if (typeof targetEmail === 'object' && targetEmail !== null) {
            targetEmail = targetEmail.address || targetEmail.text || targetEmail.value;
        }

        // Si tiene formato "Nombre <email@dom.com>", extraer solo el email
        if (typeof targetEmail === 'string' && targetEmail.includes('<')) {
            const match = targetEmail.match(/<(.+)>/);
            if (match && match[1]) {
                targetEmail = match[1];
            }
        }

        if (!targetEmail) {
            console.error('❌ [Email Webhook] Email is required. Body:', body);
            return NextResponse.json({ error: 'Email is required', received: body }, { status: 400 });
        }

        targetEmail = targetEmail.toLowerCase().trim();

        // Usar subject o content de variantes mayúsculas si no existen
        const finalSubject = subject || body.Subject || 'Sin asunto';
        const finalContent = content || body.snippet || body.body || body.text || 'Sin contenido';

        const lead = await Lead.findOne({ email: targetEmail });

        if (!lead) {
            console.log(`ℹ️ [Email Webhook] Correo recibido de ${targetEmail} pero no existe en la base de datos.`);
            // Opcional: Crear lead si no existe (Cold inbound)
            // await Lead.create({ email: targetEmail, status: 'new', name: 'Unknown' });
            return NextResponse.json({ message: 'Lead not found, ignoring.' });
        }

        await Interaction.create({
            leadId: lead._id,
            type: 'email',
            content: `📥 RESPUESTA RECIBIDA:\nAsunto: ${finalSubject}\n\n${finalContent}`
        });

        if (lead.status === 'new' || lead.status === 'contacted') {
            lead.status = 'interested';
            await lead.save();
            console.log(`🔥 [Email Webhook] Lead ${lead.name} marcado como INTERESADO automáticamente.`);
        }

        return NextResponse.json({ success: true, leadId: lead._id });

    } catch (error: any) {
        console.error('❌ [Email Webhook] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
