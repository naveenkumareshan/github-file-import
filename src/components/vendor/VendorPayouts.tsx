
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Calendar, TrendingUp, Clock, Plus, Eye, CreditCard, BookOpen, X } from 'lucide-react';
import { vendorService, VendorIncome, EnhancedPayout, BookingDetail } from '@/api/vendorService';
import { useToast } from '@/hooks/use-toast';
import { DateFilterSelector } from '@/components/common/DateFilterSelector';

type DateFilterType = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

const VendorPayouts: React.FC = () => {
  const [payouts, setPayouts] = useState<EnhancedPayout[]>([]);
  const [income, setIncome] = useState<VendorIncome | null>(null);
  const [loading, setLoading] = useState(true);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const { toast } = useToast();

  const hasFetchedRef = useRef(false);

  // useEffect(() => {
  //    if (hasFetchedRef.current) return;
  //     hasFetchedRef.current = true;
  //   fetchData();
  // }, []);

  // useEffect(() => {
  //   if (hasFetchedRef.current) {
  //     fetchData();
  //   }
  // }, [dateFilter, customStartDate, customEndDate]);

  useEffect(() => {
    // Only run on initial load
    if (!hasFetchedRef.current) {
      fetchData();
      hasFetchedRef.current = true;
      return;
    }

    // On change of dateFilter/custom dates after initial load
    if (dateFilter || customStartDate || customEndDate) {
      fetchData();
    }
  }, [dateFilter, customStartDate, customEndDate]);

  const fetchData = async () => {
    setLoading(true);
    
    const filterParams = {
      dateFilter: dateFilter !== 'custom' ? dateFilter : 'custom' as DateFilterType,
      startDate: dateFilter === 'custom' && customStartDate ? customStartDate.toISOString() : undefined,
      endDate: dateFilter === 'custom' && customEndDate ? customEndDate.toISOString() : undefined
    };
    
    const [incomeResult, payoutsResult] = await Promise.all([
      vendorService.getIncomeAnalytics(filterParams),
      vendorService.getPayouts(filterParams)
    ]);
    
    if (incomeResult.success) {
      setIncome(incomeResult.data.data);

      if(incomeResult?.data?.data?.payoutSummary?.availableBalance){
        setPayoutAmount(incomeResult.data.data.payoutSummary.availableBalance)
      }
      
    } else {
      toast({
        title: "Error",
        description: "Failed to fetch income data",
        variant: "destructive"
      });
    }
    
    if (payoutsResult.success) {
      setPayouts(payoutsResult.data.data);
    } else {
      toast({
        title: "Error",
        description: "Failed to fetch payouts",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  console.log(payoutAmount)
  const handleRequestPayout = async () => {
    console.log(payoutAmount)
    if (!payoutAmount || parseFloat(payoutAmount) < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }
    
    setRequesting(true);
    const result = await vendorService.requestPayout({ 
      amount: parseFloat(payoutAmount),
      bookingIds: selectedBookings.length > 0 ? selectedBookings : undefined
    });
    
    if (result.success) {
      toast({
        title: "Success",
        description: "Payout request submitted successfully"
      });
      setPayoutAmount('');
      setSelectedBookings([]);
      fetchData();
    } else {
      toast({
        title: "Error",
        description: result.error?.message || "Failed to request payout",
        variant: "destructive"
      });
    }
    setRequesting(false);
  };

  const handleBookingSelection = (bookingId: string, checked: boolean) => {
    if (checked) {
      setSelectedBookings(prev => [...prev, bookingId]);
    } else {
      setSelectedBookings(prev => prev.filter(id => id !== bookingId));
    }
  };

  const calculateSelectedAmount = () => {
    if (!income || selectedBookings.length === 0) return 0;
    
    const allBookings = [
      ...income.today.bookings,
      ...income.yesterday.bookings,
      ...income.week.bookings,
      ...income.month.bookings
    ];
    
    return allBookings
      .filter(booking => selectedBookings.includes(booking._id) && booking.payoutStatus === 'pending')
      .reduce((sum, booking) => sum + booking.netAmount, 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'included': return 'bg-blue-100 text-blue-800';
      case 'processed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderBookingList = (bookings: BookingDetail[], title: string) => (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-muted-foreground">{title}</h4>
      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings</p>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {bookings.map((booking) => (
            <div key={booking._id} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center space-x-2">
                {/* {booking.payoutStatus === 'pending' && (
                  <Checkbox
                    checked={selectedBookings.includes(booking.id)}
                    onCheckedChange={(checked) => handleBookingSelection(booking.id, checked as boolean)}
                  />
                )} */}
                <div className="text-sm">
                  <p className="font-medium">{booking.bookingId}</p>
                  <p className="text-muted-foreground">{booking.cabin} - Seat {booking.seat}</p>
                </div>
              </div>
              <div className="text-right text-sm">
                {/* <p className="font-medium">₹{booking.amount.toLocaleString()}</p> */}
                {/* <p className="text-red-600">-₹{booking.commission.toLocaleString()}</p> */}
                <p className="font-semibold text-green-600">₹{booking.netAmount.toLocaleString()}</p>
                <Badge className={`text-xs ${getPayoutStatusColor(booking.payoutStatus)}`}>
                  {booking.payoutStatus}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payout Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBookingDetails(true)}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View Bookings
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <CreditCard className="h-4 w-4 mr-2" />
                Request Payout
              </Button>
            </DialogTrigger>
             <DialogContent className="max-w-md mx-auto">
                  <DialogHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <DialogTitle className="text-xl font-semibold">Instant Settlements</DialogTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Settle to your bank account instantly, even on holidays!
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      // onClick={() => onOpenChange(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogHeader>
              <DialogHeader>
                <DialogTitle>Request Payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Available Balance</Label>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{income?.payoutSummary.availableBalance.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <Label>Pending Bookings</Label>
                    <p className="text-lg font-semibold">
                      {income?.payoutSummary.totalPendingBookings || 0} bookings
                    </p>
                  </div>
                </div>
                
                {selectedBookings.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium">Selected Bookings Amount</p>
                    <p className="text-xl font-bold text-blue-600">
                      ₹{calculateSelectedAmount().toLocaleString()}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="amount">Payout Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={income?.payoutSummary.availableBalance}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Enter amount"
                    max={income?.payoutSummary.availableBalance || 0}
                  />
                </div>
                
                <Button 
                  onClick={handleRequestPayout} 
                  disabled={requesting}
                  className="w-full"
                >
                  {requesting ? 'Processing...' : 'Submit Payout Request'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Payout Summary Cards */}
      {income && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">₹{income.payoutSummary.availableBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Ready for payout
              </p>
              <p className="text-xs text-muted-foreground">
                {income.payoutSummary.totalPendingBookings} bookings
              </p>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{income.payoutSummary.pendingRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {income.payoutSummary.totalPendingBookings} bookings
              </p>
            </CardContent>
          </Card> */}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requested Payouts</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{income.payoutSummary.requestedPayouts.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Under processing
              </p>
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{income.commissionRate}%</div>
              <p className="text-xs text-muted-foreground">
                Platform commission
              </p>
            </CardContent>
          </Card> */}
        </div>
      )}
{/* Date Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Date Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <DateFilterSelector
            dateFilter={dateFilter}
            startDate={customStartDate}
            endDate={customEndDate}
            onDateFilterChange={(filter) => setDateFilter(filter as DateFilterType)}
            onStartDateChange={setCustomStartDate}
            onEndDateChange={setCustomEndDate}
          />
        </CardContent>
      </Card>
      {/* Income Analytics Tabs */}
      {/* {income && (
        <Card>
          <CardHeader>
            <CardTitle>Income Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>
              
              {(['today', 'yesterday', 'week', 'month'] as const).map((period) => (
                <TabsContent key={period} value={period} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">₹{income[period].totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Commission</p>
                      <p className="text-2xl font-bold text-red-600">-₹{income[period].commission.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Net Income</p>
                      <p className="text-2xl font-bold text-green-600">₹{income[period].netIncome.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-lg font-semibold">{income[period].bookingsCount} bookings</p>
                    <p className="text-sm text-muted-foreground">
                      Average: ₹{income[period].bookingsCount > 0 ? Math.round(income[period].netIncome / income[period].bookingsCount).toLocaleString() : 0} per booking
                    </p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )} */}

      {/* Booking Details Dialog */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details & Selection</DialogTitle>
          </DialogHeader>
          {income && (
            <Tabs defaultValue="today" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
              </TabsList>
              
              <TabsContent value="today" className="space-y-4">
                {renderBookingList(income.today.bookings, 'Today\'s Bookings')}
              </TabsContent>
              <TabsContent value="yesterday" className="space-y-4">
                {renderBookingList(income.yesterday.bookings, 'Yesterday\'s Bookings')}
              </TabsContent>
              <TabsContent value="week" className="space-y-4">
                {renderBookingList(income.week.bookings, 'This Week\'s Bookings')}
              </TabsContent>
              <TabsContent value="month" className="space-y-4">
                {renderBookingList(income.month.bookings, 'This Month\'s Bookings')}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payout requests yet</p>
            ) : (
              payouts.map((payout) => (
                <div key={payout._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{payout.payoutId}</p>
                      <Badge variant={getStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                    </div>
                    { payout.status =='completed' &&
                    <p className="text-sm text-muted-foreground">
                      Transaction ID : {payout.transactionId} 
                    </p>
                    }
                    
                    <p className="text-sm text-muted-foreground">
                      {payout.bookingCount} bookings included
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Period: {new Date(payout.period.startDate).toLocaleDateString()} - {new Date(payout.period.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      payoutType: { payout.payoutType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">₹{payout.netAmount.toLocaleString()}</p>
                    {/* <p className="text-sm text-red-600">Commission: ₹{payout.commission.toLocaleString()}</p> */}
                    <p className="text-sm text-muted-foreground">
                      {payout.processedAt ? `Processed ${new Date(payout.processedAt).toLocaleDateString()}` : 'Pending'}
                    </p>
                    { payout.payoutType == 'manual' && payout.additionalCharges.manualRequestFee > 0 &&
                        <p className="text-sm text-muted-foreground">
                          {payout.additionalCharges.description } : 
                          {payout.additionalCharges.manualRequestFee }
                        </p>
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorPayouts;