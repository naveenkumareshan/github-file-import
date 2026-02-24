
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface Complaint {
  id: string;
  studentName: string;
  content: string;
  timestamp: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
  source: string;
}

export function CustomerComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  useEffect(() => {
    // Load complaints from localStorage
    try {
      const savedComplaints = localStorage.getItem('customerComplaints');
      if (savedComplaints) {
        setComplaints(JSON.parse(savedComplaints));
      } else {
        // Set sample data if none exists
        const sampleComplaints: Complaint[] = [
          {
            id: 'complaint-1',
            studentName: 'Jane Smith',
            content: 'The lighting in reading room A302 is not working properly.',
            timestamp: '2025-04-28T14:30:00Z',
            status: 'Pending',
            source: 'App'
          },
          {
            id: 'complaint-2',
            studentName: 'Alex Johnson',
            content: 'My laundry order #LDR20254200123 is delayed by 2 days now.',
            timestamp: '2025-04-27T09:15:00Z',
            status: 'In Progress',
            source: 'Email'
          }
        ];
        setComplaints(sampleComplaints);
        localStorage.setItem('customerComplaints', JSON.stringify(sampleComplaints));
      }
    } catch (e) {
      console.error('Failed to load complaints', e);
    }
  }, []);

  const updateComplaintStatus = (id: string, newStatus: 'Pending' | 'In Progress' | 'Resolved') => {
    const updatedComplaints = complaints.map(complaint =>
      complaint.id === id ? { ...complaint, status: newStatus } : complaint
    );
    setComplaints(updatedComplaints);
    localStorage.setItem('customerComplaints', JSON.stringify(updatedComplaints));
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Customer Complaints
        </CardTitle>
        <CardDescription>Manage customer issues and complaints</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                  <TableCell className="font-medium">{complaint.studentName}</TableCell>
                  <TableCell>{complaint.content}</TableCell>
                  <TableCell>{complaint.source}</TableCell>
                  <TableCell>{new Date(complaint.timestamp).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      complaint.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 
                      complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {complaint.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {complaint.status === 'Pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateComplaintStatus(complaint.id, 'In Progress')}
                        >
                          Mark In Progress
                        </Button>
                      )}
                      {(complaint.status === 'Pending' || complaint.status === 'In Progress') && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateComplaintStatus(complaint.id, 'Resolved')}
                        >
                          Mark Resolved
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {complaints.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No complaints at this time
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
