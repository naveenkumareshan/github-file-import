
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { adminBookingsService } from '@/api/adminBookingsService';

export function OccupancyChart() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlyOccupancy = async () => {
      try {
        setLoading(true);
        const response = await adminBookingsService.getMonthlyOccupancy();
        
        if (response.success && response.data) {
          // Transform the data for the chart
          const chartData = response.data.map((month: any) => ({
            name: month.monthName.slice(0, 3), // Convert to short form (Jan, Feb, etc.)
            occupancy: month.occupancyRate
          }));
          setData(chartData);
        }
      } catch (error) {
        console.error('Error fetching monthly occupancy:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyOccupancy();
  }, []);
  const config = {
    occupancy: {
      label: 'Occupancy',
      color: '#6E59A5',
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Occupancy Rate</CardTitle>
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
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke="#6E59A5" 
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
