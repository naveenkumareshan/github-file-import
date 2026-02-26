
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Download, Search, Filter, RefreshCw, Upload, Image, ChevronLeft, ChevronRight, Currency } from 'lucide-react';
import { depositRefundService, DepositRefund, DepositRefundFilters } from '@/api/depositRefundService';
import { uploadService } from '@/api/uploadService';
import { useToast } from '@/hooks/use-toast';
import { DateFilterSelector } from '@/components/common/DateFilterSelector';
import { format } from "date-fns";

type DateFilterType = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

interface ReportDateRangePickerProps {
  type?:string;
}


export const DepositManagement: React.FC<ReportDateRangePickerProps> = ({
  type
}) => {
  const [deposits, setDeposits] = useState<DepositRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeposits, setSelectedDeposits] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'refunded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  
  // Refund dialog state
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedDepositForRefund, setSelectedDepositForRefund] = useState<DepositRefund | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [transactionImage, setTransactionImage] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [transactionImageUrl, setTransactionImageUrl] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDeposits();
  }, [pagination.page, statusFilter, searchTerm, dateFilter, customStartDate, customEndDate]);

  const fetchDeposits = async () => {
    setLoading(true);
    
    const filters: DepositRefundFilters = {
      status: statusFilter,
      type:type,
      search: searchTerm,
      dateFilter: dateFilter,
      startDate: dateFilter === 'custom' && customStartDate ? customStartDate.toISOString() : undefined,
      endDate: dateFilter === 'custom' && customEndDate ? customEndDate.toISOString() : undefined
    };

    const result = await depositRefundService.getDeposits(pagination.page, pagination.limit, filters);
    
    if (result.success && result.data) {
      setDeposits(result.data.data);
      setPagination(result.data.pagination);
    } else {
      toast({
        title: "Error",
        description: "Failed to fetch deposits",
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const handleSelectDeposit = (depositId: string, checked: boolean) => {
    if (checked) {
      setSelectedDeposits(prev => [...prev, depositId]);
    } else {
      setSelectedDeposits(prev => prev.filter(id => id !== depositId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeposits(deposits.map(deposit => deposit._id));
    } else {
      setSelectedDeposits([]);
    }
  };

  const handleProcessRefund = (deposit?: DepositRefund) => {
    if (deposit) {
      // Single refund
      setSelectedDepositForRefund(deposit);
      setSelectedDeposits([deposit._id]);
      setRefundAmount(deposit.keyDeposit.toString());
    } else {
      // Bulk refund
      if (selectedDeposits.length === 0) {
        toast({
          title: "Error",
          description: "Please select deposits to refund",
          variant: "destructive"
        });
        return;
      }
      setSelectedDepositForRefund(null);
    }
    setShowRefundDialog(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setTransactionImage(file);
    setUploadingImage(true);

    try {
      const result = await uploadService.uploadImage(file);
      if (result.success) {
        setTransactionImageUrl(result.data.url);
        toast({
          title: "Success",
          description: "Transaction image uploaded successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to upload image",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRefundSubmit = async () => {
    setProcessing(true);
    
    const refundData = {
      refundAmount: parseFloat(refundAmount),
      refundReason: refundReason,
      refundMethod: refundMethod,
      transactionId: transactionId,
      transactionImageUrl: transactionImageUrl
    };

    let result;
    
    if (selectedDepositForRefund) {
      // Single refund
      result = await depositRefundService.processRefund(selectedDepositForRefund._id, refundData);
    } else {
      // Bulk refund
      result = await depositRefundService.bulkProcessRefunds(selectedDeposits, refundData);
    }
    
    if (result.success) {
      const count = selectedDepositForRefund ? 1 : selectedDeposits.length;
      toast({
        title: "Success",
        description: `${count} deposit${count > 1 ? 's' : ''} refunded successfully`
      });
      resetRefundForm();
      fetchDeposits();
    } else {
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive"
      });
    }
    
    setProcessing(false);
  };

  const resetRefundForm = () => {
    setShowRefundDialog(false);
    setSelectedDeposits([]);
    setSelectedDepositForRefund(null);
    setRefundAmount('');
    setRefundReason('');
    setRefundMethod('');
    setTransactionId('');
    setTransactionImage(null);
    setTransactionImageUrl('');
  };

  const handleExportReport = async (format: 'excel' | 'pdf' = 'excel') => {
    setExporting(true);
    
    const filters: DepositRefundFilters = {
      status: statusFilter,
      search: searchTerm,
      dateFilter: dateFilter,
      startDate: dateFilter === 'custom' && customStartDate ? customStartDate.toISOString() : undefined,
      endDate: dateFilter === 'custom' && customEndDate ? customEndDate.toISOString() : undefined
    };

    const result = await depositRefundService.exportDepositsReport(filters, format);
    
    if (result.success) {
      toast({
        title: "Success",
        description: `Report exported successfully as ${format.toUpperCase()}`
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
    
    setExporting(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-xs text-muted-foreground">{pagination.total} record{pagination.total !== 1 ? 's' : ''} found</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={exporting} onClick={() => handleExportReport('excel')}>
            {exporting ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
            Export
          </Button>
          {/* <Button variant="outline" disabled={exporting} onClick={() => handleExportReport('pdf')}>
            {exporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            PDF
          </Button> */}
        </div>
      </div>

      {/* Filter Section */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | 'pending' | 'refunded')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search</Label>
              <Input
                type="text"
                placeholder="Search by booking ID or user name"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label>Date Range</Label>
              <DateFilterSelector
                dateFilter={dateFilter}
                startDate={customStartDate}
                endDate={customEndDate}
                onDateFilterChange={(filter) => setDateFilter(filter as DateFilterType)}
                onStartDateChange={setCustomStartDate}
                onEndDateChange={setCustomEndDate}
              />
            </div>
          </div>
          <Button size="sm" onClick={fetchDeposits}>
            <Filter className="mr-2 h-3 w-3" />
            Apply
          </Button>
        </CardContent>
      </Card>

      {/* Deposits List */}
      <Card>
        <CardHeader className="py-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full divide-y divide-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Reading Room
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Seat
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Deposit
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-muted-foreground">Loading...</td></tr>
                  ) : deposits.length === 0 ? (
                    <tr><td colSpan={7} className="px-3 py-4 text-center text-sm text-muted-foreground">No deposits found.</td></tr>
                  ) : (
                    deposits.map((deposit, idx) => (
                      <tr key={deposit._id} className={`hover:bg-muted/30 ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <span className="font-mono text-xs">{deposit.booking?.bookingId || 'N/A'}</span>
                          {deposit.transactionId && <div className="text-xs text-muted-foreground">TR: {deposit.transactionId}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                          <div className="font-medium">{deposit.user?.name || 'N/A'}</div>
                          {deposit.user?.email && <div className="text-xs text-muted-foreground">{deposit.user.email}</div>}
                          {deposit.user?.phone && <div className="text-xs text-muted-foreground">{deposit.user.phone}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{deposit.cabin?.name || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{deposit.seat?.number || 'N/A'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-semibold">₹{deposit.keyDeposit}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                          <div>End: {format(new Date(deposit.endDate), "dd MMM yyyy")}</div>
                          {deposit.transactionId && <div>Refund: {format(new Date(deposit.keyDepositRefundDate), "dd MMM yyyy")}</div>}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${deposit.keyDepositRefunded ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {deposit.keyDepositRefunded ? 'Refunded' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4 px-4 pb-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
