
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity, Database } from 'lucide-react';

interface UsageData {
  name: string;
  hours: number;
  visits: number;
}

interface UsageStatsProps {
  usageStats: {
    weeklyUsage: UsageData[];
    totalHoursSpent: number;
    totalVisits: number;
    averageStayDuration: number;
  };
}

export const UsageStatistics: React.FC<UsageStatsProps> = ({ usageStats }) => {
  const config = {
    hours: {
      label: 'Hours',
      color: '#6E59A5',
    },
    visits: {
      label: 'Visits',
      color: '#9b87f5',
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold">Usage Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Total Hours Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{usageStats.totalHoursSpent}</p>
            <p className="text-sm text-muted-foreground">Total hours at the facilities</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Total Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{usageStats.totalVisits}</p>
            <p className="text-sm text-muted-foreground">Number of check-ins</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Average Stay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{usageStats.averageStayDuration.toFixed(1)}</p>
            <p className="text-sm text-muted-foreground">Average hours per visit</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekly Usage Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[450px] w-full">
            <ChartContainer config={config}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageStats.weeklyUsage}>
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#6E59A5" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9b87f5" />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="hours" name="Hours" fill="#6E59A5" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="visits" name="Visits" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
