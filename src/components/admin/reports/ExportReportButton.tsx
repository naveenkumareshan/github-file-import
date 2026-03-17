
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { adminBookingsService } from '@/api/adminBookingsService';
import { format } from 'date-fns';

interface ExportReportButtonProps {
  reportType: 'bookings' | 'revenue';
  startDate?: Date;
  endDate?: Date;
  cabinId?: string;
  status?: 'pending' | 'completed' | 'failed'|'cancelled';
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  className?: string;
}

export const ExportReportButton: React.FC<ExportReportButtonProps> = ({
  reportType,
  startDate,
  endDate,
  cabinId,
  status,
  period,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    
    try {
      const workbook = new ExcelJS.Workbook();

      if (reportType === 'bookings') {
        const filters: any = { page: 1, limit: 1000 };
        if (startDate) filters.startDate = format(startDate, 'yyyy-MM-dd');
        if (endDate) filters.endDate = format(endDate, 'yyyy-MM-dd');
        if (cabinId) filters.cabinId = cabinId;
        if (status) filters.status = status;

        const response = await adminBookingsService.getAllBookings(filters);
        if (!response.success || !response.data) throw new Error('Failed to fetch');

        const sheet = workbook.addWorksheet('Booking Report');
        sheet.columns = [
          { header: 'Booking ID', key: 'bookingId', width: 20 },
          { header: 'Customer', key: 'customer', width: 25 },
          { header: 'Property', key: 'property', width: 25 },
          { header: 'Seat', key: 'seat', width: 10 },
          { header: 'Start Date', key: 'startDate', width: 15 },
          { header: 'End Date', key: 'endDate', width: 15 },
          { header: 'Amount', key: 'amount', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Payment Method', key: 'paymentMethod', width: 18 },
        ];

        response.data.forEach((b: any) => {
          sheet.addRow({
            bookingId: b.bookingId,
            customer: b.userId?.name || 'N/A',
            property: b.cabinId?.name || 'N/A',
            seat: b.seatId?.number || '',
            startDate: b.startDate || '',
            endDate: b.endDate || '',
            amount: b.totalPrice || 0,
            status: b.paymentStatus || '',
            paymentMethod: b.paymentMethod || '',
          });
        });

        sheet.getRow(1).eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        });
      } else {
        // Revenue report
        const revenueResponse = await adminBookingsService.getMonthlyRevenue();
        if (!revenueResponse.success || !revenueResponse.data) throw new Error('Failed to fetch');

        const sheet = workbook.addWorksheet('Revenue Report');
        sheet.columns = [
          { header: 'Month', key: 'month', width: 20 },
          { header: 'Revenue (₹)', key: 'revenue', width: 20 },
        ];

        revenueResponse.data.forEach((m: any) => {
          sheet.addRow({ month: m.monthName, revenue: m.revenue });
        });

        sheet.getRow(1).eachCell(cell => {
          cell.font = { bold: true };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `${reportType === 'bookings' ? 'Booking' : 'Revenue'} report exported as Excel successfully`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to generate report file",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={className}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={handleExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          <span>Export as Excel</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
