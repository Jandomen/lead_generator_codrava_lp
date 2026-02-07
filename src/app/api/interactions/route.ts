import { NextResponse } from 'next/server';
import { createInteraction, getInteractionsByLead } from '@/services/interactionService';
import { updateLeadStatus } from '@/services/leadService';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const leadId = searchParams.get('leadId');

        if (!leadId) {
            return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
        }

        const interactions = await getInteractionsByLead(leadId);
        return NextResponse.json(interactions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { leadId, type, content } = await req.json();

        if (!leadId || !type || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const interaction = await createInteraction({ leadId, type, content });

        // Optionally update lead status if interaction implies it
        // Or we could have a specific interaction type for status changes

        return NextResponse.json(interaction);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
