import prisma from '@/lib/prisma';
import { HeroGraph } from '@/components/hero-graph';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncButton } from '@/components/sync-button';
import { TrendingUp, TrendingDown, Minus, Radio, Lightbulb } from "lucide-react";
import { format } from 'date-fns';

async function getTrends() {
  const trends = await prisma.trend.findMany({
    orderBy: { currentVolume: 'desc' },
    take: 20,
    include: {
      dataPoints: {
        orderBy: { timestamp: 'asc' },
        take: 12,
      },
      ideas: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });
  return trends;
}

export default async function RadarPage() {
  const trends = await getTrends();

  // Empty state handling
  if (trends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center space-y-6">
        <div className="bg-blue-100 p-6 rounded-full animate-pulse">
          <Radio className="w-12 h-12 text-blue-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Radar em Busca de Sinais...</h1>
          <p className="text-zinc-500 max-w-md">O banco de dados ainda está vazio. Clique abaixo para iniciar a primeira varredura de tendências globais.</p>
        </div>
        <SyncButton size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" label="Sincronizar Agora" />
      </div>
    );
  }

  // Format data for the chart (HeroGraph)
  const topTrends = trends.slice(0, 5);
  const chartDataMap: Record<string, any> = {};

  topTrends.forEach(trend => {
    trend.dataPoints.forEach(dp => {
      const time = format(dp.timestamp, 'HH:mm');
      if (!chartDataMap[time]) {
        chartDataMap[time] = { timestamp: time };
      }
      chartDataMap[time][trend.keyword] = dp.score;
    });
  });

  const chartData = Object.values(chartDataMap).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const trendKeywords = topTrends.map(t => t.keyword);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-10 max-w-6xl">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse" />
            Live Insights
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Inova Radar 📡</h1>
          <p className="text-zinc-500 text-lg">Mapeando polêmicas, gastos e transparência para o próximo Micro-SaaS.</p>
        </div>
        
        <SyncButton variant="outline" size="sm" className="text-zinc-500 hover:text-blue-600" label="Atualizar Radar" />
      </header>

      {/* Hero Graph Section */}
      <section>
        <HeroGraph data={chartData} trends={trendKeywords} />
      </section>

      {/* Auto-Insights Section (NOW REAL) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
           <Lightbulb className="w-6 h-6 text-yellow-500" />
           <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Micro-SaaS Blueprints</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trends.filter(t => t.ideas.length > 0).slice(0, 6).map((trend, i) => (
            <Card key={i} className="border-blue-100 bg-white hover:shadow-xl transition-all hover:-translate-y-1 cursor-default group border-l-4 border-l-blue-600">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                   <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none">{trend.category || 'Ideia'}</Badge>
                   <span className="text-xs font-bold text-zinc-400">Score: {trend.ideas[0].viabilityScore.toFixed(1)}</span>
                </div>
                <CardTitle className="text-xl font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">Tema: {trend.keyword}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-zinc-600 leading-relaxed italic">
                  "{trend.ideas[0].generatedPitch}"
                </p>
                <div className="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-tighter">Oportunidade Detectada</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50/30">Studio Build</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Opportunity Matrix Section */}
      <section className="space-y-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Matriz de Monitoramento</h2>
          <Badge variant="secondary" className="px-3 py-1 bg-zinc-100 text-zinc-600 border-none">Radar Ativo</Badge>
        </div>
        <Card className="border-zinc-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow>
                  <TableHead className="font-bold text-zinc-900 py-4">Tópico</TableHead>
                  <TableHead className="font-bold text-zinc-900">Categoria</TableHead>
                  <TableHead className="font-bold text-zinc-900">Impacto</TableHead>
                  <TableHead className="font-bold text-zinc-900">Heat Score</TableHead>
                  <TableHead className="font-bold text-zinc-900 text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((trend) => (
                  <TableRow key={trend.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="font-semibold text-zinc-900 py-4">{trend.keyword}</TableCell>
                    <TableCell>
                       <span className="text-xs font-medium text-zinc-500 uppercase">{trend.category || 'Geral'}</span>
                    </TableCell>
                    <TableCell className="text-zinc-600 font-medium">{(trend.currentVolume/1000).toFixed(0)}k+</TableCell>
                    <TableCell>
                      <Badge 
                        variant={trend.momentum > 0 ? "success" : trend.momentum < 0 ? "destructive" : "secondary"}
                        className={`font-mono ${trend.momentum > 0 ? 'bg-green-100 text-green-700' : ''}`}
                      >
                        {trend.momentum > 0 ? '+' : ''}{trend.momentum.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {trend.momentum > 15 ? (
                          <div className="flex items-center gap-1 text-green-600 font-bold text-xs">
                             <TrendingUp className="w-3 h-3" />
                             EXPLOSIVO
                          </div>
                        ) : (
                           <div className="flex items-center gap-1 text-zinc-400 font-medium text-xs">
                             <Minus className="w-3 h-3" />
                             ESTÁVEL
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
