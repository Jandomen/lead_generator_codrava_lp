import dbConnect from '@/lib/db';
import Interaction from '@/models/Interaction';

export const createInteraction = async (data: { leadId: string, type: string, content: string }) => {
    await dbConnect();
    return Interaction.create(data);
};

export const getInteractionsByLead = async (leadId: string) => {
    await dbConnect();
    return Interaction.find({ leadId }).sort({ createdAt: -1 });
};

export const deleteInteraction = async (id: string) => {
    await dbConnect();
    return Interaction.findByIdAndDelete(id);
};
