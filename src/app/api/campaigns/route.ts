import { NextResponse } from 'next/server';
import { getCampaigns, createCampaign } from '@/services/campaignService';

export async function GET() {
    try {
        // For now, using a hardcoded user ID until auth is fully setup
        const userId = '65b2f1e2e4b0a1a2b3c4d5e6';
        const campaigns = await getCampaigns(userId);
        return NextResponse.json(campaigns);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const userId = '65b2f1e2e4b0a1a2b3c4d5e6'; // Mock user ID
        const campaign = await createCampaign({ ...body, userId });
        return NextResponse.json(campaign);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
