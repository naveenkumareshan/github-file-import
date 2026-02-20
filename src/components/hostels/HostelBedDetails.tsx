
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminHostelBedService, HostelBedData } from '@/api/hostelBedService';
import { useToast } from '@/hooks/use-toast';
import { Bed, User, Clock, Banknote, CheckSquare } from 'lucide-react';

interface HostelBedDetailsProps {
  bedId: string;
  onStatusChange?: () => void;
}

export const HostelBedDetails: React.FC<HostelBedDetailsProps> = ({ 
  bedId,
  onStatusChange 
}) => {
  const [bed, setBed] = useState<HostelBedData | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBedDetails();
  }, [bedId]);

  const fetchBedDetails = async () => {
    try {
      setLoading(true);
      const response = await adminHostelBedService.getBed(bedId);
      
      if (response.success) {
        setBed(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load bed details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching bed details:', error);
      toast({
        title: "Error",
        description: "Failed to load bed details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await adminHostelBedService.getBedBookings(bedId);
      
      if (response.success) {
        setBookings(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load booking history",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching bed bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load booking history",
        variant: "destructive"
      });
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    if (!bed) return;
    
    try {
      setIsUpdating(true);
      const newStatus = !bed.isAvailable;
      
      const response = await adminHostelBedService.changeBedStatus(bedId, newStatus);
      
      if (response.success) {
        setBed({
          ...bed,
          isAvailable: newStatus
        });
        
        toast({
          title: "Bed status updated",
          description: `Bed is now ${newStatus ? 'available' : 'unavailable'}`
        });
        
        if (onStatusChange) onStatusChange();
      } else {
        toast({
          title: "Error",
          description: "Failed to update bed status",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating bed status:', error);
      toast({
        title: "Error",
        description: "Failed to update bed status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!bed) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-center text-muted-foreground">Bed not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bed className="h-5 w-5" />
            <span>Bed #{bed.number}</span>
          </div>
          <Badge className={bed.isAvailable ? "bg-green-500" : "bg-red-500"}>
            {bed.status || (bed.isAvailable ? 'Available' : 'Unavailable')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="bookings" onClick={fetchBookings}>Booking History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Room Number:</div>
              <div>{bed.roomNumber}</div>
              
              <div className="text-muted-foreground">Floor:</div>
              <div>{bed.floor}</div>
              
              <div className="text-muted-foreground">Bed Type:</div>
              <div className="capitalize">{bed.bedType}</div>
              
              <div className="text-muted-foreground">Sharing Type:</div>
              <div>{bed.sharingType}</div>
              
              <div className="text-muted-foreground">Price:</div>
              <div>₹{bed.price}/day</div>
              
              {bed.amenities && bed.amenities.length > 0 && (
                <>
                  <div className="text-muted-foreground">Amenities:</div>
                  <div>
                    {bed.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline" className="mr-1 mb-1">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button 
                variant={bed.isAvailable ? "destructive" : "default"}
                onClick={handleToggleAvailability}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : (
                  <CheckSquare className="h-4 w-4 mr-2" />
                )}
                {bed.isAvailable ? "Mark as Unavailable" : "Mark as Available"}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="bookings">
            {bookingsLoading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No booking history found for this bed
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <Card key={booking._id} className="bg-muted/40">
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{booking.userId?.name || 'Unknown User'}</span>
                        </div>
                        <Badge className={
                          booking.status === 'completed' ? 'bg-green-500' : 
                          booking.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          From:
                        </div>
                        <div>{new Date(booking.startDate).toLocaleDateString()}</div>
                        
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          To:
                        </div>
                        <div>{new Date(booking.endDate).toLocaleDateString()}</div>
                        
                        <div className="flex items-center text-muted-foreground">
                          <Banknote className="h-3 w-3 mr-1" />
                          Amount:
                        </div>
                        <div>₹{booking.totalPrice}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
