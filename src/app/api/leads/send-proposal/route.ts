import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Lead from '@/models/Lead';
import { sendToN8N } from '@/lib/n8n';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const { leadId, email: customEmail } = await req.json();

        let lead = null;
        if (leadId) {
            lead = await Lead.findById(leadId);
        }

        const targetEmail = customEmail || lead?.email;
        const targetName = lead?.name || 'Cliente';

        console.log(`📧 [Proposal] Intentando enviar a: ${targetEmail} (Nombre: ${targetName})`);

        if (!targetEmail) {
            return NextResponse.json({ error: 'No email address provided' }, { status: 400 });
        }


        const templatePath = path.join(process.cwd(), 'PLANTILLA DE CODRAVA LP.html');
        let htmlContent = '';

        try {
            htmlContent = fs.readFileSync(templatePath, 'utf-8');
        } catch (err) {
            console.error('Error reading HTML template:', err);
            return NextResponse.json({ error: 'Could not read HTML template file' }, { status: 500 });
        }


        const currentYear = new Date().getFullYear().toString();
        const personalizedHtml = htmlContent
            .replace(/{{NAME}}/g, targetName)
            .replace(/{{YEAR}}/g, currentYear);


        console.log(`🚀 [Proposal] Enviando webhook a n8n...`);
        const n8nResponse = await sendToN8N({
            event: 'send_proposal',
            lead: {
                id: lead?._id || 'quick-send',
                name: targetName,
                email: targetEmail,
                phone: lead?.phone || 'N/A',
                website: lead?.website || 'N/A'
            },
            emailConfig: {
                subject: `Propuesta Exclusiva para ${targetName} — CODRAVA LP`,
                html: personalizedHtml
            }
        });

        console.log(`✅ [Proposal] Respuesta de n8n:`, n8nResponse);


        if (lead) {
            const Interaction = (await import('@/models/Interaction')).default;
            await Interaction.create({
                leadId: lead._id,
                type: 'email',
                content: `Se envió la propuesta comercial al correo: ${targetEmail}`
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Propuesta enviada a la cola de n8n',
            n8nResponse
        });

    } catch (error: any) {
        console.error('❌ [Proposal] Error fatal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
