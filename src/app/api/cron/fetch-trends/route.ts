import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import prisma from '@/lib/prisma';

const parser = new Parser({
  customFields: {
    item: [['ht:approx_traffic', 'approxTraffic']],
  },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  }
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Usando a URL global que é mais estável
    const FEED_URL = 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR';
    
    console.log('Fetching trends from:', FEED_URL);
    const feed = await parser.parseURL(FEED_URL);
    
    const results = [];

    for (const item of feed.items) {
      const keyword = item.title || '';
      if (!keyword) continue;

      const trafficStr = (item as any).approxTraffic || '0';
      const traffic = parseInt(trafficStr.replace(/[^0-9]/g, '')) || 0;

      // Find existing trend
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

    // Redireciona de volta para a home para o usuário ver o resultado na hora
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));

  } catch (error: any) {
    console.error('Error fetching trends:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      detail: "O Google Trends pode ter bloqueado a requisição ou a URL mudou."
    }, { status: 500 });
  }
}
