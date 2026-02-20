
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { transactionService } from '@/api/transactionService';
import { bookingsService } from '@/api/bookingsService';
import { format, addMonths, differenceInDays } from 'date-fns';
import { CreditCard, Calendar, RefreshCw, IndianRupee, Clock, TicketPercent } from 'lucide-react';

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
  const { toast } = useToast();

  useEffect(() => {
    fetchBookingTransactions();
  }, []);

  const fetchBookingTransactions = async () => {
    try {
      setLoading(true);
            
        // Calculate validity information
        const endDate = new Date(booking.endDate);
        const today = new Date();
        const daysRemaining = differenceInDays(endDate, today);
        
        setValidityInfo({
          currentEndDate: booking.endDate,
          daysRemaining: Math.max(0, daysRemaining),
          totalMonths: booking.months || booking.durationCount || 1
        });
      
      // Fetch user transactions and filter for this booking
      const transactionsResponse = await transactionService.getUserTransactions();
      if (transactionsResponse.success && transactionsResponse.data) {
        const bookingTransactions = transactionsResponse.data.data.filter(
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
      <Card>
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      {booking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Booking ID</h3>
                <p className="font-medium">#{booking.bookingId || booking._id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  {bookingType === 'cabin' ? 'Cabin & Seat' : 'Hostel & Bed'}
                </h3>
                <p className="font-medium">
                  {booking.cabinId?.name || booking.hostelId?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {bookingType === 'cabin' ? 
                    `Seat #${booking.seatId?.number}` : 
                    `Bed #${booking.bedId?.number}`
                  }
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Seat Price</h3>
                <p className="font-medium text-green-600">₹{booking.seatPrice.toLocaleString()}</p>
              </div>
               <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Paid</h3>
                {/* <p className="font-medium text-green-600">₹{totalPaid.toLocaleString()}</p> */}
                                   {booking.originalPrice && booking.appliedCoupon ? (
                      <div>
                        <p className="text-sm text-muted-foreground line-through">₹{booking.originalPrice.toLocaleString()}</p>
                        <p className="font-medium text-green-600">₹{totalPaid.toLocaleString()}</p>
                        <p className="text-xs text-green-600">You saved ₹{booking.appliedCoupon.discountAmount}</p>
                      </div>
                    ) : (
                      <p className="font-medium">₹{totalPaid.toLocaleString()}</p>
                    )}
                    {booking.appliedCoupon && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TicketPercent className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Coupon Applied</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Code: </span>
                        <span className="font-medium text-green-600">{booking.appliedCoupon.couponCode}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Discount: </span>
                        <span className="font-medium text-green-600">₹{booking.appliedCoupon.discountAmount}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Payment Status</h3>
                {getStatusBadge(booking.paymentStatus)}
              </div>

               {booking?.transferredHistory?.map((data, index) => (
                <div key={index}>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Transferred From
                  </h3>
                  <p className="font-medium">
                    {data.cabinId?.name || data.hostelId?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                      Canin Code : {data.cabinId?.cabinCode}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bookingType === 'cabin'
                      ? `Seat #${data.seatId?.number}`
                      : `Bed #${data.bedId?.number}`}
                  </p>
                   <p className="text-sm text-muted-foreground">
                      Transferred By : {data.transferredBy?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Transferred At : {format(new Date(data.transferredAt), 'dd MMM yyyy')}
                    </p>
                </div>
              ))} 
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validity Information */}
      {validityInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Validity Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Current End Date</h3>
                <p className="font-medium">
                  {format(new Date(validityInfo.currentEndDate), 'dd MMM yyyy h:mm:ss a')}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Days Remaining</h3>
                <p className={`font-medium ${
                  validityInfo.daysRemaining > 30 ? 'text-green-600' :
                  validityInfo.daysRemaining > 7 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {validityInfo.daysRemaining} days
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Duration</h3>
                <p className="font-medium">
                  {validityInfo.totalMonths} {validityInfo.totalMonths === 1 ? 'month' : 'months'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchBookingTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p>Transaction history for this booking will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Period Extension</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.transactionId}
                      </TableCell>
                      <TableCell>
                        {getTransactionTypeBadge(transaction.transactionType)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1" />
                          <span className="font-medium">
                            {transaction.amount.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.transactionType === 'renewal' && transaction.additionalMonths ? (
                          <div className="text-sm">
                            <div>+{transaction.additionalMonths} months</div>
                            {transaction.previousEndDate && transaction.newEndDate && (
                              <div className="text-muted-foreground">
                                {format(new Date(transaction.previousEndDate), 'dd MMM')} → {format(new Date(transaction.newEndDate), 'dd MMM yyyy')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(transaction.createdAt), 'dd MMM yyyy')}
                          <div className="text-muted-foreground">
                            {format(new Date(transaction.createdAt), 'HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {transaction.paymentMethod || 'Online'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Payment Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {transactions
              .filter(t => t.status === 'completed')
              .map((transaction, index) => (
                <div key={transaction.id} className="flex justify-between items-center">
                  <span className="text-sm">
                    {transaction.transactionType === 'booking' ? 'Initial Payment' : 
                     transaction.transactionType === 'renewal' ? `Renewal ${index}` : 
                     transaction.transactionType}
                  </span>
                  <span className="font-medium">₹{transaction.amount.toLocaleString()}</span>
                </div>
              ))}
            <Separator />
            <div className="flex justify-between items-center font-medium text-lg">
              <span>Total Paid</span>
              <span className="text-green-600">₹{totalPaid.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
