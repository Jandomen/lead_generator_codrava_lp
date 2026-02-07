import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import Interaction from '@/models/Interaction';

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const { email, subject, content } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Buscar al lead por su correo
        const lead = await Lead.findOne({ email: email.toLowerCase() });

        if (!lead) {
            console.log(`ℹ️ [Email Webhook] Correo recibido de ${email} pero no existe en la base de datos.`);
            return NextResponse.json({ message: 'Lead not found, ignoring.' });
        }

        // 2. Crear la interacción del correo recibido
        await Interaction.create({
            leadId: lead._id,
            type: 'email',
            content: `📥 RESPUESTA RECIBIDA:\nAsunto: ${subject}\n\n${content}`
        });

        // 3. Si el lead estaba en 'new' o 'contacted', subirlo a 'interested'
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
