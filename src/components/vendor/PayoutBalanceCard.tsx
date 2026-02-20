
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, CheckCircle, Info, Calendar, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface PayoutBalanceCardProps {
  availableBalance: number;
  pendingRevenue: number;
  requestedPayouts: number;
  totalPendingBookings: number;
  onInstantSettlement: () => void;
  settling: boolean;
}

export const PayoutBalanceCard: React.FC<PayoutBalanceCardProps> = ({
  availableBalance,
  pendingRevenue,
  requestedPayouts,
  totalPendingBookings,
  onInstantSettlement,
  settling
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Available Balance - Main Card */}
      <Card className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-normal text-gray-600">
                Available Balance
              </CardTitle>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(availableBalance)}
              </div>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              {totalPendingBookings} bookings ready for settlement
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          </div>
          
          <Button 
            onClick={onInstantSettlement}
            disabled={settling || availableBalance <= 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11"
          >
            <Zap className="h-4 w-4 mr-2" />
            {settling ? 'Processing...' : 'Instant Settlement'}
          </Button>
          
          <div className="flex items-center justify-center mt-3 text-xs text-gray-500">
            <Clock className="h-3 w-3 mr-1" />
            Funds credited within 15 minutes
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-normal text-gray-600">
                Pending Revenue
              </CardTitle>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(pendingRevenue)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Processing period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-normal text-gray-600">
                Requested Payouts
              </CardTitle>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl font-bold text-gray-900">
              {formatCurrency(requestedPayouts)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Under processing
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
