import connectDB from './../../../lib/mongodb';
import Click from '../../../models/Click';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const page = parseInt(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    // Get recent clicks
    const clicks = await Click.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip);

    // Get total count
    const totalClicks = await Click.countDocuments();

    // Get top tools by click count
    const topToolsStats = await Click.aggregate([
      {
        $group: {
          _id: '$toolName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return NextResponse.json({
      clicks,
      stats: topToolsStats,
      pagination: {
        total: totalClicks,
        page,
        limit,
        pages: Math.ceil(totalClicks / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching clicks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch clicks' },
      { status: 500 }
    );
  }
}

// POST create new click
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    // Get IP from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    const click = await Click.create({
      toolName: body.toolName,
      element: body.element,
      category: body.category,
      page: body.page,
      ip,
      userAgent,
    });

    return NextResponse.json(click, { status: 201 });
  } catch (error) {
    console.error('Error creating click:', error);
    return NextResponse.json(
      { error: 'Failed to create click' },
      { status: 500 }
    );
  }
}
