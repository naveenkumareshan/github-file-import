
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { RefreshCw, LogOut, Smartphone, Monitor, Search, Users, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { userSessionService, UserSession, SessionFilters } from '@/api/userSessionService';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const UserSessionsManagement: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [statistics, setStatistics] = useState({
    totalActive: 0,
    webUsers: 0,
    mobileUsers: 0,
    iosUsers: 0,
    androidUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState<SessionFilters>({
    isActive: true,
    page: 1,
    limit: 20
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSessions();
    fetchStatistics();
  }, [filters]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await userSessionService.getActiveSessions({
        ...filters,
        search: searchTerm
      });
      
      if (response.success) {
        setSessions(response.data || []);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user sessions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await userSessionService.getSessionStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleForceLogout = async (sessionId: string, userName: string) => {
    try {
      const response = await userSessionService.forceLogout(sessionId);
      if (response.success) {
        toast({
          title: "Success",
          description: `${userName} has been logged out`
        });
        fetchSessions();
        fetchStatistics();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout user",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    fetchSessions();
    fetchStatistics();
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchSessions();
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: string) => {
    setFilters(prev => ({ 
      ...prev, 
      limit: parseInt(newLimit),
      page: 1 
    }));
  };

  const getDeviceIcon = (deviceType: string, platform?: string) => {
    if (deviceType === 'mobile') {
      return <Smartphone className="h-4 w-4" />;
    }
    return <Monitor className="h-4 w-4" />;
  };

  const getPlatformBadge = (deviceType: string, platform?: string) => {
    if (deviceType === 'mobile') {
      if (platform === 'ios') {
        return <Badge variant="outline" className="bg-blue-50">iOS</Badge>;
      } else if (platform === 'android') {
        return <Badge variant="outline" className="bg-green-50">Android</Badge>;
      }
      return <Badge variant="outline">Mobile</Badge>;
    }else{
      return <Badge variant="outline" className="bg-gray-50">{platform}</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-50">Web</Badge>;
  };

  const renderPaginationItems = () => {
    const items = [];
    const { page, pages } = pagination;
    
    // Show up to 5 page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            isActive={i === page}
            onClick={() => handlePageChange(i)}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Active</p>
                <h3 className="text-2xl font-bold">{statistics.totalActive}</h3>
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Web Users</p>
                <h3 className="text-2xl font-bold">{statistics.webUsers}</h3>
              </div>
              <Monitor className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mobile Users</p>
                <h3 className="text-2xl font-bold">{statistics.mobileUsers}</h3>
              </div>
              <Smartphone className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">iOS Users</p>
                <h3 className="text-2xl font-bold">{statistics.iosUsers}</h3>
              </div>
              <div className="w-5 h-5 bg-blue-500 rounded-sm" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Android Users</p>
                <h3 className="text-2xl font-bold">{statistics.androidUsers}</h3>
              </div>
              <div className="w-5 h-5 bg-green-500 rounded-sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Current Login Sessions</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by name, email, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Select
                value={filters.deviceType || 'all'}
                onValueChange={(value) => setFilters({
                  ...filters,
                  deviceType: value === 'all' ? undefined : value as 'web' | 'mobile',
                  page: 1
                })}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Device Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                </SelectContent>
              </Select>

              {/* <Select
                value={filters.platform || 'all'}
                onValueChange={(value) => setFilters({
                  ...filters,
                  platform: value === 'all' ? undefined : value as 'ios' | 'android' | 'web',
                  page: 1
                })}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="web">Web</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                </SelectContent>
              </Select> */}

              <Select
                value={filters.limit?.toString() || '20'}
                onValueChange={handleLimitChange}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList>
              <TabsTrigger value="active">
                Active Sessions ({pagination.total})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Login Time</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => (
                      <TableRow key={session._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{session.userId.name}</div>
                            <div className="text-sm text-muted-foreground">{session.userId.email}</div>
                            <div className="text-xs text-muted-foreground">ID: {session.userId.userId}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getDeviceIcon(session.deviceType, session.platform)}
                            <span className="capitalize">{session.deviceType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPlatformBadge(session.deviceType, session.platform)}
                        </TableCell>
                          <TableCell>
                          {session.deviceInfo.osVersion}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(session.loginTime), 'MMM dd, HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(session.lastActiveTime), 'MMM dd, HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>
                          {session.location && (
                            <div className="text-sm text-muted-foreground">
                              <Globe className="h-3 w-3 inline mr-1" />
                              {session.location.address || 'Location available'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleForceLogout(session._id, session.userId.name)}
                          >
                            <LogOut className="h-4 w-4 mr-1" />
                            Logout
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sessions.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No active sessions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} entries
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(pagination.page - 1)}
                          className={pagination.hasPrev ? "cursor-pointer" : "pointer-events-none opacity-50"}
                        />
                      </PaginationItem>
                      
                      {renderPaginationItems()}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(pagination.page + 1)}
                          className={pagination.hasNext ? "cursor-pointer" : "pointer-events-none opacity-50"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
