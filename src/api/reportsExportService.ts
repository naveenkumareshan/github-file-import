
import axios from './axiosConfig';

interface ExportOptions {
  startDate?: Date;
  endDate?: Date;
  cabinId?: string;
  status?: 'pending' | 'completed' | 'failed' | 'cancelled';
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  fileType: 'excel' | 'pdf';
}

export const reportsExportService = {
  /**
   * Export booking reports data
   * @param options Export configuration options
   * @returns A blob URL that can be used to download the file
   */
  exportBookingReports: async (options: ExportOptions) => {
    try {
      const endpoint = options.fileType === 'excel' ? 'export/excel' : 'export/pdf';
      
      const response = await axios.get(`/admin/reports/${endpoint}`, {
        params: {
          startDate: options.startDate,
          endDate: options.endDate,
          cabinId: options.cabinId,
          status: options.status
        },
        responseType: 'blob', // Important for file downloads
      });
      
      // Create a download link
      const fileExtension = options.fileType === 'excel' ? 'xlsx' : 'pdf';
      const filename = `booking_report_${new Date().toISOString()}.${fileExtension}`;
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { 
        success: true,
        message: `Report exported as ${fileExtension.toUpperCase()} successfully`
      };
      
    } catch (error) {
      console.error("Error exporting booking reports:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },
  
  /**
   * Export revenue reports data
   * @param options Export configuration options
   * @returns A blob URL that can be used to download the file
   */
  exportRevenueReports: async (options: ExportOptions) => {
    try {
      const response = await axios.get('/admin/reports/export/revenue', {
        params: {
          startDate: options.startDate,
          endDate: options.endDate,
          period: options.period || 'monthly'
        },
        responseType: 'blob', // Important for file downloads
      });
      
      // Create a download link
      const filename = `revenue_report_${new Date().toISOString()}.xlsx`;
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { 
        success: true,
        message: 'Revenue report exported successfully'
      };
      
    } catch (error) {
      console.error("Error exporting revenue reports:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }
};