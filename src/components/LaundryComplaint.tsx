
import React, { useState, useEffect } from 'react';
import { MessageSquareWarning, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Complaint {
  id: string;
  text: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Resolved';
}

export function LaundryComplaint() {
  const [complaint, setComplaint] = useState('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  
  // Load saved complaints from localStorage
  useEffect(() => {
    const savedComplaints = localStorage.getItem('complaints');
    if (savedComplaints) {
      setComplaints(JSON.parse(savedComplaints));
    }
  }, []);

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (complaint.trim()) {
      const newComplaint: Complaint = {
        id: Date.now().toString(),
        text: complaint,
        date: new Date().toISOString(),
        status: 'Pending'
      };
      
      const updatedComplaints = [...complaints, newComplaint];
      setComplaints(updatedComplaints);
      localStorage.setItem('complaints', JSON.stringify(updatedComplaints));
      
      toast({
        title: "Complaint Submitted",
        description: "We will look into your complaint and get back to you soon.",
      });
      setComplaint('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5" />
          Report an Issue
        </CardTitle>
        <CardDescription>
          Having problems with your laundry service? Let us know.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="new">
          <TabsList className="mb-4">
            <TabsTrigger value="new">New Complaint</TabsTrigger>
            <TabsTrigger value="history">
              Complaint History ({complaints.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new">
            <form onSubmit={handleSubmitComplaint} className="space-y-4">
              <div>
                <Input
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="Describe your issue..."
                  className="min-h-[100px]"
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Complaint
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="history">
            {complaints.length > 0 ? (
              <div className="space-y-4">
                {complaints.map((item) => (
                  <div key={item.id} className="border rounded-md p-3 space-y-2">
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(item.date)}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                        item.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No previous complaints</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
