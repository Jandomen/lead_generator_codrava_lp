import { NextResponse } from 'next/server';
import { getLeads, updateLead } from '@/services/leadService';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const campaignId = searchParams.get('campaignId');
        const agenda = searchParams.get('agenda');

        if (agenda === 'true') {
            const { getUpcomingFollowUps } = await import('@/services/leadService');
            const leads = await getUpcomingFollowUps();
            return NextResponse.json(leads);
        }

        if (!campaignId && !agenda) {
            return NextResponse.json({ error: 'Campaign ID or Agenda flag is required' }, { status: 400 });
        }

        const leads = await getLeads(campaignId || undefined);
        return NextResponse.json(leads);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { leadId, ...updateData } = await req.json();

        if (!leadId) {
            return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
        }

        const lead = await updateLead(leadId, updateData);
        return NextResponse.json(lead);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
