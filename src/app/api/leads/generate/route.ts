import { NextResponse } from 'next/server';
import { generateLeadsForCampaign } from '@/services/campaignService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { campaignId, query, location } = body;

        console.log('--- LEAD GENERATION REQUEST ---');
        console.log('Campaign ID:', campaignId);
        console.log('Query:', query);
        console.log('Location:', location);

        if (!campaignId || !query) {
            console.warn('Missing required fields in request (campaignId or query)');
            return NextResponse.json({ error: 'Missing required fields (campaignId and query are mandatory)' }, { status: 400 });
        }

        const leads = await generateLeadsForCampaign(campaignId, query, location);
        console.log(`Successfully generated ${leads.length} leads`);

        return NextResponse.json({ success: true, count: leads.length, leads });
    } catch (error: any) {
        console.error('CRITICAL ERROR in /api/leads/generate:');
        console.error('Name:', error.name);
        console.error('Message:', error.message);
        if (error.stack) console.error('Stack:', error.stack);
        if (error.response) {
            console.error('Google API Error Data:', JSON.stringify(error.response.data, null, 2));
        }

        return NextResponse.json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}
