
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarCheck, FileSearch } from 'lucide-react';
import { useState } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';

interface Booking {
  id: number;
  customerName: string;
  customerEmail: string;
  cabinName: string;
  seatNumber: number;
  startDate: string;
  months: number;
  totalAmount: number;
  status: 'active' | 'ending' | 'expired';
}

interface SubscriptionManagementProps {
  bookings: Booking[];
  filterStatus: 'all' | 'active' | 'ending' | 'expired';
  onFilterChange: (status: 'all' | 'active' | 'ending' | 'expired') => void;
}

export function SubscriptionManagement({ 
  bookings, 
  filterStatus, 
  onFilterChange 
}: SubscriptionManagementProps) {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(booking => booking.status === filterStatus);

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetailsDialog(true);
  };

  const calculateEndDate = (startDate: string, months: number) => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + months);
    return formatDate(date.toISOString());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Subscription Management</CardTitle>
            <CardDescription>View and manage all customer subscriptions</CardDescription>
          </div>
          <div className="flex space-x-1">
            <button 
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1 text-sm rounded-md ${
                filterStatus === 'all' ? 'bg-cabin-dark text-white' : 'bg-gray-100'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => onFilterChange('active')}
              className={`px-3 py-1 text-sm rounded-md ${
                filterStatus === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100'
              }`}
            >
              Active
            </button>
            <button 
              onClick={() => onFilterChange('ending')}
              className={`px-3 py-1 text-sm rounded-md ${
                filterStatus === 'ending' ? 'bg-amber-600 text-white' : 'bg-gray-100'
              }`}
            >
              Ending Soon
            </button>
            <button 
              onClick={() => onFilterChange('expired')}
              className={`px-3 py-1 text-sm rounded-md ${
                filterStatus === 'expired' ? 'bg-red-600 text-white' : 'bg-gray-100'
              }`}
            >
              Expired
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">ID</th>
                <th className="text-left py-3 px-2">Customer</th>
                <th className="text-left py-3 px-2">Cabin & Seat</th>
                <th className="text-left py-3 px-2">Start Date</th>
                <th className="text-left py-3 px-2">Duration</th>
                <th className="text-left py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-b hover:bg-accent/10">
                  <td className="py-3 px-2">#{booking.id}</td>
                  <td className="py-3 px-2">
                    <div>
                      <div className="font-medium">{booking.customerName}</div>
                      <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div>
                      <div className="font-medium">{booking.cabinName}</div>
                      <div className="text-sm text-muted-foreground">Seat #{booking.seatNumber}</div>
                    </div>
                  </td>
                  <td className="py-3 px-2">{formatDate(booking.startDate)}</td>
                  <td className="py-3 px-2">{booking.months} {booking.months === 1 ? 'month' : 'months'}</td>
                  <td className="py-3 px-2">₹{booking.totalAmount}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      booking.status === 'active' ? 'bg-green-100 text-green-800' :
                      booking.status === 'ending' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex space-x-2">
                      <button 
                        className="text-xs px-2 py-1 bg-white border border-cabin-dark text-cabin-dark rounded hover:bg-cabin-dark/10 flex items-center gap-1"
                        onClick={() => handleViewDetails(booking)}
                      >
                        <FileSearch className="h-3 w-3" />
                        Details
                      </button>
                      <button className="text-xs px-2 py-1 bg-cabin-dark text-white rounded hover:bg-black flex items-center gap-1">
                        <CalendarCheck className="h-3 w-3" />
                        Extend
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredBookings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No bookings matching the selected filter
          </div>
        )}

        {/* Booking Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>Complete information about this subscription</DialogDescription>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Booking ID</h3>
                    <p>#{selectedBooking.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <span className={`px-2 py-1 text-xs rounded-full inline-block mt-1 ${
                      selectedBooking.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedBooking.status === 'ending' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Customer</h3>
                    <p className="font-medium">{selectedBooking.customerName}</p>
                    <p className="text-sm text-blue-600">{selectedBooking.customerEmail}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Reading Room</h3>
                    <p>{selectedBooking.cabinName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Seat Number</h3>
                    <p>#{selectedBooking.seatNumber}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
                    <p>{formatDate(selectedBooking.startDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                    <p>{calculateEndDate(selectedBooking.startDate, selectedBooking.months)}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
                    <p>{selectedBooking.months} {selectedBooking.months === 1 ? 'month' : 'months'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
                    <p className="font-medium">₹{selectedBooking.totalAmount}</p>
                  </div>
                  
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Payment Information</h3>
                    <p className="text-sm">Payment Method: Credit Card</p>
                    <p className="text-sm">Transaction ID: TXN{selectedBooking.id}2025</p>
                    <p className="text-sm">Payment Status: Completed</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
