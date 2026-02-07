import { NextResponse } from 'next/server';
import { checkReminders } from '@/services/leadService';

export async function GET() {
    try {
        const notified = await checkReminders();
        return NextResponse.json({
            success: true,
            message: `Procesados ${notified.length} recordatorios`,
            leads: notified
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
