
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { adminBookingsService } from '@/api/adminBookingsService';
import { hostelService } from '@/api/hostelService';
import { BookingExtensionDialog } from '@/components/admin/BookingExtensionDialog';
import { ChevronLeft, Clock, CreditCard, IndianRupee, RefreshCw, Receipt } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAuth } from '@/contexts/AuthContext';
import { BookingUpdateDatesDialog } from '@/components/admin/BookingUpdateDatesDialog';
import { DuePaymentHistory } from '@/components/booking/DuePaymentHistory';
import { supabase } from '@/integrations/supabase/client';
import { vendorSeatsService } from '@/api/vendorSeatsService';

interface ReceiptRow {
  id: string;
  serial_number: string | null;
  amount: number;
  payment_method: string;
  receipt_type: string;
  transaction_id: string;
  collected_by_name: string;
  notes: string;
  created_at: string;
  due_id: string | null;
}

const AdminBookingDetail = () => {
  const { bookingId, type } = useParams<{ bookingId: string; type: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showExtensionDialog, setShowExtensionDialog] = useState(false);
  const [showUpdateBookingDatesDialog, setShowUpdateBookingDatesDialog] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [dueData, setDueData] = useState<any>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const bookingType = type === 'hostel' ? 'hostel' : 'cabin';

  useEffect(() => {
    if (bookingId && type) fetchBookingDetails();
  }, [bookingId, type]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);

      let response;
      if (bookingType === 'hostel') {
        response = await hostelService.getBookingById(bookingId);
      } else {
        response = await adminBookingsService.getBookingById(bookingId!);
      }

      if (response.success && response.data) {
        setBooking(response.data);

        // Fetch receipts from receipts table
        const { data: rcpts } = await supabase
          .from('receipts')
          .select('*')
          .eq('booking_id', bookingId!)
          .order('created_at', { ascending: false });
        setReceipts((rcpts || []) as ReceiptRow[]);

        // Fetch due data
        const dueRes = await vendorSeatsService.getDueForBooking(bookingId!);
        if (dueRes.success && dueRes.data) setDueData(dueRes.data);
        else setDueData(null);
      } else {
        toast({ title: "Error", description: "Failed to fetch booking details", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast({ title: "Error", description: "Failed to fetch booking details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExtendBooking = () => setShowExtensionDialog(true);
  const handleUpdateBookingDates = () => setShowUpdateBookingDatesDialog(true);
  const handleExtensionComplete = () => fetchBookingDetails();

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': case 'completed':
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500">Pending</Badge>;
      case 'advance_paid':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Advance Paid</Badge>;
      case 'cancelled': case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalPaid = receipts.reduce((s, r) => s + Number(r.amount), 0);

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
            <p className="text-muted-foreground mb-4">The booking you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Go Back
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
                {bookingType === 'hostel' ? 'Hostel' : 'Reading Room'} Booking #{booking.bookingId || booking._id}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {user?.role === 'admin' && (booking.status === 'completed' || booking.paymentStatus === 'completed') && (
              <Button variant="outline" onClick={handleUpdateBookingDates}>
                <Clock className="h-4 w-4 mr-2" /> Update Dates
              </Button>
            )}
            {(booking.status === 'completed' || booking.paymentStatus === 'completed') && (
              <Button variant="outline" onClick={handleExtendBooking}>
                <Clock className="h-4 w-4 mr-2" /> Extend Booking
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Info */}
            <Card>
              <CardHeader><CardTitle>Booking Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Booking ID</p>
                    <p>{booking.bookingId || booking._id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment Status</p>
                    <div>{getStatusBadge(booking.paymentStatus || booking.status || 'pending')}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">{booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM yyyy') : '-'}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Check-in Date</p>
                    <p>{booking.startDate ? format(new Date(booking.startDate), 'dd MMM yyyy') : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Check-out Date</p>
                    <p>{booking.endDate ? format(new Date(booking.endDate), 'dd MMM yyyy') : '-'}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reading Room</p>
                    <p>{typeof booking.cabinId === 'object' ? booking.cabinId?.name : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Seat</p>
                    <p>Seat #{typeof booking.seatId === 'object' ? booking.seatId?.number : '-'}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Price</p>
                    <p className="font-semibold">₹{(booking.totalPrice || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Paid (Receipts)</p>
                    <p className="font-semibold text-green-600">₹{totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipts / Transaction History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" /> Payment Receipts
                </CardTitle>
                <Button variant="outline" size="sm" onClick={fetchBookingDetails}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {receipts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">No receipts found</h3>
                    <p>Payment receipts for this booking will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Receipt #</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Collected By</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {receipts.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium text-xs">{r.serial_number || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {r.receipt_type === 'due_collection' ? 'Due Collection' : 'Booking Payment'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <IndianRupee className="h-3.5 w-3.5 mr-0.5" />
                                <span className="font-medium">{Number(r.amount).toLocaleString()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs capitalize">{r.payment_method}</TableCell>
                            <TableCell className="text-xs">{format(new Date(r.created_at), 'dd MMM yyyy, HH:mm')}</TableCell>
                            <TableCell className="text-xs">{r.collected_by_name || '-'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{r.notes || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Student Info */}
            <Card>
              <CardHeader><CardTitle>Student</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{typeof booking.userId === 'object' ? booking.userId?.name : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-sm">{typeof booking.userId === 'object' ? booking.userId?.email : '-'}</p>
                </div>
                {typeof booking.userId === 'object' && booking.userId?.userId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="text-sm">{booking.userId.userId}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Due Payment History */}
            {dueData && (
              <Card>
                <CardContent className="pt-4">
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
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showExtensionDialog && booking && (
        <BookingExtensionDialog
          open={showExtensionDialog}
          onOpenChange={setShowExtensionDialog}
          bookingId={booking._id}
          bookingType={bookingType}
          currentEndDate={booking.endDate}
          onExtensionComplete={handleExtensionComplete}
        />
      )}

      {showUpdateBookingDatesDialog && booking && (
        <BookingUpdateDatesDialog
          open={showUpdateBookingDatesDialog}
          onOpenChange={setShowUpdateBookingDatesDialog}
          bookingId={booking._id}
          bookingType={bookingType}
          currentStartDate={booking.startDate}
          currentEndDate={booking.endDate}
          onUpdateComplete={handleExtensionComplete}
        />
      )}
    </>
  );
};

export default AdminBookingDetail;
