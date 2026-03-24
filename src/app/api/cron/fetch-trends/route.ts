import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import prisma from '@/lib/prisma';

const parser = new Parser({
  customFields: {
    item: [['ht:approx_traffic', 'approxTraffic']],
  }
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const FEED_URL = 'https://trends.google.com.br/trends/trendingsearches/daily/rss?geo=BR';
    
    console.log('Iniciando fetch manual de:', FEED_URL);

    // Fetch manual com headers completos de navegador
    const response = await fetch(FEED_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      throw new Error(`Google retornou Status ${response.status}: ${response.statusText}`);
    }

    const xmlData = await response.text();
    const feed = await parser.parseString(xmlData);
    
    const results = [];

    for (const item of feed.items) {
      const keyword = item.title || '';
      if (!keyword) continue;

      const trafficStr = (item as any).approxTraffic || '0';
      const traffic = parseInt(trafficStr.replace(/[^0-9]/g, '')) || 0;

      const existingTrend = await prisma.trend.findUnique({ where: { keyword } });
      const momentum = existingTrend && existingTrend.currentVolume > 0 
        ? ((traffic - existingTrend.currentVolume) / existingTrend.currentVolume) * 100
        : 0;

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

      await prisma.dataPoint.create({
        data: {
          trendId: trend.id,
          score: traffic,
        },
      });

      results.push({ keyword, traffic });
    }

    // Redireciona para a home usando o host da requisição atual
    const url = new URL(request.url);
    return NextResponse.redirect(new URL('/', url.origin));

  } catch (error: any) {
    console.error('CRITICAL_FETCH_ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      tip: "Se persistir, o IP do servidor pode estar bloqueado temporariamente pelo Google."
    }, { status: 500 });
  }
}
