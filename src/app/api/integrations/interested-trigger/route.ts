import { NextResponse } from 'next/server';
import { sendToN8N } from '@/lib/n8n';

export async function POST(req: Request) {
    try {
        const { lead } = await req.json();

        if (!lead) {
            return NextResponse.json({ success: false, error: 'Lead data is required' }, { status: 400 });
        }

        // Trigger n8n with the 'lead_interested' event
        const result = await sendToN8N({
            event: 'lead_interested',
            lead: {
                id: lead._id,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                website: lead.website,
                aiScore: lead.aiScore,
                category: lead.aiAnalysis?.category,
            },
            actions_requested: [
                'send_ai_intro_email',
                'create_task_24h'
            ],
            timestamp: new Date().toISOString()
        });

        if (!result.success) {
            return NextResponse.json(result, { status: result.statusCode || 500 });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Interested trigger error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error al disparar la automatización'
        }, { status: 500 });
    }
}
