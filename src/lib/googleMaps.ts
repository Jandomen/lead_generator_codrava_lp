import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface GooglePlace {
    name: string;
    formatted_address?: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    place_id: string;
    types?: string[];
}

/**
 * Busca lugares reales usando la nueva API de Google Places (v1).
 */
export const searchPlaces = async (query: string, location?: string, limit: number = 20): Promise<GooglePlace[]> => {
    if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('GOOGLE_MAPS_API_KEY no configurada. Por favor, revisa tu archivo .env');
    }

    console.log(`[Real Search] Buscando: "${query}" en "${location || 'Cualquier lugar'}"`);

    try {
        const response = await axios.post(
            `https://places.googleapis.com/v1/places:searchText`,
            {
                textQuery: `${query} ${location || ''}`,
                languageCode: 'es',
                maxResultCount: limit // Dinámico hasta 20
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types'
                }
            }
        );

        if (!response.data.places || response.data.places.length === 0) {
            console.log(`[GoogleMaps] No se encontraron resultados reales para: ${query}`);
            return [];
        }

        return response.data.places.map((place: any) => ({
            name: place.displayName?.text || 'Sin nombre',
            formatted_address: place.formattedAddress,
            place_id: place.id,
            rating: place.rating,
            user_ratings_total: place.userRatingCount,
            types: place.types,
        }));
    } catch (error: any) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error('[GoogleMaps] Error en búsqueda real:', errorMsg);
        throw new Error(`Google Maps API Error: ${errorMsg}`);
    }
};

/**
 * Obtiene los detalles completos (teléfono, web, etc.) de un lugar real.
 */
export const getPlaceDetails = async (placeId: string): Promise<Partial<GooglePlace>> => {
    if (!GOOGLE_MAPS_API_KEY) return {};

    try {
        const response = await axios.get(
            `https://places.googleapis.com/v1/places/${placeId}`,
            {
                headers: {
                    'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
                    'X-Goog-FieldMask': 'id,displayName,nationalPhoneNumber,internationalPhoneNumber,websiteUri,formattedAddress,rating,userRatingCount,businessStatus'
                }
            }
        );

        const place = response.data;

        // Solo queremos negocios operativos
        if (place.businessStatus === 'CLOSED_PERMANENTLY' || place.businessStatus === 'CLOSED_TEMPORARILY') {
            console.warn(`[GoogleMaps] El negocio ${placeId} está cerrado.`);
        }

        return {
            name: place.displayName?.text,
            formatted_phone_number: place.nationalPhoneNumber,
            international_phone_number: place.internationalPhoneNumber,
            website: place.websiteUri,
            formatted_address: place.formattedAddress,
            rating: place.rating,
            user_ratings_total: place.userRatingCount,
            place_id: place.id
        };
    } catch (error: any) {
        console.error('[GoogleMaps] Error al obtener detalles reales:', error.response?.data?.error?.message || error.message);
        return {};
    }
};
