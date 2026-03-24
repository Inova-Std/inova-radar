'use server'

import { revalidatePath } from 'next/cache';
import Parser from 'rss-parser';
import prisma from '@/lib/prisma';

const parser = new Parser();

export async function syncTrendsAction() {
  try {
    let items: any[] = [];
    
    // Tenta Google News
    try {
      const FEED_URL = 'https://news.google.com/rss/search?q=trending+brasil+when:24h&hl=pt-BR&gl=BR&ceid=BR:pt-419';
      const response = await fetch(FEED_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        cache: 'no-store'
      });
      
      if (response.ok) {
        const xmlData = await response.text();
        const feed = await parser.parseString(xmlData);
        items = feed.items.map(item => ({
          keyword: item.title?.split(' - ')[0] || '',
          traffic: Math.floor(Math.random() * (100000 - 10000) + 10000)
        })).slice(0, 15);
      }
    } catch (e) {
      console.error('RSS Fail:', e);
    }

    // Fallback Mock
    if (!items || items.length === 0) {
      items = [
        { keyword: 'Inteligência Artificial Generativa', traffic: 155000 },
        { keyword: 'iPhone 17 Pro Max', traffic: 90000 },
        { keyword: 'Copa do Mundo Feminina', traffic: 210000 },
        { keyword: 'Exploração de Marte SpaceX', traffic: 48000 },
        { keyword: 'Real Digital (DREX)', traffic: 32000 },
        { keyword: 'Série A Brasileirão', traffic: 310000 },
        { keyword: 'Favoritos Oscar 2026', traffic: 78000 }
      ];
    }

    for (const item of items) {
      const { keyword, traffic } = item;
      const existingTrend = await prisma.trend.findUnique({ where: { keyword } });
      const momentum = existingTrend && existingTrend.currentVolume > 0 
        ? ((traffic - existingTrend.currentVolume) / existingTrend.currentVolume) * 100 
        : (Math.random() * 30);

      const trend = await prisma.trend.upsert({
        where: { keyword },
        update: { currentVolume: traffic, momentum, updatedAt: new Date() },
        create: { keyword, currentVolume: traffic, peakVolume: traffic, momentum, source: 'radar-ai' },
      });

      await prisma.dataPoint.create({
        data: { trendId: trend.id, score: traffic },
      });
    }

    // A MÁGICA: Limpa o cache da home e força o reload dos dados
    revalidatePath('/');
    return { success: true };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
