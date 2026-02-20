
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface CabinData {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number;
  capacity?: number;
  amenities?: string[];
  imageSrc?: string;
  category?: 'standard' | 'premium' | 'luxury';
  isActive?: boolean;
  serialNumber?: string;
}

interface SeatBookingDetail {
  seatId: number;
  seatNumber: number;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  price?: number;
  startDate: string;
  endDate: string;
}

interface SeatDetailsDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  currentCabin: CabinData | null;
  seatBookings: SeatBookingDetail[];
  onExportData?: () => void;
}

export function SeatDetailsDialog({ 
  showDialog, 
  setShowDialog, 
  currentCabin, 
  seatBookings,
  onExportData 
}: SeatDetailsDialogProps) {
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Seat Booking Details - {currentCabin?.name}
            {currentCabin?.serialNumber && 
              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded ml-2">
                #{currentCabin?.serialNumber}
              </span>
            }
          </DialogTitle>
          <DialogDescription>
            View all seat bookings and availability for this reading room
          </DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seat #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {seatBookings.map((booking) => (
                <TableRow key={booking.seatId}>
                  <TableCell className="font-medium">{booking.seatNumber}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${booking.customerName === 'Available' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {booking.customerName === 'Available' ? 'Available' : 'Booked'}
                    </span>
                  </TableCell>
                  <TableCell>{booking.customerName === 'Available' ? '-' : booking.customerName}</TableCell>
                  <TableCell>
                    {booking.customerName !== 'Available' ? (
                      <div className="text-xs">
                        <div>{booking.customerPhone}</div>
                        <div className="text-blue-600">{booking.customerEmail}</div>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>₹{booking.price}</TableCell>
                  <TableCell>{booking.startDate || '-'}</TableCell>
                  <TableCell>{booking.endDate || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {onExportData && (
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={onExportData}>
              Export Data
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
