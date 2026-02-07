import { NextRequest, NextResponse } from 'next/server';
import { deleteCampaign } from '@/services/campaignService';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

        await deleteCampaign(id);
        return NextResponse.json({ success: true, message: 'Campaña eliminada' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
