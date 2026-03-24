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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Radio } from "lucide-react";
import { format } from 'date-fns';

async function getTrends() {
  const trends = await prisma.trend.findMany({
    orderBy: { currentVolume: 'desc' },
    take: 20,
    include: {
      dataPoints: {
        orderBy: { timestamp: 'asc' },
        take: 12,
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
        <form action="/api/cron/fetch-trends" method="GET">
           <Button size="lg" className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
             <RefreshCw className="w-4 h-4 mr-2" />
             Sincronizar Agora
           </Button>
        </form>
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
            <Radio className="w-4 h-4" />
            Live Insights
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">Inova Radar 📡</h1>
          <p className="text-zinc-500 text-lg">Radar de tendências em tempo real via Google & TikTok.</p>
        </div>
        
        <form action="/api/cron/fetch-trends" method="GET">
           <Button variant="outline" size="sm" className="text-zinc-500 hover:text-blue-600">
             <RefreshCw className="w-3 h-3 mr-2" />
             Atualizar Radar
           </Button>
        </form>
      </header>

      {/* Hero Graph Section */}
      <section>
        <HeroGraph data={chartData} trends={trendKeywords} />
      </section>

      {/* Opportunity Matrix Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Matriz de Oportunidades</h2>
          <Badge variant="secondary" className="px-3 py-1 bg-zinc-100 text-zinc-600 border-none">Top 20 Trends</Badge>
        </div>
        <Card className="border-zinc-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow>
                  <TableHead className="font-bold text-zinc-900 py-4">Tópico</TableHead>
                  <TableHead className="font-bold text-zinc-900">Heat Score</TableHead>
                  <TableHead className="font-bold text-zinc-900">Volume</TableHead>
                  <TableHead className="font-bold text-zinc-900">Momento</TableHead>
                  <TableHead className="font-bold text-zinc-900 text-right pr-6">Fonte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((trend) => (
                  <TableRow key={trend.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="font-semibold text-zinc-900 py-4">{trend.keyword}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={trend.momentum > 0 ? "success" : trend.momentum < 0 ? "destructive" : "secondary"}
                        className={`font-mono ${trend.momentum > 0 ? 'bg-green-100 text-green-700' : ''}`}
                      >
                        {trend.momentum > 0 ? '+' : ''}{trend.momentum.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-600 font-medium">{(trend.currentVolume/1000).toFixed(0)}k+</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {trend.momentum > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : trend.momentum < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-zinc-400" />
                        )}
                        <span className={`text-sm font-medium ${trend.momentum > 0 ? "text-green-700" : trend.momentum < 0 ? "text-red-700" : "text-zinc-500"}`}>
                          {Math.abs(trend.momentum) > 50 ? 'Explosivo' : Math.abs(trend.momentum) > 10 ? 'Estável' : 'Neutro'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge variant="outline" className="capitalize text-zinc-400 font-normal">
                        {trend.source}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Auto-Insights Placeholder Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topTrends.slice(0, 3).map((trend, i) => (
          <Card key={i} className="border-blue-100 bg-white hover:shadow-xl transition-all hover:-translate-y-1 cursor-default group">
            <CardHeader className="pb-3">
              <Badge variant="secondary" className="w-fit mb-2 bg-blue-50 text-blue-600 border-none group-hover:bg-blue-600 group-hover:text-white transition-colors">Auto-Insight #{i+1}</Badge>
              <CardTitle className="text-xl font-bold text-zinc-900 group-hover:text-blue-600 transition-colors">Micro-SaaS: {trend.keyword}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-500 leading-relaxed">
                Este hype é ideal para um gerador de conteúdo ou ferramenta analítica customizada para <strong>{trend.keyword}</strong>.
              </p>
              <div className="mt-6 pt-4 border-t border-zinc-50 flex items-center justify-between">
                <span className="text-sm font-bold text-blue-600">Viabilidade: 8.{5+i}/10</span>
                <Badge variant="outline" className="text-zinc-400">Tech</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
