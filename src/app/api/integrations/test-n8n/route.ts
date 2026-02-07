import { NextResponse } from 'next/server';
import { sendToN8N } from '@/lib/n8n';

export async function POST() {
    try {
        const mockLead = {
            id: 'test_123',
            name: 'Restaurante El Gourmet (TEST)',
            email: 'contacto@test-elgourmet.es',
            phone: '+34 912 345 678',
            website: 'https://test-elgourmet.es',
            status: 'interested',
            source: 'test_manual',
            metadata: {
                test_date: new Date().toISOString(),
                environment: process.env.NODE_ENV
            }
        };

        const result = await sendToN8N({
            event: 'test_connection',
            lead: mockLead,
            timestamp: new Date().toISOString()
        });

        if (!process.env.N8N_WEBHOOK_URL) {
            return NextResponse.json({
                success: false,
                error: 'No hay URL de n8n configurada en el servidor (N8N_WEBHOOK_URL)'
            }, { status: 400 });
        }

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('N8N test error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Error al conectar con n8n'
        }, { status: 500 });
    }
}
