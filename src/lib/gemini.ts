import axios from 'axios';

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
const MODEL = 'gemini-flash-latest';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export interface LeadAnalysis {
    score: number;
    reasoning: string;
    suggestedAproach: string;
    category: string;
}

export async function analyzeLead(leadData: any): Promise<LeadAnalysis | null> {
    if (!GEMINI_API_KEY) {
        console.error('GOOGLE_GENERATIVE_AI_API_KEY is not set');
        return null;
    }

    const prompt = `
    Analiza el siguiente negocio encontrado en Google Maps y proporciona una respuesta en JSON.
    
    Datos del Negocio:
    Nombre: ${leadData.name}
    Dirección: ${leadData.address}
    Rating: ${leadData.rating}
    Reseñas: ${leadData.reviewsCount}
    Sitio Web: ${leadData.website || 'N/A'}
    
    Tarea:
    1. Asigna un puntaje del 1 al 100 basado en su potencial como cliente (un rating alto con sitio web desactualizado o inexistente suele ser un excelente lead).
    2. Proporciona un razonamiento breve en español.
    3. Sugiere un enfoque de contacto en español.
    4. Categoriza el tipo de negocio.
    
    Tu respuesta debe ser UNICAMENTE un objeto JSON válido con estas llaves:
    {
      "score": número,
      "reasoning": "string",
      "suggestedAproach": "string",
      "category": "string"
    }
  `;

    console.log(`\n✨ [Gemini AI] Analizando para: ${leadData.name}...`);

    try {
        const response = await axios.post(
            `${API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ]
            }
        );

        let content = response.data.candidates[0].content.parts[0].text;

        // Limpiar la respuesta si Gemini incluye backticks de markdown
        if (content.includes('```json')) {
            content = content.split('```json')[1].split('```')[0].trim();
        } else if (content.includes('```')) {
            content = content.split('```')[1].split('```')[0].trim();
        }

        return JSON.parse(content.trim());
    } catch (error: any) {
        console.error('Error llamando a Gemini:', error.response?.data || error.message);
        return null;
    }
}

export interface VoiceCommandData {
    intent: 'search' | 'schedule' | 'unknown';
    query?: string;
    location?: string;
    leadName?: string;
    dateTime?: string;
    limit?: number;
}

export async function parseVoiceCommand(transcript: string): Promise<VoiceCommandData> {
    if (!GEMINI_API_KEY) return { intent: 'unknown' };

    const now = new Date();
    const prompt = `
    Eres un asistente de CRM premium. Tu tarea es analizar un comando de voz del usuario y extraer la intención y los datos.
    
    Comando del usuario: "${transcript}"
    Fecha/Hora actual: ${now.toString()} (Hoy es ${['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][now.getDay()]})
    
    Instrucciones:
    1. Si el usuario quiere BUSCAR o GENERAR LEADS (ej: "busca fotógrafos en Madrid", "encuentra abogados"):
       - intent: "search"
       - query: el rubro o tipo de negocio
       - location: la ciudad o zona
    
        - dateTime: la fecha y hora calculada en formato ISO 8601 basado en la fecha actual.

    3. Para cualquier búsqueda:
       - Si el usuario especifica una CANTIDAD (ej: "busca 5 abogados", "encuentra 10 tiendas"), extrae el número en "limit".
       - El "limit" NUNCA puede ser mayor a 20. Si el usuario pide más de 20, pon 20.
       - Si no especifica cantidad, usa el valor actual de la perilla o 20 por defecto.
    
    {
      "intent": "search" | "schedule" | "unknown",
      "query": "string",
      "location": "string",
      "leadName": "string",
      "dateTime": "ISO_DATE_STRING",
      "limit": número
    }
    `;

    try {
        const response = await axios.post(
            `${API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        let content = response.data.candidates[0].content.parts[0].text;
        if (content.includes('```json')) content = content.split('```json')[1].split('```')[0].trim();
        else if (content.includes('```')) content = content.split('```')[1].split('```')[0].trim();

        return JSON.parse(content.trim());
    } catch (error) {
        console.error('Error parsing voice command:', error);
        return { intent: 'unknown' };
    }
}

export async function generateFollowUpMessage(leadName: string, category: string, reasoning: string): Promise<string> {
    if (!GEMINI_API_KEY) return `Hola ${leadName}, espero que estés bien. Quería dar seguimiento a nuestra conversación.`;

    const prompt = `
    Eres un asistente de ventas de lujo de "JandoSoft CRM".
    Escribe un mensaje de seguimiento de WhatsApp/Correo para el cliente "${leadName}".
    Contexto de negocio: ${category}.
    Razonamiento previo de IA: ${reasoning}.
    
    Instrucciones:
    - Sé elegante, breve y persuasivo.
    - El objetivo es recordar la cita y ofrecer ayuda.
    - No uses placeholders como [Nombre], usa la información proporcionada.
    - Respuesta final: SOLO el texto del mensaje.
    `;

    try {
        const response = await axios.post(
            `${API_URL}?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        return response.data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error('Error generating AI message:', error);
        return `Hola ${leadName}, un placer saludarte. ¿En qué puedo ayudarte hoy?`;
    }
}
