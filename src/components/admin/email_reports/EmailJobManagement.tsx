
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { jobProcessingService, JobsFilters } from '@/api/jobProcessingService';
import { 
  Mail, 
  Eye, 
  RefreshCw, 
  Download, 
  Filter,
  ChevronLeft, 
  ChevronRight,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface EmailJob {
  _id: string;
  jobId: string;
  type: string;
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  scheduledFor?: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  error?: string;
  createdAt: string;
}

const EmailJobManagement: React.FC = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<EmailJob | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  const [filters, setFilters] = useState<JobsFilters>({
    status: 'all',
    page: 1,
    limit: 10
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [emailTypeFilter, setEmailTypeFilter] = useState('');

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  function decodeHtml(html: string) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await jobProcessingService.getAllJobs(filters);
      
      if (response.success) {
        setJobs(response.data || []);
        setTotalCount(response.count || 0);
        setTotalPages(response.totalPages || 1);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch email jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      const response = await jobProcessingService.retryJob(jobId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Job retry initiated"
        });
        fetchJobs();
      } else {
        throw new Error(response.error || 'Failed to retry job');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to retry job",
        variant: "destructive"
      });
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await jobProcessingService.exportJobReport(filters);
      if (response.success) {
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `email-jobs-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Report exported successfully"
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

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status: status || undefined, page: 1 }));
  };

  const handleViewJob = (job: EmailJob) => {
    setSelectedJob(job);
    setIsViewDialogOpen(true);
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
  // Filter jobs based on search term and email type
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.recipientName && job.recipientName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesEmailType = !emailTypeFilter || job.type === emailTypeFilter;
    
    return matchesSearch && matchesEmailType;
  });

  const emailTypes = Array.from(new Set(jobs.map(job => job.type)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Email Job Management</h2>
          <p className="text-muted-foreground">Monitor and manage email processing jobs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchJobs} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <TabsList>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by email, subject, or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filters.status || ''} onValueChange={handleStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="emailType">Email Type</Label>
                  <Select value={emailTypeFilter} onValueChange={setEmailTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {emailTypes.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="limit">Items per page</Label>
                  <Select 
                    value={filters.limit?.toString() || '10'} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Email Jobs ({totalCount} total)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading jobs...</span>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status|Priority</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredJobs.map((job) => (
                          <TableRow key={job._id}>
                            <TableCell className="font-mono text-sm">
                              {job.jobId.slice(-8)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{job.recipientName || 'N/A'}</div>
                                <div className="text-sm text-muted-foreground">{job.recipientEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{job.subject}</TableCell>
                            <TableCell>
                              <><Badge className={getStatusColor(job.status)}>
                                {getStatusIcon(job.status)}
                                <span className="ml-1">{job.status}</span>
                              </Badge><Badge className={getPriorityColor(job.priority)}>
                                  {job.priority}
                                </Badge></>
                            </TableCell>
                            <TableCell>
                              <span className={job.attempts >= job.maxAttempts ? 'text-red-600' : ''}>
                                {job.attempts}/{job.maxAttempts}
                              </span>
                            </TableCell>
                            <TableCell>
                              {format(new Date(job.createdAt), 'MMM dd, HH:mm')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewJob(job)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {job.status === 'failed' && job.attempts < job.maxAttempts && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRetryJob(job.jobId)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredJobs.length} of {totalCount} jobs
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(filters.page! - 1)}
                        disabled={filters.page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">
                        Page {filters.page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(filters.page! + 1)}
                        disabled={filters.page === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Job Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Job Details</DialogTitle>
          </DialogHeader>
          {selectedJob && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Job Details</TabsTrigger>
                <TabsTrigger value="content">Email Content</TabsTrigger>
                {selectedJob.error && <TabsTrigger value="error">Error Details</TabsTrigger>}
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Job ID</Label>
                    <p className="font-mono text-sm">{selectedJob.jobId}</p>
                  </div>
                  <div>
                    <Label>Type</Label>
                    <p>{selectedJob.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  </div>
                  <div>
                    <Label>Recipient Name</Label>
                    <p>{selectedJob.recipientName || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Recipient Email</Label>
                    <p>{selectedJob.recipientEmail}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={getStatusColor(selectedJob.status)}>
                      {selectedJob.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Badge className={getPriorityColor(selectedJob.priority)}>
                      {selectedJob.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label>Attempts</Label>
                    <p>{selectedJob.attempts}/{selectedJob.maxAttempts}</p>
                  </div>
                  <div>
                    <Label>Created At</Label>
                    <p>{format(new Date(selectedJob.createdAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                  </div>
                  {selectedJob.processedAt && (
                    <div>
                      <Label>Processed At</Label>
                      <p>{format(new Date(selectedJob.processedAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                    </div>
                  )}
                  {selectedJob.completedAt && (
                    <div>
                      <Label>Completed At</Label>
                      <p>{format(new Date(selectedJob.completedAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <p className="font-medium">{selectedJob.subject}</p>
                </div>
                
                <div>
                  <Label>HTML Content</Label>
                  <div className="border rounded p-4 max-h-96 overflow-y-auto bg-gray-50">
                    <div dangerouslySetInnerHTML={{ __html: decodeHtml(selectedJob.htmlContent) }} />
                  </div>
                </div>
                
                {selectedJob.textContent && (
                  <div>
                    <Label>Text Content</Label>
                    <div className="border rounded p-4 max-h-48 overflow-y-auto bg-gray-50 whitespace-pre-wrap">
                      {selectedJob.textContent}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {selectedJob.error && (
                <TabsContent value="error" className="space-y-4">
                  <div>
                    <Label>Error Message</Label>
                    <div className="border rounded p-4 bg-red-50 text-red-700">
                      {selectedJob.error}
                    </div>
                  </div>
                  {selectedJob.failedAt && (
                    <div>
                      <Label>Failed At</Label>
                      <p>{format(new Date(selectedJob.failedAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default EmailJobManagement;