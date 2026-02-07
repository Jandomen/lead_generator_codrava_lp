import dbConnect from '@/lib/db';
import Campaign, { ICampaign } from '@/models/Campaign';
import Lead from '@/models/Lead';
import { searchPlaces, getPlaceDetails } from '@/lib/googleMaps';
import mongoose from 'mongoose';
import { analyzeLead } from '@/lib/gemini';

import { sendToN8N } from '@/lib/n8n';
import { extractEmails } from '@/lib/emailExtractor';

export const createCampaign = async (data: Partial<ICampaign>) => {
    await dbConnect();
    const campaign = await Campaign.create(data);
    return campaign;
};

export const getCampaigns = async (userId: string) => {
    await dbConnect();
    return Campaign.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
};

export const generateLeadsForCampaign = async (campaignId: string, query: string, location: string) => {
    await dbConnect();

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) throw new Error('Campaign not found');

    const createdLeads = [];

    try {
        const places = await searchPlaces(query, location);
        console.log(`Places found: ${places.length}`);

        for (const place of places) {
            try {
                // Delay para evitar Rate Limiting de Gemini Free (Evitar RESOURCE_EXHAUSTED)
                await new Promise(resolve => setTimeout(resolve, 6000));
                // Check if lead already exists in this campaign
                const existingLead = await Lead.findOne({ campaignId, name: place.name });
                if (existingLead) {
                    createdLeads.push(existingLead);
                    continue;
                }

                // Fetch full details (for phone, website, etc.)
                console.log(`Fetching details for: ${place.name} (${place.place_id})`);
                const details = await getPlaceDetails(place.place_id);

                // Intentar extraer correos si hay sitio web
                let foundEmail = '';
                if (details.website) {
                    // PLAN A: Scraper gratis
                    const emails = await extractEmails(details.website);
                    if (emails.length > 0) {
                        foundEmail = emails[0];
                        console.log(`📧 [Scraper] Email encontrado para ${place.name}: ${foundEmail}`);
                    } else {
                        // PLAN B: OSINT via n8n (rix4uni/emailfinder) - GRATIS
                        console.log(`🔍 [Service] Scraper falló para ${place.name}, activando OSINT en n8n...`);
                        const osintResult = await sendToN8N({
                            event: 'deep_email_search',
                            domain: details.website.replace('https://', '').replace('http://', '').split('/')[0],
                            leadId: place.place_id
                        });

                        // Si n8n ya encontró algo en su proceso asíncrono, podríamos recibirlo aquí
                        // Aunque normalmente n8n lo actualizará en la DB después
                        if (osintResult && osintResult.email) {
                            foundEmail = osintResult.email;
                            console.log(`🎯 [OSINT] Email encontrado vía n8n para ${place.name}: ${foundEmail}`);
                        }
                    }
                }

                // IA Analysis
                console.log(`Analyzing lead with AI: ${place.name}`);
                const aiAnalysis = await analyzeLead({
                    name: place.name,
                    address: place.formatted_address || details.formatted_address,
                    rating: place.rating || details.rating,
                    reviewsCount: place.user_ratings_total || details.user_ratings_total,
                    website: details.website
                });

                const newLead = await Lead.create({
                    campaignId,
                    name: place.name,
                    address: place.formatted_address || details.formatted_address,
                    phone: details.formatted_phone_number || details.international_phone_number,
                    website: details.website,
                    email: foundEmail,
                    rating: place.rating || details.rating,
                    reviewsCount: place.user_ratings_total || details.user_ratings_total,
                    source: 'google_maps',
                    status: 'new',
                    aiScore: aiAnalysis?.score || 0,
                    aiAnalysis: aiAnalysis ? {
                        reasoning: aiAnalysis.reasoning,
                        suggestedAproach: aiAnalysis.suggestedAproach,
                        category: aiAnalysis.category
                    } : undefined
                });

                // Notify n8n about the new lead
                await sendToN8N({ event: 'lead_discovered', lead: newLead, campaignName: campaign.name });
                createdLeads.push(newLead);
            } catch (leadError) {
                console.error(`Error processing lead ${place.name}:`, leadError);
                // Continue with next place even if one fails
            }
        }
    } catch (searchError: any) {
        console.error('Error searching places:', searchError);
        throw new Error(`Error en la búsqueda de Google Maps: ${searchError.message}`);
    }

    // Update campaign lead count
    campaign.leadsCount = await Lead.countDocuments({ campaignId });
    await campaign.save();

    return createdLeads;
};
export const deleteCampaign = async (campaignId: string) => {
    await dbConnect();
    // 1. Borrar todos los leads de esta campaña
    await Lead.deleteMany({ campaignId });
    // 2. Borrar la campaña
    const result = await Campaign.findByIdAndDelete(campaignId);
    return result;
};
