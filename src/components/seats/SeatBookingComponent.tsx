
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeatBookingForm } from './SeatBookingForm';
import { adminBookingsService } from '@/api/adminBookingsService';
import { useToast } from '@/hooks/use-toast';

interface SeatBookingComponentProps {
  cabinId?: string;
}

export const SeatBookingComponent: React.FC<SeatBookingComponentProps> = ({ cabinId }) => {
  const [availableSeats, setAvailableSeats] = useState<{
    id: string;
    seatNumber: string;
    isOccupied: boolean;
    price?: number;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [cabinData, setCabinData] = useState<any>(null);

  useEffect(() => {
    if (cabinId) {
      fetchOccupancyData();
    }
  }, [cabinId]);

  const fetchOccupancyData = async () => {
    setLoading(true);
    try {
      // Get occupancy data for this cabin
      const response = await adminBookingsService.getOccupancyReports({
        cabinId,
        timeframe: 'daily'
      });
      
      if (response.success && response.data) {
        // Transform the occupancy data into available seats
        const rData = response.data as any;
        const seats = rData?.seats || [];
        setAvailableSeats(seats.map((seat: any) => ({
          id: seat._id || seat.id,
          seatNumber: seat.number || seat.seatNumber,
          isOccupied: !seat.isAvailable,
          price: seat.price
        })));
        
        // Set cabin data if available in the response
        if (rData?.cabin) {
          setCabinData(rData.cabin);
        }
      } else {
        // If the API fails, use fallback mock data
        setAvailableSeats([
          { id: '1', seatNumber: 'A1', isOccupied: false, price: 1500 },
          { id: '2', seatNumber: 'A2', isOccupied: true, price: 1500 },
          { id: '3', seatNumber: 'B1', isOccupied: false, price: 1500 },
          { id: '4', seatNumber: 'B2', isOccupied: false, price: 1500 }
        ]);
      }
    } catch (error) {
      console.error('Error fetching occupancy data:', error);
      toast({
        title: 'Error',
        description: 'Could not load seat availability data',
        variant: 'destructive'
      });
      
      // Use fallback data in case of error
      setAvailableSeats([
        { id: '1', seatNumber: 'A1', isOccupied: false, price: 1500 },
        { id: '2', seatNumber: 'A2', isOccupied: true, price: 1500 },
        { id: '3', seatNumber: 'B1', isOccupied: false, price: 1500 },
        { id: '4', seatNumber: 'B2', isOccupied: false, price: 1500 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Prepare cabin object for the SeatBookingForm component
  const cabin = cabinData || (cabinId ? {
    id: cabinId,
    _id: cabinId,
    name: "Reading Room",
    description: "A cozy reading space",
    price: 1500,
    capacity: 4,
    amenities: [],
    floors:[],
    imageUrl: "",
    category: "standard" as const
  } : null);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Book Your Seat</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <SeatBookingForm 
            cabin={cabin}
            availableSeats={availableSeats} 
          />
        )}
      </CardContent>
    </Card>
  );
};
