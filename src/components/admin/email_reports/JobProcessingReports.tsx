import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { jobProcessingService } from '@/api/jobProcessingService';
import { toast } from '@/hooks/use-toast';


import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@radix-ui/react-select';
import { DataTable } from '@/components/ui/data-table';

interface Job {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'high' | 'normal' | 'low';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  attempts: number;
  maxAttempts: number;
  error?: string;
  data: any;
  jobId:string;
  subject:string;
}

export const JobProcessingReports = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);


  const columns = [
    {
      accessorKey: 'jobId',
      header: 'Job Id',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.jobId.substring(0, 8)}...</div>
      ),
    },
    // {
    //   accessorKey: 'customerName',
    //   header: 'Customer',
    // },
    {
      accessorKey: 'type',
      header: 'type',
    },
    // {
    //   accessorKey: 'amount',
    //   header: 'Amount',
    //   cell: ({ row }) => (
    //     <div>₹{row.original.amount.toLocaleString('en-IN')}</div>
    //   ),
    // },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <><Badge className={getStatusColor(status)}>
            {getStatusIcon(status)}
            <span className="ml-1">{status}</span>
          </Badge><Badge className={getPriorityColor(row.original.priority)}>
              {row.original.priority}
            </Badge></>
        );
      },
    },
    // {
    //   accessorKey: 'date',
    //   header: 'Order Date',
    // },
    {
      accessorKey: 'bookingStartDate',
      header: 'Job Status',
      cell: ({ row }) => (
          <div>
        <div className="text-sm text-muted-foreground">
                        <p>Job ID: {row.original.jobId}</p>
                        <p>Created: {format(new Date(row.original.createdAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                        {row.original.startedAt && (
                          <p>Started: {format(new Date(row.original.startedAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                        )}
                        {row.original.completedAt && (
                          <p>Completed: {format(new Date(row.original.completedAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                        )}
                        {row.original.failedAt && (
                          <p>Failed: {format(new Date(row.original.failedAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                        )}
                        <p>Attempts: {row.original.attempts}/{row.original.maxAttempts}</p>
                        {row.original.data?.email && (
                          <p>Target: {row.original.data.email}</p>
                        )}
                      </div>
                      
                      {row.original.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          Error: {row.original.error}
                        </div>
                      )}
                      </div>
      )
    },
    // {
    //   accessorKey: 'actions',
    //   header: 'Actions',
    //   cell: ({ row }) => (
    //     <Button variant="outline" size="sm">View</Button>
    //   )
    // }
  ];

 useEffect(() => {
    loadJobs();
  }, [filter]);
  const loadJobs = async () => {
    try {
       const filters = filter !== 'all' ? { status:filter } : {};
      const response = await jobProcessingService.getAllJobs(filters);
      if (response.success && response.data) {
        setJobs(response.data);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load jobs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const response = await jobProcessingService.retryJob(jobId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Job queued for retry",
        });
        loadJobs();
      } else {
        toast({
          title: "Error",
          description: "Failed to retry job",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry job",
        variant: "destructive"
      });
    }
  };
  const handleExportReport = async () => {
    try {
      const response = await jobProcessingService.exportJobReport(filter);
      if (response.success) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `job-report-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Report exported successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive"
      });
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: jobs.length,
    pending: jobs.filter(job => job.status === 'pending').length,
    processing: jobs.filter(job => job.status === 'processing').length,
    completed: jobs.filter(job => job.status === 'completed').length,
    failed: jobs.filter(job => job.status === 'failed').length
  };


   // Generate pagination items
    const renderPaginationItems = () => {
      const items = [];
      const maxItems = 5;
      
      // Always show first page
      items.push(
        <PaginationItem key="first">
          <PaginationLink 
            isActive={page === 1}
            onClick={() => setPage(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      // Add ellipsis if needed
      if (page > 3) {
        items.push(
          <PaginationItem key="ellipsis-1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Add pages around current page
      let startPage = Math.max(2, page - 1);
      let endPage = Math.min(totalPages - 1, page + 1);
      
      if (page <= 3) {
        endPage = Math.min(totalPages - 1, maxItems - 1);
      }
      
      if (page >= totalPages - 2) {
        startPage = Math.max(2, totalPages - maxItems + 2);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              isActive={page === i}
              onClick={() => setPage(i)}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Add ellipsis if needed
      if (page < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      // Always show last page if there's more than one page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key="last">
            <PaginationLink 
              isActive={page === totalPages}
              onClick={() => setPage(totalPages)}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      return items;
    };
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <div className="text-sm text-muted-foreground">Processing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Job Processing Queue</CardTitle>
            <div className="flex space-x-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 border rounded"
              >
                <option value="all">All Jobs</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
              <Button variant="outline" size="sm" onClick={loadJobs}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
        <div className="border border-border/50 rounded-md overflow-hidden">
          <DataTable 
            columns={columns} 
            data={jobs} 
            pagination={false}
          />
        </div>
        
        {jobs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-1">No transactions found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or date range</p>
          </div>
        )}
        
        {jobs.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show</span>
              <Select 
                value={limit.toString()} 
                onValueChange={(value) => {
                  setLimit(parseInt(value));
                  setPage(1); // Reset to first page when changing limit
                }}
              >
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
              <span className="text-sm ml-4">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount} entries
              </span>
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {renderPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
      </Card>
    </div>
  );
};