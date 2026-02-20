
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface FinancialSummary {
  totalRevenue: number;
  revenueToday?: number;
  pendingPayments: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  occupancyRate?: number;
}

interface StatisticsCardsProps {
  data: FinancialSummary;
}

interface AnalyticsData {
  date: string;
  revenue: number;
  status: string;
}

export function StatisticsCards({ data }: StatisticsCardsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">₹{data.totalRevenue.toLocaleString()}</p>
          {data.revenueToday !== undefined && (
            <p className="text-sm text-green-600 mt-1">₹{data.revenueToday.toLocaleString()} today</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Active Residents</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{data.activeSubscriptions}</p>
          {data.occupancyRate !== undefined && (
            <p className="text-sm text-muted-foreground mt-1">{data.occupancyRate}% occupancy</p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">New This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{data.newSubscriptionsThisMonth}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">₹{data.pendingPayments.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
