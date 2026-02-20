
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { reportsExportService } from '@/api/reportsExportService';

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

  const handleExport = async (fileType: 'excel' | 'pdf') => {
    setIsLoading(true);
    
    try {
      let result;
      const exportOptions = {
        startDate: startDate,
        endDate: endDate,
        cabinId,
        status,
        period,
        fileType
      };
      
      if (reportType === 'bookings') {
        result = await reportsExportService.exportBookingReports(exportOptions);
      } else {
        result = await reportsExportService.exportRevenueReports(exportOptions);
      }
      
      if (result.success) {
        toast({
          title: "Export Successful",
          description: result.message,
        });
      } else {
        toast({
          title: "Export Failed",
          description: result.error || "An error occurred during export",
          variant: "destructive"
        });
      }
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
       {reportType === 'bookings'  && (
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
        </DropdownMenuTrigger> )}
        <DropdownMenuContent>
           
            <DropdownMenuItem onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              <span>Export as Excel</span>
            </DropdownMenuItem>
            {reportType === 'bookings' && (
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="mr-2 h-4 w-4" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
    </DropdownMenu>
  );
};
