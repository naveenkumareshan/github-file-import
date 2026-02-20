
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shirt } from 'lucide-react';

interface LaundryRequest {
  id: number;
  orderNumber: string;
  studentName: string;
  roomNumber: string;
  requestDate: string;
  status: 'pending' | 'picked-up' | 'delivered';
  items?: { name: string, quantity: number, price: number }[];
  totalAmount?: number;
}

interface LaundryManagementProps {
  laundryRequests: LaundryRequest[];
}

export function LaundryManagement({ laundryRequests }: LaundryManagementProps) {
  const [requests, setRequests] = useState<LaundryRequest[]>(laundryRequests);
  
  // Try to load existing orders from localStorage that were placed by students
  const loadStudentOrders = () => {
    try {
      const currentOrders = localStorage.getItem('currentOrders');
      if (currentOrders) {
        const parsedOrders = JSON.parse(currentOrders);
        
        // Map the orders to the format expected by this component
        const mappedOrders = parsedOrders.map((order: any) => ({
          id: order.id || Date.now(),
          orderNumber: order.orderNumber,
          studentName: "Student User",
          roomNumber: order.pickupLocation?.roomNumber || "N/A",
          requestDate: order.requestDate,
          status: order.status?.toLowerCase() === "processing" ? "pending" : 
                 order.status?.toLowerCase() === "ready for delivery" ? "picked-up" : 
                 "delivered",
          items: order.items,
          totalAmount: order.totalAmount
        }));
        
        // Combine with existing mock requests
        return [...mappedOrders, ...requests];
      }
      
      return requests;
    } catch (e) {
      console.error('Error loading student orders', e);
      return requests;
    }
  };
  
  useState(() => {
    const combinedRequests = loadStudentOrders();
    setRequests(combinedRequests);
  });
  
  const updateStatus = (id: number, status: 'pending' | 'picked-up' | 'delivered') => {
    setRequests(requests.map(request => 
      request.id === id ? { ...request, status } : request
    ));
    
    // Also update in localStorage if it's a student order
    try {
      const currentOrders = localStorage.getItem('currentOrders');
      if (currentOrders) {
        const parsedOrders = JSON.parse(currentOrders);
        const updatedOrders = parsedOrders.map((order: any) => {
          if (order.id === id) {
            const newStatus = status === 'pending' ? "Processing" : 
                             status === 'picked-up' ? "Ready for Delivery" : "Delivered";
            return { ...order, status: newStatus };
          }
          return order;
        });
        
        localStorage.setItem('currentOrders', JSON.stringify(updatedOrders));
      }
    } catch (e) {
      console.error('Error updating student order status', e);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shirt className="h-5 w-5" />
          Laundry Service Management
        </CardTitle>
        <CardDescription>Track and manage student laundry requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Room Number</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id} className="hover:bg-accent/10">
                  <TableCell>{request.orderNumber}</TableCell>
                  <TableCell>{request.studentName}</TableCell>
                  <TableCell>{request.roomNumber}</TableCell>
                  <TableCell>{request.requestDate}</TableCell>
                  <TableCell>
                    {request.items ? 
                      `${request.items.reduce((sum, item) => sum + item.quantity, 0)} items` : 
                      "N/A"}
                  </TableCell>
                  <TableCell>{request.totalAmount ? `₹${request.totalAmount}` : "N/A"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                      request.status === 'picked-up' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {request.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {request.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatus(request.id, 'picked-up')}
                        >
                          Mark as Picked Up
                        </Button>
                      )}
                      {request.status === 'picked-up' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatus(request.id, 'delivered')}
                        >
                          Mark as Delivered
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No laundry requests at this time
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
