
import dbConnect from './src/lib/db.js';
import { generateLeadsForCampaign } from './src/services/campaignService.js';
import Campaign from './src/models/Campaign.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    await dbConnect();
    // Create a mock campaign if none exists
    let campaign = await Campaign.findOne();
    if (!campaign) {
        campaign = await Campaign.create({ name: 'Test Campaign', userId: '65b2f1e2e4b0a1a2b3c4d5e6' });
    }

    console.log('Using campaign:', campaign._id);

    try {
        const leads = await generateLeadsForCampaign(campaign._id.toString(), 'dentist', 'Madrid');
        console.log('Generated leads:', leads.length);
    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

test();
