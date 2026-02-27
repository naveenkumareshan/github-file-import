
import React, { useState } from 'react';
import { HostelBedsDisplay } from './HostelBedsDisplay';
import { HostelBedManagement } from './HostelBedManagement';
import { SharingBedsList } from './SharingBedsList';
import { HostelBedMap } from './HostelBedMap';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BedDouble, UsersRound, MapPin } from 'lucide-react';

interface RoomBedManagementProps {
  hostelId: string;
  roomId: string;
  roomNumber: string;
  floor: string;
}

export const RoomBedManagement: React.FC<RoomBedManagementProps> = ({
  hostelId,
  roomId,
  roomNumber,
  floor
}) => {
  const [activeTab, setActiveTab] = useState('map');
  const { toast } = useToast();
  
  const handleBedsAdded = () => {
    toast({
      title: "Beds added successfully",
      description: "The beds have been added to this room",
    });
    setActiveTab('view');
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Bed Map
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            View Beds
          </TabsTrigger>
          <TabsTrigger value="sharing" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" />
            Sharing Beds
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="pt-4">
          <HostelBedMap hostelId={hostelId} readOnly />
        </TabsContent>
        
        <TabsContent value="view" className="pt-4">
          <HostelBedsDisplay 
            hostelId={hostelId}
            roomId={roomId}
            roomName={`Room ${roomNumber} (${floor} Floor)`}
          />
        </TabsContent>
        
        <TabsContent value="sharing" className="pt-4">
          <SharingBedsList roomId={roomId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
