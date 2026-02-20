
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { adminBookingsService } from '@/api/adminBookingsService';

export function RevenueChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

 const fetched = useRef(false);

useEffect(() => {
  if (fetched.current) return;

  const fetchMonthlyRevenue = async () => {
    try {
      setLoading(true);
      const response = await adminBookingsService.getMonthlyRevenue();
      if (response.success && response.data) {
        const chartData = response.data.map((month: any) => ({
          name: month.monthName.slice(0, 3),
          revenue: month.revenue
        }));
        setData(chartData);
      }
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchMonthlyRevenue();
  fetched.current = true;
}, []);

  const config = {
    revenue: {
      label: 'Revenue',
      color: '#7E69AB',
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-[240px] w-full" />
            </div>
          ) : (
            <ChartContainer config={config}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₹${value / 1000}K`} />
                  <Tooltip content={<ChartTooltipContent />} formatter={(value) => [`₹${value}`, 'Revenue']} />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    fill="#7E69AB" 
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