import axios from 'axios';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;

export const sendToN8N = async (data: any) => {
    if (!N8N_WEBHOOK_URL) {
        console.warn('⚠️ N8N_WEBHOOK_URL no configurado.');
        return;
    }

    console.log(`� [n8n] Enviando datos a: ${N8N_WEBHOOK_URL}`);
    console.log(`📦 [n8n Data]:`, JSON.stringify(data).substring(0, 100) + '...');

    try {
        const headers: any = {
            'Content-Type': 'application/json'
        };

        const response = await axios.post(N8N_WEBHOOK_URL, data, {
            timeout: 10000,
            headers
        });
        console.log(`✅ [n8n Success] Respuesta de n8n:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ [n8n Error]:', error.response?.data || error.message);
        return { success: false, error: error.message, details: error.response?.data };
    }
};
