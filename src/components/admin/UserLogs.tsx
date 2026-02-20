
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface UserLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  activity: string;
  status: string;
  timestamp: string;
}

export const UserLogs = () => {
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  
  // Get unique activity types
  const activityTypes = ['all', ...new Set(userLogs.map(log => {
    // Extract activity type (everything before the first colon or first few words)
    const activityMatch = log.activity.match(/^([^:]+):/);
    if (activityMatch) return activityMatch[1].trim();
    
    // If no colon, take the first 3 words or fewer
    const words = log.activity.split(' ');
    return words.slice(0, Math.min(3, words.length)).join(' ');
  }))];
  
  useEffect(() => {
    // Load user logs from localStorage
    try {
      const savedLogs = localStorage.getItem('userActivityLogs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        // Sort by timestamp, newest first
        parsedLogs.sort((a: UserLog, b: UserLog) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setUserLogs(parsedLogs);
      }
    } catch (e) {
      console.error('Failed to load user logs', e);
    }
  }, []);
  
  const filteredLogs = userLogs.filter(log => {
    // Apply text search
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.activity.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply status filter
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    // Apply activity filter
    const matchesActivity = activityFilter === 'all' || log.activity.toLowerCase().includes(activityFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesActivity;
  });
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };
  
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>User Activity Logs</CardTitle>
        <CardDescription>Track student activities and interactions with the platform</CardDescription>
        <div className="flex flex-col md:flex-row gap-2 mt-4">
          <Input
            placeholder="Search by name, email, or activity..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Abandoned">Abandoned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={activityFilter} onValueChange={setActivityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by activity" />
            </SelectTrigger>
            <SelectContent>
              {activityTypes.map(activity => (
                <SelectItem key={activity} value={activity}>
                  {activity === 'all' ? 'All Activities' : activity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setActivityFilter('all');
          }}>
            Clear Filters
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLogs.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-accent/50">
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{log.userName}</p>
                      <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p>{log.activity}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={`
                      ${log.status === 'Completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                      ${log.status === 'Failed' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}
                      ${log.status === 'Pending' ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : ''}
                      ${log.status === 'Abandoned' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : ''}
                    `}>
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' || activityFilter !== 'all' 
                ? 'No logs match your filters' 
                : 'No user activity logs available'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
