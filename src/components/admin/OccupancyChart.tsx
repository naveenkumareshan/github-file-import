
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { TrendingUp } from 'lucide-react';
import { OccupancyDataPoint } from '@/hooks/use-admin-dashboard-data';

interface Props {
  data: OccupancyDataPoint[];
  loading: boolean;
}

export function OccupancyChart({ data, loading }: Props) {
  const config = {
    occupancy: {
      label: 'Occupancy',
      color: 'hsl(105, 35%, 55%)',
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4 bg-secondary/5">
        <CardTitle className="text-sm font-semibold text-secondary">Occupancy Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-[240px] w-full" />
            </div>
          ) : data.length === 0 ? (
            <EmptyState icon={TrendingUp} title="No occupancy data available" />
          ) : (
            <ChartContainer config={config}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke="hsl(105, 35%, 55%)" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6 }}
                    name="Occupancy Rate (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
