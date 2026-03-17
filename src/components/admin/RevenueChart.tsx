
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as BarChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCurrency } from '@/utils/currency';
import { RevenueDataPoint } from '@/hooks/use-admin-dashboard-data';

interface Props {
  data: RevenueDataPoint[];
  loading: boolean;
}

export function RevenueChart({ data, loading }: Props) {
  const config = {
    revenue: {
      label: 'Revenue',
      color: 'hsl(207, 52%, 33%)',
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4 bg-primary/5">
        <CardTitle className="text-sm font-semibold text-primary">Monthly Revenue</CardTitle>
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
            <EmptyState icon={BarChartIcon} title="No revenue data available" />
          ) : (
            <ChartContainer config={config}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₹${Math.round(value / 1000)}K`} />
                  <Tooltip content={<ChartTooltipContent />} formatter={(value) => [formatCurrency(Number(value) || 0), 'Revenue']} />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(207, 52%, 33%)" 
                    name="Monthly Revenue"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
