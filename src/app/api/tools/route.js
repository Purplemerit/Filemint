import connectDB from '../../lib/mongodb';
import Tool from '../../models/Tool';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const tools = await Tool.find({}).sort({ createdAt: -1 });
    return NextResponse.json(tools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
}

// POST create new tool
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const tool = await Tool.create({
      name: body.name,
      category: body.category,
      status: body.status ?? true,
      totalVisits: body.totalVisits ?? 0,
      totalUsers: body.totalUsers ?? 0,
      description: body.description ?? '',
    });

    return NextResponse.json(tool, { status: 201 });
  } catch (error) {
    console.error('Error creating tool:', error);
    return NextResponse.json(
      { error: 'Failed to create tool' },
      { status: 500 }
    );
  }
}