
import connectDB from './../../../lib/mongodb';
import Tool from '../../../models/Tool';
import Click from '../../../models/Click';
import Analytics from '../../../models/Analytics';
import { NextResponse } from 'next/server';
import PageView from "../../../models/PageView"; 
export async function GET() {
  try {
    await connectDB();

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's clicks
    const todayClicks = await Click.countDocuments({
      timestamp: { $gte: today, $lt: tomorrow }
    });

    // Get today's page views
    const todayPageViews = await PageView.countDocuments({
      timestamp: { $gte: today, $lt: tomorrow }
    });

    // Get unique IPs today
    const uniqueIps = await PageView.distinct('ip', {
      timestamp: { $gte: today, $lt: tomorrow }
    });

    // Get yesterday's data for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayClicks = await Click.countDocuments({
      timestamp: { $gte: yesterday, $lt: today }
    });

    const yesterdayPageViews = await PageView.countDocuments({
      timestamp: { $gte: yesterday, $lt: today }
    });

    const yesterdayUniqueIps = await PageView.distinct('ip', {
      timestamp: { $gte: yesterday, $lt: today }
    });

    return NextResponse.json({
      today: {
        totalClicks: todayClicks,
        pageViews: todayPageViews,
        totalVisitors: uniqueIps.length,
        uniqueIps: uniqueIps.length,
      },
      yesterday: {
        totalClicks: yesterdayClicks,
        pageViews: yesterdayPageViews,
        totalVisitors: yesterdayUniqueIps.length,
      },
      growth: {
        clicks: yesterdayClicks > 0 
          ? ((todayClicks - yesterdayClicks) / yesterdayClicks * 100).toFixed(1)
          : 0,
        pageViews: yesterdayPageViews > 0
          ? ((todayPageViews - yesterdayPageViews) / yesterdayPageViews * 100).toFixed(1)
          : 0,
        visitors: yesterdayUniqueIps.length > 0
          ? ((uniqueIps.length - yesterdayUniqueIps.length) / yesterdayUniqueIps.length * 100).toFixed(1)
          : 0,
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}