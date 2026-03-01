import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { hostelRoomService } from '@/api/hostelRoomService';
import { SharingBedManagement } from './SharingBedManagement';
import { RefreshCw, BedDouble, Users } from 'lucide-react';

interface SharingBedsListProps {
  roomId: string;
}

export const SharingBedsList: React.FC<SharingBedsListProps> = ({ roomId }) => {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const { toast } = useToast();

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const response = await hostelRoomService.getRoom(roomId) as any;
      
      if (response) {
        setRoom(response);
        
        // Set active tab to first sharing option
        const sharingOpts = response.hostel_sharing_options || response.sharingOptions || [];
        if (sharingOpts.length > 0 && !activeTab) {
          setActiveTab(sharingOpts[0].type);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to load room details",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error fetching room data:", error);
      toast({
        title: "Error",
        description: "Failed to load room details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [roomId]);

  const handleBedsAdded = () => {
    fetchRoomData();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  if (!room) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <h3 className="text-lg font-medium">Room not found</h3>
            <p className="text-muted-foreground">Unable to load room details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!room.sharingOptions || room.sharingOptions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <BedDouble className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Sharing Options</h3>
            <p className="text-muted-foreground mb-4">
              This room doesn't have any sharing options defined yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Sharing Beds Management</h2>
        <Button variant="outline" size="sm" onClick={fetchRoomData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Room {room.roomNumber} - {room.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {room.sharingOptions.map((option: any, index: number) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col items-center text-center">
                    <Users className="h-8 w-8 mb-2 text-primary" />
                    <h3 className="font-medium">{option.type}</h3>
                    <div className="text-sm text-muted-foreground mb-2">
                      {option.count} units × {option.capacity} beds
                    </div>
                    <Badge variant={
                      !option.available ? "destructive" :
                      option.available < option.count * option.capacity / 2 ? "outline" : 
                      "default"
                    }>
                      {option.available || 0} of {option.count * option.capacity} available
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* <TabsList className="mb-4">
              {room.sharingOptions.map((option: any, index: number) => (
                <TabsTrigger key={index} value={option.type}>
                  {option.type}
                </TabsTrigger>
              ))}
            </TabsList> */}
            
            {/* {room.sharingOptions.map((option: any, index: number) => (
              <TabsContent key={index} value={option.type}>
                <SharingBedManagement
                  roomId={roomId}
                  sharingOption={option}
                  onBedsAdded={handleBedsAdded}
                />
              </TabsContent>
            ))} */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
