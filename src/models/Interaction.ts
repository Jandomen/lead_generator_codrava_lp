import mongoose, { Schema, Document } from 'mongoose';

export interface IInteraction extends Document {
    leadId: mongoose.Types.ObjectId;
    type: 'note' | 'call' | 'email' | 'meeting' | 'status_change';
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

const InteractionSchema: Schema = new Schema({
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    type: {
        type: String,
        enum: ['note', 'call', 'email', 'meeting', 'status_change'],
        default: 'note'
    },
    content: { type: String, required: true },
}, { timestamps: true });

InteractionSchema.index({ leadId: 1, createdAt: -1 });

export default mongoose.models.Interaction || mongoose.model<IInteraction>('Interaction', InteractionSchema);
