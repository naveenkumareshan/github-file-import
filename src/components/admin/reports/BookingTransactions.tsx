
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Filter, Search, Download, FileSpreadsheet, FileImage } from 'lucide-react';
import { ReportSkeleton } from './ReportSkeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { transactionReportsService, TransactionReport, TransactionFilters } from '@/api/transactionReportsService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminTablePagination, getSerialNumber } from '@/components/admin/AdminTablePagination';

interface BookingTransactionsProps {
  dateRange?: DateRange;
}

export const BookingTransactions: React.FC<BookingTransactionsProps> = ({ dateRange }) => {
  const [transactions, setTransactions] = useState<TransactionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 10,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Columns for the data table
  const columns = [
    {
      accessorKey: 'transactionId',
      header: 'Transaction ID',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.transactionId}</div>
      ),
    },
    {
      accessorKey: 'user.name',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.user?.name || 'N/A'}</div>
          {row.original.user?.phone && <div className="text-xs text-muted-foreground">{row.original.user?.phone}</div>}
          <div className="text-xs text-muted-foreground">{row.original.user?.email}</div>
        </div>
      ),
    },
    {
      accessorKey: 'bookingDetails',
      header: 'Booking Details',
      cell: ({ row }) => {
        const booking = row.original.bookingDetails;
        const cabin = booking?.cabin;
        const seat = booking?.seat;
        const hostel = booking?.hostelId;
        
        return (
          <div className="text-sm">
            <div className="font-medium">
              {cabin?.name || hostel?.name || 'N/A'}
            </div>
            {cabin && (
              <div className="text-muted-foreground">
                Code: {cabin.cabinCode} | Seat: {seat?.number}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'bookingType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.bookingType}
        </Badge>
      ),
    },
       {
      accessorKey: 'paymentMethod',
      header: 'Payment Method',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.paymentMethod}
        </Badge>
      ),
    },
    {
      accessorKey: 'paymentResponse',
      header: 'Payment Remarks',
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.paymentResponse}
        </Badge>
      ),
    },
    
    {
      accessorKey: 'transactionType',
      header: 'Transaction',
      cell: ({ row }) => {
        const type = row.original.transactionType;
        return (
          <Badge 
            variant="outline" 
            className={
              type === 'booking' ? 'border-blue-500 text-blue-500' :
              type === 'renewal' ? 'border-purple-500 text-purple-500' :
              type === 'cancellation' ? 'border-red-500 text-red-500' :
              'border-orange-500 text-orange-500'
            }
          >
            {type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="font-medium">₹{row.original.amount.toLocaleString('en-IN')}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={
            status === 'completed' ? 'default' : 
            status === 'pending' ? 'outline' : 
            'destructive'
          } className={status === 'completed' ? 'bg-green-500 hover:bg-green-600' : undefined}>
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.createdAt), 'dd MMM yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleViewTransaction(row.original)}
        >
          View
        </Button>
      ),
    }
  ];

  useEffect(() => {
    fetchTransactions();
  }, [filters, dateRange]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const requestFilters: TransactionFilters = { ...filters };
      
      // Apply date range filter from props
      if (dateRange?.from) {
        requestFilters.startDate = format(dateRange.from, 'yyyy-MM-dd');
      }
      if (dateRange?.to) {
        requestFilters.endDate = format(dateRange.to, 'yyyy-MM-dd');
      }

      // Apply search query
      if (searchQuery.trim()) {
        requestFilters.search = searchQuery.trim();
      }
      
      const response = await transactionReportsService.getTransactionReports(requestFilters);
      
      if (response.success && response.data) {
        setTransactions(response.data.data || []);
        setTotalCount(response.data.totalDocs || 0);
        setTotalPages(response.data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewTransaction = (transaction: TransactionReport) => {
    // Navigate to booking details or transaction details page
    navigate(`/admin/bookings/${transaction.bookingId}/${transaction.bookingType}`);
  };

  const handleExport = async (formatExport: 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const exportFilters: TransactionFilters = { ...filters };
      delete exportFilters.page;
      delete exportFilters.limit;

      if (dateRange?.from) {
        exportFilters.startDate = format(dateRange.from, 'yyyy-MM-dd');
      }
      if (dateRange?.to) {
        exportFilters.endDate = format(dateRange.to, 'yyyy-MM-dd');
      }

      if (searchQuery.trim()) {
        exportFilters.search = searchQuery.trim();
      }

      let response;
      if (formatExport === 'excel') {
        response = await transactionReportsService.exportTransactionsExcel(exportFilters);
      } else {
        response = await transactionReportsService.exportTransactionsPDF(exportFilters);
      }

      if (response.success) {
        toast({
          title: "Success",
          description: `Transactions exported as ${formatExport.toUpperCase()} successfully`,
        });
      } else {
        throw new Error(response.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export transactions",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Filter transactions based on search query (client-side for immediate feedback)
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      transaction.transactionId.toLowerCase().includes(query) ||
      transaction.userId?.name?.toLowerCase().includes(query) ||
      transaction.userId?.email?.toLowerCase().includes(query) ||
      transaction.bookingDetails?.cabinId?.name?.toLowerCase().includes(query) ||
      transaction.bookingDetails?.hostelId?.name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return <ReportSkeleton type="table" />;
  }

  return (
    <Card className="overflow-hidden border-border/50 shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
        <div>
          <CardTitle className="text-lg font-medium text-foreground/90 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Transaction Reports
          </CardTitle>
          <CardDescription>
            Detailed transaction history with booking information
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="w-[200px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2 bg-muted/30 px-2 py-1 rounded-md">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-[120px] border-none bg-transparent focus:ring-0 h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filters.bookingType || 'all'}
              onValueChange={(value) => handleFilterChange('bookingType', value)}
            >
              <SelectTrigger className="w-[120px] border-none bg-transparent focus:ring-0 h-8">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="cabin">Reading Room</SelectItem>
                <SelectItem value="hostel">Hostel</SelectItem>
                <SelectItem value="laundry">Laundry</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={filters.transactionType || 'all'}
              onValueChange={(value) => handleFilterChange('transactionType', value)}
            >
              <SelectTrigger className="w-[130px] border-none bg-transparent focus:ring-0 h-8">
                <SelectValue placeholder="Transaction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="booking">Booking</SelectItem>
                <SelectItem value="renewal">Renewal</SelectItem>
                <SelectItem value="cancellation">Cancellation</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileImage className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="border border-border/50 rounded-md overflow-hidden">
          <DataTable 
            columns={columns} 
            data={filteredTransactions} 
            pagination={false}
          />
        </div>
        
        {filteredTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No transactions found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
          </div>
        )}
        
        {filteredTransactions.length > 0 && (
          <div className="mt-4">
            <AdminTablePagination
              currentPage={filters.page || 1}
              totalItems={totalCount}
              pageSize={filters.limit || 10}
              onPageChange={handlePageChange}
              onPageSizeChange={(s) => handleFilterChange('limit', s)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
