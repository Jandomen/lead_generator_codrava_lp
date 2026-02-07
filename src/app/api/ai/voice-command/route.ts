import { NextRequest, NextResponse } from 'next/server';
import { parseVoiceCommand } from '@/lib/gemini';
import { smartScheduleFollowUp } from '@/services/leadService';

export async function POST(req: NextRequest) {
    try {
        const { transcript } = await req.json();
        if (!transcript) return NextResponse.json({ error: 'No transcript' }, { status: 400 });

        const result = await parseVoiceCommand(transcript);

        if (result.intent === 'schedule' && result.leadName && result.dateTime) {
            const requestedDate = new Date(result.dateTime);
            const scheduleResult = await smartScheduleFollowUp(result.leadName, requestedDate);
            return NextResponse.json({
                ...result,
                scheduleResult
            });
        }

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Voice Command API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
