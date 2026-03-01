
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Home, Users, DollarSign } from 'lucide-react';
import { hostelRoomService, HostelRoomData } from '@/api/hostelRoomService';
import { useToast } from '@/hooks/use-toast';

export const HostelRoomsList = () => {
  const { hostelId } = useParams<{ hostelId: string }>();
  const [rooms, setRooms] = useState<HostelRoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<HostelRoomData | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, [hostelId]);

  const fetchRooms = async () => {
    if (!hostelId) return;
    
    try {
      setLoading(true);
      const response = await hostelRoomService.getHostelRooms(hostelId) as any;
      
      if (Array.isArray(response)) {
        setRooms(response as any || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load rooms",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setIsAddRoomOpen(true);
  };

  const handleEditRoom = (room: HostelRoomData) => {
    setSelectedRoom(room);
    setIsAddRoomOpen(true);
  };

  const handleRoomSuccess = () => {
    setIsAddRoomOpen(false);
    fetchRooms();
  };

  const handleViewDetails = (roomId: string) => {
    navigate(`/manager/hostels/${hostelId}/rooms/${roomId}`);
  };

  const calculateTotalBeds = (room: any) => {
    const options = room.sharingOptions || room.hostel_sharing_options || [];
    return options.reduce((total: number, option: any) => {
      return total + (option.capacity || 0) * (option.count || option.total_beds || 1);
    }, 0);
  };

  const calculateOccupancyRate = (room: any) => {
    const totalBeds = calculateTotalBeds(room);
    const options = room.sharingOptions || room.hostel_sharing_options || [];
    const availableBeds = options.reduce((total: number, option: any) => {
      return total + (option.available || 0);
    }, 0);
    
    if (totalBeds === 0) return 0;
    return Math.round(((totalBeds - availableBeds) / totalBeds) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Hostel Rooms</h2>
        <Button onClick={handleAddRoom} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Home className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium mb-2">No Rooms Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                You haven't added any rooms to this hostel. Start by adding your first room.
              </p>
              <Button onClick={handleAddRoom}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room: any) => (
            <Card key={room._id || room.id} className="overflow-hidden">
              {(room.imageSrc || room.image_url) && (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={room.imageSrc || room.image_url} 
                    alt={room.name || room.room_number} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{room.name || room.room_number}</CardTitle>
                    <CardDescription>Room #{room.roomNumber || room.room_number}, {room.floor} floor</CardDescription>
                  </div>
                  <Badge variant={(room.isActive ?? room.is_active) ? "default" : "outline"}>
                    {(room.isActive ?? room.is_active) ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                      <Home className="h-5 w-5 mb-1 text-primary" />
                      <span className="text-xs text-muted-foreground">Room Type</span>
                      <span className="font-medium text-sm">{room.category}</span>
                    </div>
                    
                    <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                      <Users className="h-5 w-5 mb-1 text-primary" />
                      <span className="text-xs text-muted-foreground">Beds</span>
                      <span className="font-medium text-sm">{calculateTotalBeds(room)}</span>
                    </div>
                    
                    <div className="flex flex-col items-center p-2 bg-muted rounded-md">
                      <DollarSign className="h-5 w-5 mb-1 text-primary" />
                      <span className="text-xs text-muted-foreground">Base Price</span>
                      <span className="font-medium text-sm">₹{room.basePrice || 0}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Occupancy</span>
                      <span>{calculateOccupancyRate(room)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${calculateOccupancyRate(room)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleViewDetails(room._id || room.id || '')}
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditRoom(room)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Room Form Dialog would go here */}
      <Dialog open={isAddRoomOpen} onOpenChange={setIsAddRoomOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          </DialogHeader>
          {/* We'll implement the room form in another component */}
          <p className="py-4">Room form will be implemented here</p>
          <Button onClick={handleRoomSuccess}>Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
