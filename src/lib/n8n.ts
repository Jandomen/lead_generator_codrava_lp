import axios from 'axios';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

// Puente de comunicación: Detectar dónde estamos
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : ''));
const ORIGIN_PLATFORM = process.env.VERCEL ? 'Vercel' : (process.env.RENDER ? 'Render' : 'Local');

export const sendToN8N = async (data: any) => {
    if (!N8N_WEBHOOK_URL) {
        console.warn('⚠️ N8N_WEBHOOK_URL no configurado.');
        return { success: false, error: 'N8N_WEBHOOK_URL no configurado' };
    }

    // Determine target URL based on event type if needed, or use default
    // UPDATED: Using new 'send-proposal' path to fix 404 issues and align with the new n8n configuration.
    let targetUrl = 'https://lead-generator-codrava-lp.onrender.com/webhook/send-proposal';
    // let targetUrl = N8N_WEBHOOK_URL; // Fallback to env var once fully stable

    // Enriquecer datos con metadatos del puente
    const enrichedData = {
        ...data,
        metadata: {
            origin: ORIGIN_PLATFORM,
            callback_url: APP_URL,
            timestamp: new Date().toISOString()
        }
    };

    console.log(`📡 [n8n Bridge] Origen: ${ORIGIN_PLATFORM} | Destino: ${targetUrl}`);
    console.log(`📦 [n8n Data]:`, JSON.stringify(enrichedData).substring(0, 100) + '...');

    try {
        const headers: any = {
            'Content-Type': 'application/json'
        };

        if (N8N_API_KEY) {
            headers['X-N8N-API-KEY'] = N8N_API_KEY;
        }

        const response = await axios.post(targetUrl, enrichedData, {
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
