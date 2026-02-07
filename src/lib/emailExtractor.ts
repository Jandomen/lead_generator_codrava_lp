import axios from 'axios';

/**
 * Intenta extraer correos electrónicos de una URL dada.
 * Analiza la página principal y busca patrones de email.
 */
export async function extractEmails(url: string): Promise<string[]> {
    if (!url) return [];

    // Asegurar que la URL tenga el protocolo correcto
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    try {
        console.log(`[EmailExtractor] Intentando extraer correos de: ${targetUrl}`);

        const response = await axios.get(targetUrl, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            validateStatus: () => true // Aceptar cualquier status para intentar parsear lo que sea que venga
        });

        if (typeof response.data !== 'string') return [];

        // Regex para encontrar emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const matches = response.data.match(emailRegex);

        if (!matches) return [];

        // Filtrar duplicados y emails basura como imágenes o scripts
        const commonExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.pdf', '.js', '.css'];
        const uniqueEmails = [...new Set(matches.map(email => email.toLowerCase()))]
            .filter(email => !commonExtensions.some(ext => email.endsWith(ext)));

        return uniqueEmails;
    } catch (error) {
        console.warn(`[EmailExtractor] No se pudo acceder a ${targetUrl}:`, error instanceof Error ? error.message : 'Error desconocido');
        return [];
    }
}
