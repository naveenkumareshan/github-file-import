import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertTriangle, 
  Trash2, 
  CheckCircle, 
  Search, 
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Eye,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import errorLogsService, { 
  ErrorLog, 
  ErrorLogFilters, 
  ErrorLogStats 
} from '@/api/errorLogsService';
import { format } from 'date-fns';
import { AdminTablePagination, getSerialNumber } from '@/components/admin/AdminTablePagination';

const ErrorLogManagement: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<ErrorLogStats | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedLogForResolve, setSelectedLogForResolve] = useState<ErrorLog | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter state
  const [filters, setFilters] = useState<ErrorLogFilters>({
    page: 1,
    limit: 10
  });

  // Load error logs
  const loadErrorLogs = async () => {
    try {
      setLoading(true);
      const response = await errorLogsService.getErrorLogs({ ...filters, page: currentPage, limit: itemsPerPage });
      setLogs(response.logs);
      setTotalPages(response.pagination.totalPages);
      setTotalLogs(response.pagination.totalLogs);
    } catch (error) {
      console.error('Error loading error logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load error logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStats = async () => {
    try {
      const statsData = await errorLogsService.getErrorLogStats(filters.startDate, filters.endDate);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  useEffect(() => {
    loadErrorLogs();
    loadStats();
  }, [currentPage, itemsPerPage, filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof ErrorLogFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({ page: 1, limit: itemsPerPage });
    setCurrentPage(1);
  };

  // Delete single log
  const deleteLog = async (id: string) => {
    try {
      await errorLogsService.deleteErrorLog(id);
      toast({
        title: 'Success',
        description: 'Error log deleted successfully'
      });
      loadErrorLogs();
      loadStats();
    } catch (error) {
      console.error('Error deleting log:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete error log',
        variant: 'destructive'
      });
    }
  };

  // Delete multiple logs
  const deleteMultipleLogs = async () => {
    if (selectedLogs.length === 0) return;
    
    try {
      await errorLogsService.deleteMultipleErrorLogs(selectedLogs);
      toast({
        title: 'Success',
        description: `${selectedLogs.length} error logs deleted successfully`
      });
      setSelectedLogs([]);
      loadErrorLogs();
      loadStats();
    } catch (error) {
      console.error('Error deleting logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete error logs',
        variant: 'destructive'
      });
    }
  };

  // Mark log as resolved
  const markAsResolved = async () => {
    if (!selectedLogForResolve) return;
    
    try {
      await errorLogsService.markAsResolved(selectedLogForResolve._id, resolveNotes);
      toast({
        title: 'Success',
        description: 'Error log marked as resolved'
      });
      setShowResolveDialog(false);
      setSelectedLogForResolve(null);
      setResolveNotes('');
      loadErrorLogs();
      loadStats();
    } catch (error) {
      console.error('Error marking as resolved:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark error log as resolved',
        variant: 'destructive'
      });
    }
  };

  // Toggle log selection
  const toggleLogSelection = (logId: string) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  // Select all logs
  const selectAllLogs = () => {
    if (selectedLogs.length === logs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(logs.map(log => log._id));
    }
  };

  // Get level badge color
  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'default';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };

  // Get level icon
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'warn': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Logs</p>
                  <p className="text-2xl font-bold">{stats.totalLogs}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-red-600">{stats.pendingLogs}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolvedLogs}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolution Rate</p>
                  <p className="text-2xl font-bold">
                    {stats.totalLogs > 0 ? Math.round((stats.resolvedLogs / stats.totalLogs) * 100) : 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search message, source, error code..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={filters.level || 'all'} onValueChange={(value) => handleFilterChange('level', value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="Filter by source..."
                value={filters.source || ''}
                onChange={(e) => handleFilterChange('source', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.resolved?.toString() || 'all'} onValueChange={(value) => handleFilterChange('resolved', value === 'all' ? undefined : value === 'true')}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="false">Pending</SelectItem>
                  <SelectItem value="true">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear Filters
            </Button>
            <Button onClick={loadErrorLogs} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Error Logs ({totalLogs} total)</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              {selectedLogs.length > 0 && (
                <Button 
                  onClick={deleteMultipleLogs} 
                  variant="destructive" 
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected ({selectedLogs.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
              <TableHead className="w-12">
                  <Checkbox
                    checked={selectedLogs.length === logs.length && logs.length > 0}
                    onCheckedChange={selectAllLogs}
                  />
                </TableHead>
                <TableHead>S.No.</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, index) => (
                <TableRow key={log._id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLogs.includes(log._id)}
                      onCheckedChange={() => toggleLogSelection(log._id)}
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getSerialNumber(index, currentPage, itemsPerPage)}</TableCell>
                  <TableCell>
                    <Badge variant={getLevelBadgeVariant(log.level)} className="flex items-center gap-1">
                      {getLevelIcon(log.level)}
                      {log.level.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate" title={log.message}>
                      {log.message}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.userId ? (
                      <div className="text-sm">
                        <div>{log.userId.name}</div>
                        <div className="text-muted-foreground">{log.userId.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    {log.resolved ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Error Log Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Level</Label>
                                <div className="mt-1">
                                  <Badge variant={getLevelBadgeVariant(log.level)}>
                                    {log.level.toUpperCase()}
                                  </Badge>
                                </div>
                              </div>
                              <div>
                                <Label>Source</Label>
                                <p className="mt-1">{log.source}</p>
                              </div>
                              <div>
                                <Label>Date</Label>
                                <p className="mt-1">{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}</p>
                              </div>
                              <div>
                                <Label>Status Code</Label>
                                <p className="mt-1">{log.statusCode || '-'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <Label>Message</Label>
                              <p className="mt-1 p-2 bg-muted rounded">{log.message}</p>
                            </div>
                            
                            {log.stack && (
                              <div>
                                <Label>Stack Trace</Label>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                  {log.stack}
                                </pre>
                              </div>
                            )}
                            
                            {log.metadata && (
                              <div>
                                <Label>Metadata</Label>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {!log.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLogForResolve(log);
                            setShowResolveDialog(true);
                          }}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteLog(log._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <AdminTablePagination
            currentPage={currentPage}
            totalItems={totalLogs}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={(s) => { setItemsPerPage(s); setCurrentPage(1); }}
          />
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Error Log as Resolved</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Resolution Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about how this error was resolved..."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={markAsResolved}>
                Mark as Resolved
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ErrorLogManagement;