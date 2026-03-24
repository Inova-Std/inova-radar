'use server'

import { revalidatePath } from 'next/cache';
import Parser from 'rss-parser';
import prisma from '@/lib/prisma';
import { generateGeminiInsight } from '@/lib/gemini';

const parser = new Parser();

export async function syncTrendsAction() {
  try {
    let items: any[] = [];
    
    // Foco em notícias de impacto/política/economia
    const FEED_URL = 'https://news.google.com/rss/search?q=gastos+públicos+OR+transparência+OR+verba+OR+decisão+governo+when:48h&hl=pt-BR&gl=BR&ceid=BR:pt-419';
    
    try {
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
        })).slice(0, 10);
      }
    } catch (e) { console.error('Feed error:', e); }

    // Fallback com temas de transparência
    if (!items || items.length === 0) {
      items = [
        { keyword: 'Gastos de Gabinete 2026', traffic: 45000 },
        { keyword: 'Cartão Corporativo Presidencial', traffic: 120000 },
        { keyword: 'Novas Licitações do Senado', traffic: 30000 },
        { keyword: 'Auxílio Moradia Judiciário', traffic: 85000 },
        { keyword: 'Arquivos Desclassificados Abin', traffic: 60000 }
      ];
    }

    for (const item of items) {
      const { keyword, traffic } = item;
      const existingTrend = await prisma.trend.findUnique({ where: { keyword } });
      const momentum = existingTrend && existingTrend.currentVolume > 0 
        ? ((traffic - existingTrend.currentVolume) / existingTrend.currentVolume) * 100 
        : (Math.random() * 20);
      
      // A MÁGICA: Gera o insight usando o Gemini
      const insight = await generateGeminiInsight(keyword);

      const trend = await prisma.trend.upsert({
        where: { keyword },
        update: { 
          currentVolume: traffic, 
          momentum, 
          category: insight.category,
          updatedAt: new Date() 
        },
        create: { 
          keyword, 
          currentVolume: traffic, 
          peakVolume: traffic, 
          momentum, 
          category: insight.category,
          source: 'radar-ai' 
        },
      });

      // Salva a Ideia de App gerada pela IA
      await prisma.autoIdea.create({
        data: {
          trendId: trend.id,
          generatedPitch: insight.pitch,
          viabilityScore: insight.viability
        }
      });

      await prisma.dataPoint.create({
        data: { trendId: trend.id, score: traffic },
      });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Sync error:', error);
    return { success: false, error: error.message };
  }
}
