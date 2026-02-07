import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'google/gemma-3-4b-it:free';

export interface LeadAnalysis {
    score: number;
    reasoning: string;
    suggestedAproach: string;
    category: string;
}

export async function analyzeLead(leadData: any): Promise<LeadAnalysis | null> {
    if (!OPENROUTER_API_KEY) {
        console.error('OPENROUTER_API_KEY is not set');
        return null;
    }

    const prompt = `
    Analyze the following business lead found on Google Maps and provide a JSON response.
    
    Business Data:
    Name: ${leadData.name}
    Address: ${leadData.address}
    Rating: ${leadData.rating}
    Reviews: ${leadData.reviewsCount}
    Website: ${leadData.website || 'N/A'}

    Task:
    1. Assign a score from 1 to 100 based on its potential as a business client (High rating/reviews with out-of-date websites are usually great leads).
    2. Provide a brief reasoning in Spanish.
    3. Suggest a contact approach in Spanish.
    4. Categorize the business type.

    Your response MUST be ONLY a valid JSON object with the following keys:
    {
      "score": number,
      "reasoning": "string",
      "suggestedAproach": "string",
      "category": "string"
    }
  `;

    console.log(`\n🤖 [AI] Analizando para: ${leadData.name} usando ${MODEL}...`);
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: MODEL,
                messages: [{ role: 'user', content: prompt }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://github.com/lead-generator',
                }
            }
        );

        let content = response.data.choices[0].message.content;

        // Limpiar la respuesta por si la IA añade backticks de markdown
        content = content.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();

        return JSON.parse(content);
    } catch (error: any) {
        console.error('Error calling OpenRouter:', error.response?.data || error.message);
        return null;
    }
}
