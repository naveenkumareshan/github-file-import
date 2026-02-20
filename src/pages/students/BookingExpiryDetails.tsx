
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface BookingExpiryDetailsProps {
  startDate: string;
  endDate: string;
  status: string;
  paymentStatus: string;
}

export const BookingExpiryDetails = ({ startDate, endDate, status, paymentStatus }: BookingExpiryDetailsProps) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  const daysUntilExpiry = differenceInDays(end, today);
  const isExpired = isPast(end);
  const isActive = !isPast(end) && !isFuture(start);
  const isUpcoming = isFuture(start);
  
  const getExpiryStatus = () => {
    if (isExpired) {
      return {
        label: 'Expired',
        variant: 'destructive' as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'text-red-600'
      };
    }
    
    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return {
        label: 'Expiring Soon',
        variant: 'outline' as const,
        icon: <Clock className="h-4 w-4" />,
        color: 'text-amber-600'
      };
    }
    
    if (isActive) {
      return {
        label: 'Active',
        variant: 'outline' as const,
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'text-green-600'
      };
    }
    
    return {
      label: 'Upcoming',
      variant: 'outline' as const,
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-blue-600'
    };
  };
  
  const expiryStatus = getExpiryStatus();
  
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-2 w-5" />
          Booking Validity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Start Date</p>
            <p className="font-medium">{format(start, 'PPP')}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">End Date</p>
            <p className="font-medium">{format(end, 'PPP')}</p>
          </div>
        </div> */}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={expiryStatus.variant} className="flex items-center gap-1">
              {expiryStatus.icon}
              {expiryStatus.label}
            </Badge>
          </div>
          
          <div className={`text-sm font-medium ${expiryStatus.color}`}>
            {isExpired ? 
              `Expired ${Math.abs(daysUntilExpiry)} day${Math.abs(daysUntilExpiry) !== 1 ? 's' : ''} ago` :
              daysUntilExpiry === 0 ? 
                'Expires today' :
                daysUntilExpiry > 0 ? 
                  `${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} remaining` :
                  'Not started yet'
            }
          </div>
        </div>
        
        {(isExpired || daysUntilExpiry <= 7) && paymentStatus === 'completed' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">
                  {isExpired ? 'Booking Expired' : 'Expiring Soon'}
                </p>
                <p className="text-amber-700">
                  {isExpired ? 
                    'Your booking has expired. Contact admin to renew or extend.' :
                    'Your booking will expire soon. Consider extending to avoid interruption.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isActive && paymentStatus === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-2 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Active Booking</p>
                <p className="text-green-700">Your booking is currently active and valid.</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
