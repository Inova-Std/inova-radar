import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import prisma from '@/lib/prisma';

const parser = new Parser({
  customFields: {
    item: [['ht:approx_traffic', 'approxTraffic']],
  }
});

export async function GET() {
  try {
    const feed = await parser.parseURL('https://trends.google.com.br/trends/trendingsearches/daily/rss?geo=BR');
    
    const results = [];

    for (const item of feed.items) {
      const keyword = item.title || '';
      if (!keyword) continue;

      const trafficStr = (item as any).approxTraffic || '0';
      const traffic = parseInt(trafficStr.replace(/[^0-9]/g, '')) || 0;

      // Find existing trend to calculate momentum
      const existingTrend = await prisma.trend.findUnique({
        where: { keyword }
      });

      const momentum = existingTrend && existingTrend.currentVolume > 0 
        ? ((traffic - existingTrend.currentVolume) / existingTrend.currentVolume) * 100
        : 0;

      // Upsert Trend
      const trend = await prisma.trend.upsert({
        where: { keyword },
        update: {
          currentVolume: traffic,
          peakVolume: Math.max(traffic, existingTrend?.peakVolume || 0),
          momentum: momentum,
          updatedAt: new Date(),
        },
        create: {
          keyword,
          currentVolume: traffic,
          peakVolume: traffic,
          momentum: 0,
          source: 'google',
        },
      });

      // Add DataPoint
      await prisma.dataPoint.create({
        data: {
          trendId: trend.id,
          score: traffic,
        },
      });

      results.push({ keyword, traffic });
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length,
      timestamp: new Date().toISOString() 
    });

  } catch (error: any) {
    console.error('Error fetching trends:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
