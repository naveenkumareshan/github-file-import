
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { adminBookingsService } from '@/api/adminBookingsService';
import { hostelService } from '@/api/hostelService';
import { ChevronLeft, CreditCard, IndianRupee, RefreshCw, Receipt, FileDown } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { supabase } from '@/integrations/supabase/client';
import { downloadInvoice, InvoiceData } from '@/utils/invoiceGenerator';

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
  const [receipts, setReceipts] = useState<ReceiptRow[]>([]);
  const [dueData, setDueData] = useState<any>(null);

  const { toast } = useToast();
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
        const { data: rcpts } = await supabase
          .from('receipts')
          .select('*')
          .eq('booking_id', bookingId!)
          .order('created_at', { ascending: false });
        setReceipts((rcpts || []) as ReceiptRow[]);
        const { data: dues } = await supabase
          .from('dues')
          .select('*')
          .eq('booking_id', bookingId!)
          .limit(1)
          .maybeSingle();
        setDueData(dues);
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': case 'completed':
        return <Badge className="bg-green-500 text-[10px] px-1.5 py-0">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px] px-1.5 py-0">Pending</Badge>;
      case 'advance_paid':
        return <Badge variant="outline" className="border-blue-500 text-blue-500 text-[10px] px-1.5 py-0">Advance Paid</Badge>;
      case 'cancelled': case 'failed':
        return <Badge variant="outline" className="border-red-500 text-red-500 text-[10px] px-1.5 py-0">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0">{status}</Badge>;
    }
  };

  const handleDownloadInvoice = () => {
    if (!booking) return;
    const user = typeof booking.userId === 'object' ? booking.userId : {};
    const cabin = typeof booking.cabinId === 'object' ? booking.cabinId : {};
    const seat = typeof booking.seatId === 'object' ? booking.seatId : {};
    const invoiceData: InvoiceData = {
      serialNumber: booking.serialNumber || booking.bookingId || booking._id || '',
      bookingDate: booking.createdAt || new Date().toISOString(),
      studentName: user?.name || '-',
      studentEmail: user?.email || '-',
      studentPhone: user?.phone || '-',
      studentSerialNumber: user?.userId || '',
      cabinName: cabin?.name || '-',
      seatNumber: seat?.number || booking.seatNumber || 0,
      startDate: booking.startDate || '',
      endDate: booking.endDate || '',
      duration: booking.bookingDuration || booking.duration || '-',
      seatAmount: booking.seatPrice || 0,
      discountAmount: booking.discountAmount || 0,
      discountReason: booking.discountReason || '',
      lockerIncluded: booking.lockerIncluded || false,
      lockerPrice: booking.lockerPrice || 0,
      totalAmount: booking.totalPrice || 0,
      paymentMethod: booking.paymentMethod || 'cash',
      transactionId: booking.transactionId || '',
      collectedByName: booking.collectedByName || '-',
    };
    downloadInvoice(invoiceData);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4">
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto py-4">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <h3 className="text-base font-medium mb-2">Booking not found</h3>
            <p className="text-muted-foreground text-sm mb-3">The booking you're looking for doesn't exist.</p>
            <Button size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const seatPrice = booking.seatPrice || 0;
  const lockerAmount = booking.lockerPrice || 0;
  const discountAmount = booking.discountAmount || 0;
  const totalPrice = booking.totalPrice || 0;
  const advancePaid = dueData?.advance_paid || 0;
  const dueCollected = receipts
    .filter(r => r.receipt_type === 'due_collection')
    .reduce((s, r) => s + Number(r.amount), 0);
  const totalCollected = advancePaid + dueCollected;
  const dueRemaining = Math.max(0, totalPrice - totalCollected);
  const paymentStatus = totalCollected === 0 ? 'unpaid'
    : dueRemaining <= 0 ? 'fully_paid' : 'partial_paid';

  const allRows = [
    ...(advancePaid > 0 ? [{
      id: 'advance-row',
      serial_number: booking.serialNumber || booking.bookingId || '-',
      amount: advancePaid,
      payment_method: booking.paymentMethod || 'cash',
      receipt_type: 'booking_payment',
      transaction_id: booking.transactionId || '',
      collected_by_name: booking.collectedByName || '-',
      notes: '',
      created_at: booking.createdAt,
      due_id: null,
      isSynthetic: true,
    }] : []),
    ...receipts.filter(r => r.receipt_type !== 'booking_payment'),
  ];
  const grandTotal = allRows.reduce((s, r) => s + Number(r.amount), 0);

  return (
    <div className="container mx-auto py-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold leading-tight">Booking Details</h1>
            <p className="text-xs text-muted-foreground">
              {bookingType === 'hostel' ? 'Hostel' : 'Reading Room'} #{booking.bookingId || booking._id}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleDownloadInvoice}>
          <FileDown className="h-3.5 w-3.5 mr-1.5" /> Invoice
        </Button>
      </div>

      {/* Single Card */}
      <Card className="max-w-2xl">
        <CardContent className="p-4 space-y-3">

          {/* Student Details */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Student Details</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{typeof booking.userId === 'object' ? booking.userId?.name : '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Email</p>
                <p className="text-xs">{typeof booking.userId === 'object' ? booking.userId?.email : '-'}</p>
              </div>
              {typeof booking.userId === 'object' && booking.userId?.userId && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Student ID</p>
                  <p className="text-xs">{booking.userId.userId}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Booking Information */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Booking Information</p>
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div>
                <p className="text-[11px] text-muted-foreground">Booking ID</p>
                <p className="text-xs font-medium">{booking.bookingId || booking._id}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Status</p>
                <div>{getStatusBadge(booking.paymentStatus || booking.status || 'pending')}</div>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Created</p>
                <p className="text-xs">{booking.createdAt ? format(new Date(booking.createdAt), 'dd MMM yyyy') : '-'}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Check-in</p>
                <p className="text-xs">{booking.startDate ? format(new Date(booking.startDate), 'dd MMM yyyy') : '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Check-out</p>
                <p className="text-xs">{booking.endDate ? format(new Date(booking.endDate), 'dd MMM yyyy') : '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Room</p>
                <p className="text-xs">{typeof booking.cabinId === 'object' ? booking.cabinId?.name : '-'}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Seat</p>
                <p className="text-xs">#{typeof booking.seatId === 'object' ? booking.seatId?.number : '-'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Summary */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
              <IndianRupee className="h-3 w-3" /> Payment Summary
            </p>
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div>
                <p className="text-[11px] text-muted-foreground">Seat Price</p>
                <p className="text-sm font-semibold">₹{seatPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Locker</p>
                <p className="text-sm font-semibold">₹{lockerAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Discount</p>
                <p className="text-sm font-semibold text-destructive">{discountAmount > 0 ? '-' : ''}₹{discountAmount.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div>
                <p className="text-[11px] text-muted-foreground">Total Price</p>
                <p className="text-sm font-semibold">₹{totalPrice.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Advance Paid</p>
                <p className="text-sm font-semibold">₹{advancePaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Due Collected</p>
                <p className="text-sm font-semibold">₹{dueCollected.toLocaleString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-muted-foreground">Total Collected</p>
                <p className="text-sm font-semibold text-green-600">₹{totalCollected.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Due Remaining</p>
                <p className={`text-sm font-semibold ${dueRemaining > 0 ? 'text-destructive' : 'text-green-600'}`}>
                  ₹{dueRemaining.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Status</p>
                {paymentStatus === 'fully_paid' ? (
                  <Badge className="bg-green-500 text-[10px] px-1.5 py-0 mt-0.5">Fully Paid</Badge>
                ) : paymentStatus === 'partial_paid' ? (
                  <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px] px-1.5 py-0 mt-0.5">Partial</Badge>
                ) : (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 mt-0.5">Unpaid</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Receipts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                <Receipt className="h-3 w-3" /> Payment Receipts
              </p>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={fetchBookingDetails}>
                <RefreshCw className="h-3 w-3 mr-1" /> Refresh
              </Button>
            </div>

            {allRows.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No receipts found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px] py-1.5">Receipt ID</TableHead>
                      <TableHead className="text-[10px] py-1.5">Type</TableHead>
                      <TableHead className="text-[10px] py-1.5">Amount</TableHead>
                      <TableHead className="text-[10px] py-1.5">Method</TableHead>
                      <TableHead className="text-[10px] py-1.5">Txn ID</TableHead>
                      <TableHead className="text-[10px] py-1.5">Date</TableHead>
                      <TableHead className="text-[10px] py-1.5">Collected By</TableHead>
                      <TableHead className="text-[10px] py-1.5">Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allRows.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-[11px] py-1.5">{r.serial_number || '-'}</TableCell>
                        <TableCell className="py-1.5">
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {r.receipt_type === 'booking_payment' ? 'Advance'
                              : r.receipt_type === 'due_collection' ? 'Due'
                              : 'Payment'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-1.5">
                          <span className="text-[11px] font-medium">₹{Number(r.amount).toLocaleString()}</span>
                        </TableCell>
                        <TableCell className="text-[11px] py-1.5 capitalize">{r.payment_method}</TableCell>
                        <TableCell className="text-[11px] py-1.5">{r.transaction_id || '-'}</TableCell>
                        <TableCell className="text-[11px] py-1.5">{r.created_at ? format(new Date(r.created_at), 'dd MMM yy, HH:mm') : '-'}</TableCell>
                        <TableCell className="text-[11px] py-1.5">{r.collected_by_name || '-'}</TableCell>
                        <TableCell className="text-[11px] py-1.5 text-muted-foreground">{r.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell colSpan={2} className="text-right text-[11px] py-1.5">Total Collected</TableCell>
                      <TableCell className="py-1.5">
                        <span className="text-[11px] text-green-600 font-semibold">₹{grandTotal.toLocaleString()}</span>
                      </TableCell>
                      <TableCell colSpan={5}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingDetail;
