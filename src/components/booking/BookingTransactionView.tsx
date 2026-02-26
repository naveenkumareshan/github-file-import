
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { transactionService } from '@/api/transactionService';
import { vendorSeatsService } from '@/api/vendorSeatsService';
import { DuePaymentHistory } from '@/components/booking/DuePaymentHistory';
import { format, differenceInDays } from 'date-fns';
import { CreditCard, Calendar, RefreshCw, IndianRupee, Clock, TicketPercent, Wallet } from 'lucide-react';

interface Transaction {
  id: string;
  transactionId: string;
  transactionType: 'booking' | 'renewal' | 'cancellation' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  additionalMonths?: number;
  newEndDate?: string;
  previousEndDate?: string;
  createdAt: string;
  razorpay_payment_id?: string;
}

interface BookingTransactionViewProps {
  bookingId: string;
  booking:any;
  bookingType: 'cabin' | 'hostel';
}

export const BookingTransactionView = ({ bookingId, bookingType, booking }: BookingTransactionViewProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);
  const [validityInfo, setValidityInfo] = useState<{
    currentEndDate: string;
    daysRemaining: number;
    totalMonths: number;
  } | null>(null);
  const [dueData, setDueData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookingTransactions();
  }, []);

  const fetchBookingTransactions = async () => {
    try {
      setLoading(true);
            
        // Calculate validity information
        if (booking?.endDate) {
          try {
            const endDate = new Date(booking.endDate);
            const today = new Date();
            const daysRemaining = differenceInDays(endDate, today);
            
            setValidityInfo({
              currentEndDate: booking.endDate,
              daysRemaining: Math.max(0, daysRemaining),
              totalMonths: booking.months || booking.durationCount || 1
            });
          } catch (e) {
            console.error('Error parsing endDate:', e);
          }
        }
      
      // Fetch user transactions and filter for this booking
      const transactionsResponse = await transactionService.getUserTransactions();
      if (transactionsResponse.success && transactionsResponse.data) {
        const txList = Array.isArray(transactionsResponse.data) ? transactionsResponse.data : (transactionsResponse.data?.data || []);
        const bookingTransactions = txList.filter(
          (transaction: any) => transaction.bookingId === bookingId
        );
        
        setTransactions(bookingTransactions);
        
        // Calculate total paid amount
        const completedTransactions = bookingTransactions.filter(
          (transaction: any) => transaction.status === 'completed'
        );
        const total = completedTransactions.reduce(
          (sum: number, transaction: any) => sum + transaction.amount, 0
        );
        setTotalPaid(total);
      }

      // Fetch due for this booking
      const dueRes = await vendorSeatsService.getDueForBooking(bookingId);
      if (dueRes.success && dueRes.data) {
        setDueData(dueRes.data);
      }
    } catch (error) {
      console.error('Error fetching booking transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="border-gray-500 text-gray-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'booking':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Initial Payment</Badge>;
      case 'renewal':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Renewal</Badge>;
      case 'cancellation':
        return <Badge variant="outline" className="border-red-500 text-red-500">Cancellation</Badge>;
      case 'refund':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Booking Summary */}
      {booking && (
        <div className="bg-card rounded-lg border p-3">
          <h3 className="text-[13px] font-semibold flex items-center gap-1.5 mb-2">
            <Calendar className="h-3.5 w-3.5" />
            Booking Summary
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Booking ID</span>
              <span className="text-[12px] font-medium">#{booking.bookingId || booking._id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">
                {bookingType === 'cabin' ? 'Cabin & Seat' : 'Hostel & Bed'}
              </span>
              <span className="text-[12px] font-medium text-right">
                {booking.cabinId?.name || booking.cabinName || booking.hostelId?.name || 'N/A'}
                {' · '}
                {bookingType === 'cabin'
                  ? `Seat #${booking.seatId?.number || booking.seatNumber || 'N/A'}`
                  : `Bed #${booking.bedId?.number || 'N/A'}`}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Seat Price</span>
              <span className="text-[12px] font-medium">₹{(booking.seatPrice || booking.totalPrice || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Total Paid</span>
              <div className="text-right">
                {booking?.originalPrice && booking?.appliedCoupon ? (
                  <>
                    <span className="text-[11px] text-muted-foreground line-through mr-1">₹{booking.originalPrice.toLocaleString()}</span>
                    <span className="text-[12px] font-medium">₹{totalPaid.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="text-[12px] font-medium">₹{totalPaid.toLocaleString()}</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted-foreground">Payment Status</span>
              {getStatusBadge(booking.paymentStatus)}
            </div>
          </div>

          {booking?.appliedCoupon && (
            <div className="mt-2 p-2 bg-accent/50 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <TicketPercent className="h-3 w-3 text-primary" />
                  <span className="text-[11px] font-medium">{booking.appliedCoupon.couponCode}</span>
                </div>
                <span className="text-[11px] font-medium text-primary">-₹{booking.appliedCoupon.discountAmount}</span>
              </div>
            </div>
          )}

          {booking?.transferredHistory?.map((data: any, index: number) => (
            <div key={index} className="mt-2 p-2 bg-muted/50 border rounded-lg space-y-0.5">
              <p className="text-[11px] font-medium">Transferred From: {data.cabinId?.name || data.hostelId?.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {bookingType === 'cabin' ? `Seat #${data.seatId?.number}` : `Bed #${data.bedId?.number}`}
                {' · '}{data.transferredBy?.name}
                {' · '}{format(new Date(data.transferredAt), 'dd MMM yyyy')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Validity Information */}
      {validityInfo && (
        <div className="bg-card rounded-lg border p-3">
          <h3 className="text-[13px] font-semibold flex items-center gap-1.5 mb-2">
            <Clock className="h-3.5 w-3.5" />
            Validity
          </h3>
          <div className="flex justify-between text-[12px]">
            <div>
              <p className="text-[11px] text-muted-foreground">End Date</p>
              <p className="font-medium">{format(new Date(validityInfo.currentEndDate), 'dd MMM yyyy')}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-muted-foreground">Days Left</p>
              <p className={`font-medium ${
                validityInfo.daysRemaining > 30 ? 'text-green-600' :
                validityInfo.daysRemaining > 7 ? 'text-amber-600' : 'text-destructive'
              }`}>
                {validityInfo.daysRemaining}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">Duration</p>
              <p className="font-medium">{validityInfo.totalMonths} {validityInfo.totalMonths === 1 ? 'mo' : 'mos'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-card rounded-lg border p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[13px] font-semibold flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5" />
            Transactions
          </h3>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={fetchBookingTransactions}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-[12px]">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{transaction.transactionId}</span>
                  {getStatusBadge(transaction.status)}
                </div>
                <div className="flex items-center justify-between">
                  {getTransactionTypeBadge(transaction.transactionType)}
                  <span className="text-[12px] font-medium">₹{transaction.amount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm')}</span>
                  <span>{transaction.paymentMethod || 'Online'}</span>
                </div>
                {transaction.transactionType === 'renewal' && transaction.additionalMonths && (
                  <p className="text-[10px] text-muted-foreground">
                    +{transaction.additionalMonths} months
                    {transaction.previousEndDate && transaction.newEndDate && (
                      <> · {format(new Date(transaction.previousEndDate), 'dd MMM')} → {format(new Date(transaction.newEndDate), 'dd MMM yyyy')}</>
                    )}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Summary */}
      <div className="bg-card rounded-lg border p-3">
        <h3 className="text-[13px] font-semibold flex items-center gap-1.5 mb-2">
          <IndianRupee className="h-3.5 w-3.5" />
          Payment Summary
        </h3>
        <div className="space-y-1">
          {transactions
            .filter(t => t.status === 'completed')
            .map((transaction, index) => (
              <div key={transaction.id} className="flex justify-between items-center text-[12px]">
                <span className="text-muted-foreground">
                  {transaction.transactionType === 'booking' ? 'Initial Payment' :
                   transaction.transactionType === 'renewal' ? `Renewal ${index}` :
                   transaction.transactionType}
                </span>
                <span className="font-medium">₹{transaction.amount.toLocaleString()}</span>
              </div>
            ))}
          <Separator className="my-1" />
          <div className="flex justify-between items-center text-[13px] font-semibold">
            <span>Total Paid</span>
            <span>₹{totalPaid.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Due Payments Section */}
      {dueData && (
        <div className="bg-card rounded-lg border p-3">
          <DuePaymentHistory
            dueId={dueData.id}
            dueInfo={{
              totalFee: Number(dueData.total_fee),
              advancePaid: Number(dueData.advance_paid),
              paidAmount: Number(dueData.paid_amount),
              dueAmount: Number(dueData.due_amount),
              status: dueData.status,
            }}
            defaultOpen
          />
        </div>
      )}
    </div>
  );
};
