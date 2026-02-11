import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';

export async function GET() {
    await dbConnect();
    try {
        const tasks = await Task.find({}).sort({ dueDate: 1, createdAt: -1 });
        return NextResponse.json(tasks);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching tasks' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    await dbConnect();
    try {
        const body = await req.json();
        const task = await Task.create(body);
        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating task' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    await dbConnect();
    try {
        const { taskId, ...updateData } = await req.json();
        const task = await Task.findByIdAndUpdate(taskId, updateData, { new: true });
        return NextResponse.json(task);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating task' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    try {
        await Task.findByIdAndDelete(taskId);
        return NextResponse.json({ message: 'Task deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting task' }, { status: 500 });
    }
}
