import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DataTable } from '@/components/ui/data-table';
import  ReportDateRangePicker from '@/components/admin/reports/ReportDateRangePicker';
import { adminPayoutService, AdminPayout, PayoutProcessData, SystemAnalytics } from '@/api/adminPayoutService';
import { DollarSign, Users, Clock, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';

const AdminPayouts: React.FC = () => {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<AdminPayout | null>(null);
  const [processData, setProcessData] = useState<PayoutProcessData>({
    status: 'completed',
    notes: '',
    transactionId: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    period: 'month',
    dateRange: undefined as DateRange | undefined
  });
  const [dateFilterType, setDateFilterType] = useState<string>('thisMonth');
  const { toast } = useToast();

  useEffect(() => {
    // Set initial date range based on default filter
    handlePredefinedDateRange('today');
    fetchAnalytics();
    fetchPayouts();
    setLoading(false);
  }, []);

  // useEffect(() => {
  //   fetchPayouts();
  //   fetchAnalytics();
  // }, []);

  const handlePredefinedDateRange = (rangeType: string) => {
    const today = new Date();
    let from: Date;
    let to: Date;

    switch (rangeType) {
      case 'today':
        from = startOfDay(today);
        to = endOfDay(today);
        break;
      case 'thisWeek':
        from = startOfWeek(today);
        to = endOfWeek(today);
        break;
      case 'thisMonth':
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case 'lastMonth':
        { const lastMonth = subMonths(today, 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break; }
      case 'thisYear':
        from = startOfYear(today);
        to = endOfYear(today);
        break;
      case 'lastYear':
        { const lastYear = subYears(today, 1);
        from = startOfYear(lastYear);
        to = endOfYear(lastYear);
        break; }
      case 'custom':
        from = startOfWeek(today);
        to = endOfWeek(today);
        break;
      default:
        return;
    }
    
    setFilters(prev => ({ ...prev, dateRange: { from, to } }));
    setDateFilterType(rangeType);
  };

  const handleCustomDateRange = (range: DateRange) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  };

  const fetchPayouts = async () => {
    setLoading(true);
    const params: any = {
      status: filters.status || undefined
    };

    // Add date range to API call if available
    if (filters.dateRange?.from) {
      params.startDate = format(filters.dateRange.from, 'yyyy-MM-dd');
    }
    if (filters.dateRange?.to) {
      params.endDate = format(filters.dateRange.to, 'yyyy-MM-dd');
    }

    const result = await adminPayoutService.getAllPayouts(params);

    if (result.success) {
      setPayouts(result.data.data || []);
    } else {
      toast({
        title: "Error",
        description: "Failed to fetch payouts",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    const result = await adminPayoutService.getSystemAnalytics(filters.period as any);
    if (result.success) {
      setAnalytics(result.data.data);
    }
  };

  const handleProcessPayout = async () => {
    if (!selectedPayout) return;
    
    setProcessing(selectedPayout._id);
    const result = await adminPayoutService.processPayout(selectedPayout._id, processData);
    
    if (result.success) {
      toast({
        title: "Success",
        description: `Payout ${processData.status} successfully`
      });
      fetchPayouts();
      fetchAnalytics();
      setSelectedPayout(null);
      setProcessData({ status: 'completed', notes: '', transactionId: '' });
    } else {
      toast({
        title: "Error",
        description: result.error?.message || "Failed to process payout",
        variant: "destructive"
      });
    }
    setProcessing(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'failed': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  // ... keep existing code (columns definition)
  const columns = [
    {
      accessorKey: 'payoutId',
      header: 'Payout ID',
    },
    {
      accessorKey: 'transactionId',
      header: 'Transaction ID',
    },
    {
      accessorKey: 'vendorId.bankDetails.accountNumber',
      header: 'Bank Details',
      cell: ({ row }: { row: { original: AdminPayout } }) => (
        <div>
          <p className="font-medium">{row.original.bankDetails?.accountHolderName}</p>
          <p className="text-sm text-muted-foreground">{row.original.bankDetails?.accountNumber}</p>
          <p className="text-sm text-muted-foreground">{row.original.bankDetails?.bankName}</p>
          <p className="text-sm text-muted-foreground">{row.original.bankDetails?.ifscCode}</p>
        </div>
      )
    },
    {
      accessorKey: 'vendorId.businessName',
      header: 'Vendor',
      cell: ({ row }: { row: { original: AdminPayout } }) => (
        <div>
          <p className="font-medium">{row.original.vendorId.businessName}</p>
          <p className="text-sm text-muted-foreground">{row.original.vendorId.email}</p>
          <p className="text-sm text-muted-foreground">PayoutType : {row.original.payoutType}</p>
        </div>
      )
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }: { row: { original: AdminPayout } }) => (
        <span className="font-medium">₹{row.original.amount.toLocaleString()}</span>
      )
    },
    {
      accessorKey: 'netAmount',
      header: 'netAmount',
      cell: ({ row }: { row: { original: AdminPayout } }) => (
        <span className="font-medium">₹{row.original.netAmount.toLocaleString()}</span>
      )
    },
    
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: { original: AdminPayout } }) => (
        <Badge variant={getStatusColor(row.original.status)}>
          {row.original.status}
        </Badge>
      )
    },
    {
      accessorKey: 'requestedAt',
      header: 'Requested',
      cell: ({ row }: { row: { original: AdminPayout } }) => (
        <span>{new Date(row.original.requestedAt).toLocaleDateString()}</span>
      )
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: AdminPayout } }) => (
        <div className="flex gap-2">
          {row.original.status === 'pending' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => setSelectedPayout(row.original)}
                >
                  Process
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Process Payout</DialogTitle>
                </DialogHeader>
                    <div>
                      <p className="font-medium">Name : {selectedPayout?.bankDetails?.accountHolderName}</p>
                      <p className="font-medium">Account No : {selectedPayout?.bankDetails?.accountNumber}</p>
                      <p className="font-medium">Bank Name: {selectedPayout?.bankDetails?.bankName}</p>
                      <p className="font-medium">IFSC Code : {selectedPayout?.bankDetails?.ifscCode}</p>
                    </div>
                <div className="space-y-4">
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={processData.status}
                      onValueChange={(value: any) => setProcessData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Approve</SelectItem>
                        <SelectItem value="failed">Reject</SelectItem>
                        <SelectItem value="cancelled">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {processData.status === 'completed' && (
                    <div>
                      <Label>Transaction ID</Label>
                      <Input
                        value={processData.transactionId}
                        onChange={(e) => setProcessData(prev => ({ ...prev, transactionId: e.target.value }))}
                        placeholder="Enter transaction ID"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      value={processData.notes}
                      onChange={(e) => setProcessData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add notes..."
                    />
                  </div>
                  
                  <Button 
                    onClick={handleProcessPayout} 
                    disabled={processing === selectedPayout?._id}
                    className="w-full"
                  >
                    {processing === selectedPayout?._id ? 'Processing...' : 'Confirm'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Payout Management</h1>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.vendors.total}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.vendors.active} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.payouts.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Payouts</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.payouts.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analytics.payouts.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Filters with Date Range */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Analytics Period */}
            <div>
              <Label>Analytics Period</Label>
              <Select value={filters.period} onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply Filters Button */}
            <div className="flex items-end">
              <Button onClick={fetchAnalytics} className="w-full">
                Get Analystics
              </Button>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {/* {dateFilterType === 'custom' && ( */}
            <div className="mt-4">
              <Label>Custom Date Range</Label>
              <ReportDateRangePicker
                dateRange={filters.dateRange}
                onChange={handleCustomDateRange}
                onTypeChange={setDateFilterType}
                className="mt-2"
                dateFilterType={dateFilterType}
              />
            </div>
          {/* )} */}

          {/* Current Date Range Display */}
          {filters.dateRange?.from && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Current Date Range:</p>
              <p className="text-sm text-muted-foreground">
                {format(filters.dateRange.from, 'PPP')} - {filters.dateRange.to ? format(filters.dateRange.to, 'PPP') : 'Present'}
              </p>
            </div>
          )}

           <div className="flex items-end">
              <Button onClick={fetchPayouts} className="w-full">
                Fetch Payouts
              </Button>
            </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={payouts} 
            filter={(value: string) => {
              return payouts.filter(payout => 
                payout.vendorId.businessName.toLowerCase().includes(value.toLowerCase()) ||
                payout.payoutId.toLowerCase().includes(value.toLowerCase())
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayouts;