'use server'

import { revalidatePath } from 'next/cache';
import Parser from 'rss-parser';
import prisma from '@/lib/prisma';

const parser = new Parser();

// Lógica para gerar o "Pitch Inova" baseado no tema
function generateInovaPitch(keyword: string): { pitch: string, viability: number, category: string } {
  const k = keyword.toLowerCase();
  
  if (k.includes('gasto') || k.includes('verba') || k.includes('viagem') || k.includes('cartão')) {
    return {
      pitch: `Crie um '${keyword.split(' ')[0]}ômetro'. Um dashboard que mapeia esses gastos em tempo real, comparando com o custo de cestas básicas ou salários mínimos para gerar indignação visual.`,
      viability: 9.2,
      category: 'Transparência'
    };
  }
  
  if (k.includes('documento') || k.includes('arquivo') || k.includes('vazamento') || k.includes('lista')) {
    return {
      pitch: `Interface 'Leaked Explorer'. Transforme esses arquivos brutos em uma experiência interativa (como um celular ou desktop fake) onde o usuário pode 'bisbilhotar' as conversas e documentos de forma intuitiva.`,
      viability: 8.5,
      category: 'Exploração'
    };
  }

  if (k.includes('eleição') || k.includes('deputado') || k.includes('senador') || k.includes('política')) {
    return {
      pitch: `Ferramenta 'De Olho no Voto'. Um ranking de fidelidade ou de gastos de gabinete com uma UI extremamente simples (Mobile-first) para o eleitor consultar na rua antes de discutir.`,
      viability: 8.8,
      category: 'Políticometro'
    };
  }

  // Pitch padrão para temas gerais (adaptado para utilidade)
  return {
    pitch: `Transforme os dados brutos de '${keyword}' em um placar de impacto social. Foque em 'Gamificar a Transparência' para que o usuário sinta que está fiscalizando algo importante.`,
    viability: 7.5,
    category: 'Utilidade'
  };
}

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
    } catch (e) { console.error(e); }

    // Fallback com temas que VOCÊ gosta (Políticos e Transparência)
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
      const momentum = existingTrend ? ((traffic - existingTrend.currentVolume) / existingTrend.currentVolume) * 100 : (Math.random() * 20);
      
      const insight = generateInovaPitch(keyword);

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

      // Salva a Ideia de App
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
    return { success: false, error: error.message };
  }
}
