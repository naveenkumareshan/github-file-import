
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card className="shadow-none border rounded-lg">
        <div className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
            <p className="text-xl font-bold mt-0.5">₹{data.totalRevenue.toLocaleString()}</p>
            {data.revenueToday !== undefined && (
              <p className="text-[10px] text-emerald-600">₹{data.revenueToday.toLocaleString()} today</p>
            )}
          </div>
          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
        </div>
      </Card>

      <Card className="shadow-none border rounded-lg">
        <div className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Active Residents</p>
            <p className="text-xl font-bold mt-0.5">{data.activeSubscriptions}</p>
            {data.occupancyRate !== undefined && (
              <p className="text-[10px] text-muted-foreground">{data.occupancyRate}% occupancy</p>
            )}
          </div>
          <Users className="h-3.5 w-3.5 text-blue-600" />
        </div>
      </Card>

      <Card className="shadow-none border rounded-lg">
        <div className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">New This Month</p>
            <p className="text-xl font-bold mt-0.5">{data.newSubscriptionsThisMonth}</p>
          </div>
          <UserPlus className="h-3.5 w-3.5 text-violet-600" />
        </div>
      </Card>

      <Card className="shadow-none border rounded-lg">
        <div className="p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending Payments</p>
            <p className="text-xl font-bold mt-0.5">₹{data.pendingPayments.toLocaleString()}</p>
          </div>
          <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
        </div>
      </Card>
    </div>
  );
}
