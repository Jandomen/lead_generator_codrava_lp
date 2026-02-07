import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
    campaignId: mongoose.Types.ObjectId;
    name: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    rating?: number;
    reviewsCount?: number;
    value?: number;
    status: 'new' | 'contacted' | 'interested' | 'not_interested' | 'converted';
    source: 'google_maps' | 'manual' | 'import' | 'webhook';
    aiScore?: number;
    aiAnalysis?: {
        reasoning?: string;
        suggestedAproach?: string;
        category?: string;
    };
    nextFollowUp?: Date;
    reminderSent?: boolean;
    autoFollowUp?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const LeadSchema: Schema = new Schema({
    campaignId: { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    website: { type: String },
    address: { type: String },
    rating: { type: Number },
    reviewsCount: { type: Number },
    value: { type: Number, default: 0 },
    status: { type: String, enum: ['new', 'contacted', 'interested', 'not_interested', 'converted'], default: 'new' },
    source: { type: String, enum: ['google_maps', 'manual', 'import', 'webhook'], default: 'google_maps' },
    metadata: { type: Schema.Types.Mixed },
    aiScore: { type: Number },
    aiAnalysis: {
        reasoning: { type: String },
        suggestedAproach: { type: String },
        category: { type: String }
    },
    nextFollowUp: { type: Date },
    reminderSent: { type: Boolean, default: false },
    autoFollowUp: { type: Boolean, default: false }
}, { timestamps: true });

// Index for better search
LeadSchema.index({ campaignId: 1 });
LeadSchema.index({ name: 'text', address: 'text' });

export default mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
