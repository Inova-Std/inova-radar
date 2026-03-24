"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface HeroGraphProps {
  data: any[];
  trends: string[];
}

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#7c3aed'];

export function HeroGraph({ data, trends }: HeroGraphProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>O Pulso da Internet</CardTitle>
        <CardDescription>Volume de buscas das principais tendências (últimas 24h)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value > 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Legend />
              {trends.map((trend, index) => (
                <Line
                  key={trend}
                  type="monotone"
                  dataKey={trend}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
