
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Wallet, Download, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { depositRefundService, DepositRefund, DepositRefundFilters } from '@/api/depositRefundService';
import { useToast } from '@/hooks/use-toast';
import { DateFilterSelector } from '@/components/common/DateFilterSelector';
import { format } from "date-fns";
import { formatCurrency } from '@/utils/currency';

type DateFilterType = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

interface ReportDateRangePickerProps {
  type?: string;
}

export const DepositManagement: React.FC<ReportDateRangePickerProps> = ({ type }) => {
  const [deposits, setDeposits] = useState<DepositRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 0 });

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'refunded'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('this_month');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();

  const { toast } = useToast();

  useEffect(() => {
    fetchDeposits();
  }, [pagination.page, statusFilter, searchTerm, dateFilter, customStartDate, customEndDate]);

  const fetchDeposits = async () => {
    setLoading(true);
    const filters: DepositRefundFilters = {
      status: statusFilter,
      type,
      search: searchTerm,
      dateFilter,
      startDate: dateFilter === 'custom' && customStartDate ? customStartDate.toISOString() : undefined,
      endDate: dateFilter === 'custom' && customEndDate ? customEndDate.toISOString() : undefined,
    };
    const result = await depositRefundService.getDeposits(pagination.page, pagination.limit, filters);
    if (result.success && result.data) {
      setDeposits(result.data.data);
      setPagination(result.data.pagination);
    } else {
      toast({ title: 'Error', description: 'Failed to fetch deposits', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleExportReport = async () => {
    setExporting(true);
    const filters: DepositRefundFilters = {
      status: statusFilter,
      search: searchTerm,
      dateFilter,
      startDate: dateFilter === 'custom' && customStartDate ? customStartDate.toISOString() : undefined,
      endDate: dateFilter === 'custom' && customEndDate ? customEndDate.toISOString() : undefined,
    };
    const result = await depositRefundService.exportDepositsReport(filters, 'excel');
    if (result.success) {
      toast({ title: 'Success', description: 'Report exported successfully' });
    } else {
      toast({ title: 'Error', description: 'Failed to export report', variant: 'destructive' });
    }
    setExporting(false);
  };

  // Summary stats
  const totalDeposits = useMemo(() => deposits.reduce((s, d) => s + d.keyDeposit, 0), [deposits]);
  const pendingCount = useMemo(() => deposits.filter(d => !d.keyDepositRefunded).length, [deposits]);
  const refundedCount = useMemo(() => deposits.filter(d => d.keyDepositRefunded).length, [deposits]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input className="h-8 pl-7 text-xs w-[200px]" placeholder="Search name, booking#..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            <SelectItem value="pending" className="text-xs">Pending</SelectItem>
            <SelectItem value="refunded" className="text-xs">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <DateFilterSelector
          dateFilter={dateFilter}
          startDate={customStartDate}
          endDate={customEndDate}
          onDateFilterChange={(filter) => setDateFilter(filter as DateFilterType)}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
        />
        <div className="ml-auto flex items-center gap-2">
          {(searchTerm || statusFilter !== 'all') && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
              Clear
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" disabled={exporting} onClick={handleExportReport}>
            {exporting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} Export
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={fetchDeposits}>
            <RefreshCw className="h-3 w-3" /> Refresh
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Booking ID</TableHead>
              <TableHead className="text-xs">User</TableHead>
              <TableHead className="text-xs">Reading Room</TableHead>
              <TableHead className="text-xs">Seat</TableHead>
              <TableHead className="text-xs">Deposit</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">Loading...</TableCell></TableRow>
            ) : deposits.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">No deposits found</TableCell></TableRow>
            ) : (
              deposits.map(deposit => (
                <TableRow key={deposit._id}>
                  <TableCell className="text-xs">
                    <span className="font-mono">{deposit.booking?.bookingId || 'N/A'}</span>
                    {deposit.transactionId && <div className="text-muted-foreground text-[10px]">TR: {deposit.transactionId}</div>}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{deposit.user?.name || 'N/A'}</div>
                    {deposit.user?.phone && <div className="text-muted-foreground text-[10px]">{deposit.user.phone}</div>}
                  </TableCell>
                  <TableCell className="text-xs">{deposit.cabin?.name || 'N/A'}</TableCell>
                  <TableCell className="text-xs">{deposit.seat?.number || 'N/A'}</TableCell>
                  <TableCell className="text-xs font-semibold">{formatCurrency(deposit.keyDeposit)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>End: {format(new Date(deposit.endDate), "dd MMM yyyy")}</div>
                    {deposit.keyDepositRefundDate && <div>Refund: {format(new Date(deposit.keyDepositRefundDate), "dd MMM yyyy")}</div>}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge variant={deposit.keyDepositRefunded ? 'default' : 'secondary'} className="text-[10px]">
                      {deposit.keyDepositRefunded ? 'Refunded' : 'Pending'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <div>
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))} disabled={pagination.page === 1}>
            <ChevronLeft className="h-3 w-3 mr-1" /> Prev
          </Button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPagination(p => ({ ...p, page: Math.min(p.pages, p.page + 1) }))} disabled={pagination.page === pagination.pages}>
            Next <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
