
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, TrendingUp, AlertCircle, UserCheck } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { DashboardStats } from '@/hooks/use-admin-dashboard-data';

interface Props {
  stats: DashboardStats;
  loading: boolean;
}

export function DynamicStatisticsCards({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      <Card className="shadow-none border rounded-lg border-l-4 border-l-primary">
          <div className="p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total Revenue</p>
            {loading ? <Skeleton className="h-6 w-20 mt-1" /> : (
              <>
                <p className="text-lg font-bold mt-0.5 text-primary">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-[10px] text-secondary">{formatCurrency(stats.revenueToday)} today</p>
              </>
            )}
          </div>
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
      </Card>

      <Card className="shadow-none border rounded-lg border-l-4 border-l-secondary">
          <div className="p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Active Residents</p>
            {loading ? <Skeleton className="h-6 w-14 mt-1" /> : (
              <>
                <p className="text-lg font-bold mt-0.5 text-secondary">{stats.activeResidents}</p>
                <p className="text-[10px] text-muted-foreground">{stats.occupancyPercentage}% occupancy</p>
              </>
            )}
          </div>
          <div className="h-7 w-7 rounded-full bg-secondary/10 flex items-center justify-center">
            <UserCheck className="h-3.5 w-3.5 text-secondary" />
          </div>
        </div>
      </Card>

      <Card className="shadow-none border rounded-lg border-l-4 border-l-accent">
          <div className="p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Seat Availability</p>
            {loading ? <Skeleton className="h-6 w-14 mt-1" /> : (
              <p className="text-lg font-bold mt-0.5 text-accent-foreground">{stats.availableSeats}</p>
            )}
          </div>
          <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-accent-foreground" />
          </div>
        </div>
      </Card>

      <Card className="shadow-none border rounded-lg border-l-4 border-l-destructive">
          <div className="p-2.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Pending Payments</p>
            {loading ? <Skeleton className="h-6 w-20 mt-1" /> : (
              <p className="text-lg font-bold mt-0.5 text-destructive">{formatCurrency(stats.pendingPayments)}</p>
            )}
          </div>
          <div className="h-7 w-7 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          </div>
        </div>
      </Card>
    </div>
  );
}
