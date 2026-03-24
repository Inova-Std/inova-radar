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
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { format } from 'date-fns';

async function getTrends() {
  const trends = await prisma.trend.findMany({
    orderBy: { currentVolume: 'desc' },
    take: 20,
    include: {
      dataPoints: {
        orderBy: { timestamp: 'asc' },
        take: 12, // Last 12 points (e.g., last 6 hours if polled every 30m)
      }
    }
  });
  return trends;
}

export default async function RadarPage() {
  const trends = await getTrends();

  // Format data for the chart (HeroGraph)
  // We need to pivot data points into a format Recharts likes: [{ timestamp: '...', trend1: val, trend2: val }, ...]
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
    <div className="container mx-auto p-4 space-y-8 bg-zinc-50 min-h-screen">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">Inova Radar 📡</h1>
        <p className="text-zinc-500 text-lg">Radar de Tendências autônomo. O que o mundo está buscando agora.</p>
      </header>

      {/* Hero Graph Section */}
      <section>
        <HeroGraph data={chartData} trends={trendKeywords} />
      </section>

      {/* Opportunity Matrix Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900">Matriz de Oportunidades</h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trend</TableHead>
                  <TableHead>Heat Score</TableHead>
                  <TableHead>Volume Atual</TableHead>
                  <TableHead>Momentum</TableHead>
                  <TableHead>Fonte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((trend) => (
                  <TableRow key={trend.id}>
                    <TableCell className="font-medium">{trend.keyword}</TableCell>
                    <TableCell>
                      <Badge variant={trend.momentum > 0 ? "success" : trend.momentum < 0 ? "destructive" : "secondary"}>
                        {trend.momentum > 0 ? '+' : ''}{trend.momentum.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>{trend.currentVolume.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {trend.momentum > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : trend.momentum < 0 ? (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        ) : (
                          <Minus className="w-4 h-4 text-zinc-400" />
                        )}
                        <span className={trend.momentum > 0 ? "text-green-600" : trend.momentum < 0 ? "text-red-600" : "text-zinc-500"}>
                          {Math.abs(trend.momentum) > 50 ? 'Explosivo' : Math.abs(trend.momentum) > 10 ? 'Estável' : 'Neutro'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
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
          <Card key={i} className="border-blue-100 bg-white hover:shadow-md transition-shadow">
            <CardHeader>
              <Badge variant="secondary" className="w-fit mb-2">Auto-Insight #{i+1}</Badge>
              <CardTitle className="text-xl">Oportunidade: {trend.keyword}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-600">
                O hype sobre <strong>{trend.keyword}</strong> está subindo. Uma oportunidade de Micro-SaaS seria criar um gerador de conteúdo ou ferramenta de análise específica para este nicho.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-blue-600">Viabilidade: 8.5/10</span>
                <Badge variant="outline">Tech</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
