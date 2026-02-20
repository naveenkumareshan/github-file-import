
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, UserPlus, AlertCircle } from 'lucide-react';

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

export function StatisticsCards({ data }: StatisticsCardsProps) {
  return (
    <div className="grid md:grid-cols-4 gap-4 mb-6">
      <Card className="shadow-sm border-border/60 rounded-xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</CardTitle>
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">₹{data.totalRevenue.toLocaleString()}</p>
          {data.revenueToday !== undefined && (
            <p className="text-xs text-emerald-600 mt-1">₹{data.revenueToday.toLocaleString()} today</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-border/60 rounded-xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Residents</CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{data.activeSubscriptions}</p>
          {data.occupancyRate !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">{data.occupancyRate}% occupancy</p>
          )}
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-border/60 rounded-xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New This Month</CardTitle>
          <UserPlus className="h-4 w-4 text-violet-600" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{data.newSubscriptionsThisMonth}</p>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm border-border/60 rounded-xl">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Payments</CardTitle>
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">₹{data.pendingPayments.toLocaleString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}
