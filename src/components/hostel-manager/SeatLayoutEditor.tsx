
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { adminCabinsService } from '@/api/adminCabinsService';
import { adminSeatsService } from '@/api/adminSeatsService';
import { SeatMapEditor } from '@/components/seats/SeatMapEditor';

interface SeatLayoutEditorProps {
  cabinId: string;
  onSaved?: () => void;
}

interface RoomElement {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  rotation?: number;
}

export function SeatLayoutEditor({ cabinId, onSaved }: SeatLayoutEditorProps) {
  const [roomElements, setRoomElements] = useState<RoomElement[]>([]);
  const [seats, setSeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);

  useEffect(() => {
    if (cabinId) {
      fetchCabinData();
    }
  }, [cabinId]);

  const fetchCabinData = async () => {
    try {
      setLoading(true);
      // Fetch cabin details including room elements
      const cabinResponse = await adminCabinsService.getCabinById(cabinId);
      
      if (cabinResponse.success && cabinResponse.data) {
        setRoomElements(cabinResponse.data.roomElements || []);
      }
      
      // Fetch seats for this cabin
      const seatsResponse = await adminSeatsService.getSeatsByCabin(cabinId, 1);
      
      if (seatsResponse.success) {
        setSeats(seatsResponse.data || []);
      }
      
    } catch (error) {
      console.error('Error fetching cabin data:', error);
      toast({
        title: "Error",
        description: "Failed to load cabin layout data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (seat: any) => {
    setSelectedSeat(seat);
  };

  const handleSaveLayout = async (newRoomElements: RoomElement[], newSeats: any[]) => {
    try {
      setSaving(true);
      
      // 1. Save room elements
      if (newRoomElements && newRoomElements.length > 0) {
        const roomLayoutResponse = await adminCabinsService.updateCabinLayout(cabinId, newRoomElements);
        if (!roomLayoutResponse.success) {
          throw new Error('Failed to update room layout');
        }
      }
      
      // 2. Update seat positions if seats have changed
      if (newSeats && newSeats.length > 0) {
        const seatPositions = newSeats.map(seat => ({
          _id: seat._id,
          position: seat.position
        }));
        
        const seatsResponse = await adminSeatsService.updateSeatPositions(seatPositions);
        if (!seatsResponse.success) {
          throw new Error('Failed to update seat positions');
        }
      }
      
      toast({
        title: "Layout saved",
        description: "The seat layout has been updated successfully"
      });
      
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      toast({
        title: "Error",
        description: "Failed to save seat layout",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Seat Layout</CardTitle>
      </CardHeader>
      <CardContent>
        <SeatMapEditor
          seats={seats}
          selectedSeat={selectedSeat}
          onSeatSelect={handleSeatSelect}
          isAdmin={true}
          readOnly={false}
          roomElements={roomElements}
          initialRoomElements={roomElements}
          initialSeats={seats}
          onSave={handleSaveLayout}
          isSaving={saving}
          cabinId={cabinId}
        />
      </CardContent>
    </Card>
  );
}
