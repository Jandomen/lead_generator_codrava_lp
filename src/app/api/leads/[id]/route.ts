import { NextResponse } from 'next/server';
import { getLeadById } from '@/services/leadService';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const lead = await getLeadById(id);
        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }
        return NextResponse.json(lead);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
