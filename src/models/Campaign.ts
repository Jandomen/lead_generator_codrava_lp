import mongoose, { Schema, Document } from 'mongoose';

export interface ICampaign extends Document {
    name: string;
    description?: string;
    userId: mongoose.Types.ObjectId;
    status: 'active' | 'archived' | 'draft';
    targetLocation?: string;
    targetCategory?: string;
    leadsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema: Schema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'archived', 'draft'], default: 'active' },
    targetLocation: { type: String },
    targetCategory: { type: String },
    leadsCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);
