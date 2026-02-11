import axios from 'axios';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Puente de comunicación: Detectar dónde estamos
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000');
const ORIGIN_PLATFORM = process.env.VERCEL ? 'Vercel' : (process.env.RENDER ? 'Render' : 'Local');

export const sendToN8N = async (data: any) => {
    if (!N8N_WEBHOOK_URL) {
        console.warn('⚠️ N8N_WEBHOOK_URL no configurado.');
        return { success: false, error: 'N8N_WEBHOOK_URL no configurado' };
    }

    // Enriquecer datos con metadatos del puente
    const enrichedData = {
        ...data,
        metadata: {
            origin: ORIGIN_PLATFORM,
            callback_url: APP_URL,
            timestamp: new Date().toISOString()
        }
    };

    console.log(`📡 [n8n Bridge] Origen: ${ORIGIN_PLATFORM} | Destino: ${N8N_WEBHOOK_URL}`);
    console.log(`📦 [n8n Data]:`, JSON.stringify(enrichedData).substring(0, 100) + '...');

    try {
        const headers: any = {
            'Content-Type': 'application/json'
        };

        if (N8N_API_KEY) {
            headers['X-N8N-API-KEY'] = N8N_API_KEY;
        }

        const response = await axios.post(N8N_WEBHOOK_URL, enrichedData, {
            timeout: 10000,
            headers
        });
        console.log(`✅ [n8n Success] Respuesta de n8n:`, response.data);
        return { success: true, data: response.data };
    } catch (error: any) {
        const errorDetail = error.response?.data || error.message;
        console.error('❌ [n8n Error]:', errorDetail);
        return {
            success: false,
            error: error.message,
            details: errorDetail,
            statusCode: error.response?.status
        };
    }
};
