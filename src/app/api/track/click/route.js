import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Click from '../../../models/Click';

export async function POST(request) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Get IP and user agent from request headers
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    // Create click record
    const click = await Click.create({
      toolName: body.toolName || body.tool || 'Unknown',
      element: body.element || 'button',
      category: body.category || 'Uncategorized',
      page: body.page || '/',
      ip,
      userAgent,
      timestamp: new Date(),
    });

    console.log('✅ Click tracked:', {
      toolName: click.toolName,
      element: click.element,
      page: click.page,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Click tracked successfully',
      clickId: click._id 
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error tracking click:', error);
    console.error('Error details:', error.message);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to track click',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to verify the route works
export async function GET() {
  return NextResponse.json({ 
    message: 'Click tracking endpoint is active',
    timestamp: new Date().toISOString()
  });
}