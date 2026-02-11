import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Quote from '@/models/Quote';

export async function GET(req: Request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(req.url);
        const leadId = searchParams.get('leadId');

        const filter = leadId ? { leadId } : {};
        const quotes = await Quote.find(filter).sort({ createdAt: -1 });
        return NextResponse.json(quotes);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching quotes' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();

        // Generate a simple quote number
        const count = await Quote.countDocuments();
        const quoteNumber = `PRO-${new Date().getFullYear()}${(count + 1).toString().padStart(4, '0')}`;

        const quote = await Quote.create({
            ...body,
            quoteNumber
        });
        return NextResponse.json(quote);
    } catch (error) {
        console.error('Error creating quote:', error);
        return NextResponse.json({ error: 'Error creating quote' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    await dbConnect();
    try {
        const { quoteId, ...updateData } = await req.json();
        const quote = await Quote.findByIdAndUpdate(quoteId, updateData, { new: true });
        return NextResponse.json(quote);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating quote' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const quoteId = searchParams.get('quoteId');
    try {
        await Quote.findByIdAndDelete(quoteId);
        return NextResponse.json({ message: 'Quote deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting quote' }, { status: 500 });
    }
}
