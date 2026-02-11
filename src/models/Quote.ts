import mongoose, { Schema, Document } from 'mongoose';

export interface IQuoteItem {
    description: string;
    quantity: number;
    price: number;
}

export interface IQuote extends Document {
    leadId: mongoose.Types.ObjectId;
    quoteNumber: string;
    items: IQuoteItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    validUntil: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const QuoteSchema: Schema = new Schema({
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    quoteNumber: { type: String, required: true, unique: true },
    items: [{
        description: { type: String, required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true }
    }],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['draft', 'sent', 'accepted', 'rejected'],
        default: 'draft'
    },
    validUntil: { type: Date },
    notes: { type: String },
}, { timestamps: true });

export default mongoose.models.Quote || mongoose.model<IQuote>('Quote', QuoteSchema);
