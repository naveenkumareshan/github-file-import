
import React, { useState, useEffect } from 'react';
import { adminHostelBedService } from '@/api/hostelBedService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HostelRoomMap, HostelBed } from '@/components/hostels/HostelRoomMap';
import { Badge } from '@/components/ui/badge';

interface HostelBedsDisplayProps {
  hostelId: string;
  roomId: string;
  roomName: string;
}

export const HostelBedsDisplay: React.FC<HostelBedsDisplayProps> = ({
  hostelId,
  roomId,
  roomName
}) => {
  const [beds, setBeds] = useState<HostelBed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBed, setSelectedBed] = useState<HostelBed | null>(null);
  
  useEffect(() => {
    const fetchBeds = async () => {
      try {
        setLoading(true);
        const response = await adminHostelBedService.getRoomBeds(roomId);
        if (response.success) {
          setBeds(response.data);
        } else {
          setError('Failed to load beds');
        }
      } catch (err) {
        console.error('Error fetching beds:', err);
        setError('An error occurred while fetching beds');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBeds();
  }, [roomId]);
  
  const handleBedSelect = (bed: HostelBed) => {
    setSelectedBed(bed === selectedBed ? null : bed);
  };
  
  // Count available and total beds
  const availableBeds = beds.filter(bed => bed.isAvailable).length;
  const totalBeds = beds.length;
  
  // Default room data with sample elements
  const roomData = {
    roomElements: [
      {
        id: 'door-1',
        type: 'door' as const,
        position: { x: 240, y: 50 },
        rotation: 0
      },
      {
        id: 'window-1',
        type: 'window' as const,
        position: { x: 400, y: 50 },
        rotation: 0
      },
      {
        id: 'bath-1',
        type: 'bath' as const,
        position: { x: 50, y: 50 },
        rotation: 0
      },
      {
        id: 'ac-1',
        type: 'AC' as const,
        position: { x: 600, y: 50 },
        rotation: 0
      }
    ]
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{roomName}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{availableBeds} of {totalBeds} beds available</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="h-[400px] flex items-center justify-center">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            <HostelRoomMap 
              roomData={roomData}
              beds={beds}
              selectedBed={selectedBed}
              onBedSelect={handleBedSelect}
              readOnly={true}
            />
            
            {selectedBed && (
              <div className="mt-4 p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">Bed #{selectedBed.number} Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Price:</div>
                  <div>₹{selectedBed.price}/month</div>
                  <div>Bed Type:</div>
                  <div className="capitalize">{selectedBed.bedType}</div>
                  <div>Sharing:</div>
                  <div className="capitalize">{selectedBed.sharingType}</div>
                  <div>Status:</div>
                  <div>{selectedBed.isAvailable ? 'Available' : 'Occupied'}</div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
