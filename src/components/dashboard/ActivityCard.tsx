
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

interface Payment {
  id: number;
  date: string;
  amount: number;
  method: string;
  status: string;
}

interface ActivityCardProps {
  payments: Payment[];
  formatDate: (date: string) => string;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ payments, formatDate }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Activity</CardTitle>
        <CardDescription>Recent payments and transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground">No payment history</p>
        ) : (
          <div className="space-y-4">
            {payments.map(payment => (
              <div key={payment.id} className="flex justify-between border-b border-border pb-3">
                <div>
                  <p className="font-medium">Payment #{payment.id}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(payment.date)}</p>
                  <p className="text-sm text-muted-foreground">{payment.method}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">₹{payment.amount}</p>
                  <p className={`text-xs ${
                    payment.status === 'completed' ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {payments.length > 0 && (
        <CardFooter>
          <button className="text-cabin-wood hover:text-cabin-dark text-sm font-medium">
            View all activity →
          </button>
        </CardFooter>
      )}
    </Card>
  );
};
