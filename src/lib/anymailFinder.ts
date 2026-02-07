import axios from 'axios';

const ANYMAIL_FINDER_API_KEY = process.env.ANYMAIL_FINDER_API_KEY;

/**
 * Busca correos asociados a un dominio usando Anymail Finder.
 * @param domain El dominio de la empresa (ej: empresa.com)
 * @returns Una lista de correos encontrados o un array vacío si falla.
 */
export async function findEmailsByDomain(domain: string): Promise<string[]> {
    if (!ANYMAIL_FINDER_API_KEY) {
        console.warn('⚠️ ANYMAIL_FINDER_API_KEY no configurada. Saltando búsqueda en Anymail Finder.');
        return [];
    }

    if (!domain) return [];

    // Limpiar el dominio (quitar http/https y subpáginas)
    const cleanDomain = domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0];

    try {
        console.log(`🔍 [Anymail Finder] Buscando correos para el dominio: ${cleanDomain}`);

        // Usamos el endpoint de búsqueda por dominio
        const response = await axios.post(
            'https://api.anymailfinder.com/v5.1/search/company.json',
            { domain: cleanDomain },
            {
                headers: {
                    'X-Api-Key': ANYMAIL_FINDER_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data && response.data.emails) {
            const foundEmails = response.data.emails.map((e: any) => e.email);
            console.log(`✅ [Anymail Finder] Se encontraron ${foundEmails.length} correos.`);
            return foundEmails;
        }

        return [];
    } catch (error: any) {
        console.error('❌ [Anymail Finder] Error en la API:', error.response?.data || error.message);
        return [];
    }
}
