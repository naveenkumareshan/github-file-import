
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format  } from 'date-fns';
import { adminUsersService } from '@/api/adminUsersService';
import { hostelService } from '@/api/hostelService';
import { BookingExtensionDialog } from '@/components/admin/BookingExtensionDialog';
import { ChevronLeft, Clock, CreditCard, IndianRupee, RefreshCw, TicketPercent } from 'lucide-react';
import { transactionService } from '@/api/transactionService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { BookingUpdateDatesDialog } from '@/components/admin/BookingUpdateDatesDialog';

interface Transaction {
  id: string;
  _id: string;
  transactionId: string;
  transactionType: 'booking' | 'renewal' | 'cancellation' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  paymentResponse?: {
    razorpay_order_id: string,
    razorpay_payment_id: string,
    razorpay_signature: string
  };
  additionalMonths?: number;
  newEndDate?: string;
  previousEndDate?: string;
  createdAt: string;
  payoutStatus:string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
}

const AdminBookingDetail = () => {
  const { bookingId, type } = useParams<{ bookingId: string, type: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [showUpdateBookingDatesDialog, setShowUpdateBookingDatesDialog] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const bookingType = type === 'hostel' ? 'hostel' : 'cabin';
  
  useEffect(() => {
    if (bookingId && type) {
      fetchBookingDetails();
    }
  }, [bookingId, type]);
  
  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      let response;
      
      if (bookingType === 'hostel') {
        response = await hostelService.getBookingById(bookingId);
      } else {
        response = await adminUsersService.getBookingById(bookingId);
      }
      
      if (response.success) {
        setBooking(response.data);
          const transactionsResponse = await transactionService.getBookingTransactions(response.data._id);
          if (transactionsResponse.success && transactionsResponse.data) {
            const bookingTransactions = transactionsResponse.data.data;
            
            setTransactions(bookingTransactions);
            
            // Calculate total paid amount
            const completedTransactions = bookingTransactions.filter(
              (transaction: {status:string}) => transaction.status === 'completed'
            );
            const total = completedTransactions.reduce(
              (sum: number, transaction: { amount:number}) => sum + transaction.amount, 0
            );
            setTotalPaid(total);
          }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch booking details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast({
        title: "Error",
        description: "Failed to fetch booking details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  

  const handleExtendBooking = () => {
    setShowExtensionDialog(true);
  };

   const handleUpdateBookingDates = () => {
    setShowUpdateBookingDatesDialog(true);
  };
  
  const handleExtensionComplete = () => {
    fetchBookingDetails();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
      case 'cancelled':
      case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500">Cancelled</Badge>;
      case 'expired':
        return <Badge variant="outline">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'booking':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Initial Payment</Badge>;
      case 'renewal':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Extension</Badge>;
      case 'cancellation':
        return <Badge variant="outline" className="border-red-500 text-red-500">Cancellation</Badge>;
      case 'refund':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  
    const getBookingStatusBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'transferred':
        return <Badge variant="outline" className="border-purple-500 text-purple-500">Transferred</Badge>;
      case 'expired':
        return <Badge variant="outline" className="border-red-500 text-red-500">Expired</Badge>;
      case 'refund':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Refund</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  const getSettlementBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "included":
        return <Badge className="bg-green-500">Done</Badge>;
      default:
        return (
          <Badge variant="outline" className="border-amber-500 text-amber-500">
            Pending
          </Badge>
        );
    }
  };
  
  if (loading) {
    return (
        <div className="container mx-auto py-6">
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </div>
    );
  }
  
  if (!booking) {
    return (
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-xl font-medium mb-2">Booking not found</h3>
              <p className="text-muted-foreground mb-4">
                The booking you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate(-1)}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
    );
  }
  
  return (
    <>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Button variant="outline" size="icon" className="mr-4" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Booking Details</h1>
              <p className="text-muted-foreground">
                {bookingType === 'hostel' ? 'Hostel' : 'Reading Room'} Booking #{booking.bookingId || booking._id.substring(0, 10)}
              </p>
            </div>
          </div>
          
          {user.role=='admin' && booking.status =='completed' && 
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleUpdateBookingDates}>
              <Clock className="h-4 w-4 mr-2" />
              Update Start and End Date
            </Button>
          </div>
          }
          { booking.status =='completed' && 
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExtendBooking}>
                <Clock className="h-4 w-4 mr-2" />
                Extend Booking
              </Button>
            </div>
            }
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Booking Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booking ID</p>
                    <p>{booking.bookingId || booking._id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <div>{getStatusBadge(booking.status || 'pending')}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booking Status</p>
                    <div>{getBookingStatusBadge(booking.bookingStatus)}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Check-in Date</p>
                    <p>{format(new Date(booking.startDate), 'dd MMM yyyy h:mm:ss a')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Check-out Date</p>
                    <p>{format(new Date(booking.endDate), 'dd MMM yyyy h:mm:ss a')}</p>
                  </div>
                </div>
                
                {bookingType === 'hostel' && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Hostel</p>
                        <p>{booking.hostelId?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Room & Bed</p>
                        <p>
                          Room {booking.roomId?.roomNumber || '-'}, 
                          Bed #{booking.bedId?.number || '-'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sharing Type</p>
                      <p>{booking.sharingType || '-'}</p>
                    </div>
                  </>
                )}
                
                {bookingType === 'cabin' && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Reading Room</p>
                        <p>{booking.cabinId?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Seat</p>
                        <p>Seat #{booking.seatId?.number || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Seat Price</p>
                        <p>₹{booking.seatPrice?.toLocaleString() || "0"}</p>
                      </div>
                      {booking.keyDeposit && 
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Key Deposite</p>
                          <p>₹{booking.keyDeposit?.toLocaleString() || "0"}</p>
                        </div>
                      }
                    </div>
                  </>
                )}
                <Separator />
                
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
                <Separator />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duration</p>
                    <p>
                      {bookingType === 'hostel' 
                        ? `${booking.months || 1} month${booking.months !== 1 ? 's' : ''}` 
                        : `${booking.durationCount || 1} month${booking.durationCount !== 1 ? 's' : ''}`
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Price</p>
                    {/* <p className="font-semibold">₹{booking.totalPrice?.toLocaleString() || '-'}</p> */}
                    {booking.originalPrice && booking.appliedCoupon ? (
                      <div>
                        <p className="text-sm text-muted-foreground line-through">₹{booking.originalPrice.toLocaleString()}</p>
                        <p className="font-medium text-green-600">₹{booking.totalPrice.toLocaleString()}</p>
                        <p className="text-xs text-green-600">You saved ₹{booking.appliedCoupon.discountAmount}</p>
                      </div>
                    ) : (
                      <p className="font-medium">₹{booking.totalPrice.toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
          {/* Transaction History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transaction History
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchBookingDetails}>
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
                        <TableHead>Remarks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Settlement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction._id}>
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
                            {transaction?.paymentResponse ? (
                              <pre className="max-h-60 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-400">
                                {JSON.stringify(transaction.paymentResponse, null, 2)}
                              </pre>
                            ) : (
                              <span className="text-gray-500">{ transaction.razorpay_order_id}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(transaction.status)}
                          </TableCell>
                          <TableCell>
                            {transaction.payoutStatus && getSettlementBadge(transaction.payoutStatus)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
            {/* Payment Information Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                    <div>{getStatusBadge(booking.paymentStatus || 'pending')}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                    <p className="capitalize">{booking.paymentMethod || '-'}</p>
                  </div>
                  {booking.paymentDate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                      <p>{format(new Date(booking.paymentDate), 'dd MMM yyyy h:mm:ss a')}</p>
                    </div>
                  )}
                </div>
                
                {booking.paymentRecords && booking.paymentRecords.length > 0 && (
                  <>
                    <h4 className="font-medium mt-6 mb-2">Payment History</h4>
                    <div className="space-y-3">
                      {booking.paymentRecords.map((record: { date:string, method: string, amount:string, notes: string }, index: number) => (
                        <div key={index} className="flex justify-between bg-muted p-3 rounded-md">
                          <div>
                            <p className="font-medium">₹{record.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {record.method} • {format(new Date(record.date), 'dd MMM yyyy')}
                            </p>
                          </div>
                          {record.notes && (
                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Student Information Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p>{booking.userId?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{booking.userId?.email || '-'}</p>
                  </div>
                  {booking.userId?.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone</p>
                      <p>{booking.userId.phone}</p>
                    </div>
                  )}
                  { booking.userId.profilePicture &&
                  <a
                    href={import.meta.env.VITE_BASE_URL + booking.userId.profilePicture}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={import.meta.env.VITE_BASE_URL + booking.userId.profilePicture}
                      alt={booking.userId?.userId}
                      className="w-30 h-30 object-contain cursor-pointer"
                    />
                  </a>
                }
                </div>
              </CardContent>
            </Card>
            
            {/* Extension History Card */}
            {booking.extensionHistory && booking.extensionHistory.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Extension History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {booking.extensionHistory.map((extension: {newEndDate: string, extendedAt:string, previousEndDate:string, notes:string}, index: number) => (
                      <div key={index} className="bg-muted p-3 rounded-md">
                        <div className="flex justify-between items-start">
                          <p className="font-medium">
                            Extended to {format(new Date(extension.newEndDate), 'dd MMM yyyy')}
                          </p>
                          <Badge variant="outline" className="ml-2">
                            {format(new Date(extension.extendedAt), 'dd MMM yyyy')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          From {format(new Date(extension.previousEndDate), 'dd MMM yyyy')}
                        </p>
                        {extension.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{extension.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      {booking && (
        <BookingExtensionDialog
          open={showExtensionDialog}
          onOpenChange={setShowExtensionDialog}
          bookingId={booking._id}
          booking={booking}
          bookingType={bookingType}
          currentEndDate={new Date(booking.endDate)}
          onExtensionComplete={handleExtensionComplete}
        />
      )}
      {showUpdateBookingDatesDialog && (
        <BookingUpdateDatesDialog
          open={showUpdateBookingDatesDialog}
          onOpenChange={setShowUpdateBookingDatesDialog}
          bookingId={booking._id}
          booking={booking}
          bookingType={bookingType}
          currentEndDate={new Date(booking.endDate)}
          onExtensionComplete={handleExtensionComplete}
        />
      )} </>
  );
};

export default AdminBookingDetail;
