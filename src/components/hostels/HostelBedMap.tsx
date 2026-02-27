
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HostelFloorView } from './HostelFloorView';
import { Layers } from 'lucide-react';

interface HostelBedMapProps {
  hostelId: string;
  selectedBedId?: string | null;
  onBedSelect?: (bed: any) => void;
  readOnly?: boolean;
  sharingFilter?: string;
  categoryFilter?: string;
  startDate?: string;
  endDate?: string;
}

export const HostelBedMap: React.FC<HostelBedMapProps> = ({
  hostelId,
  selectedBedId,
  onBedSelect,
  readOnly = true,
  sharingFilter,
  categoryFilter,
  startDate,
  endDate,
}) => {
  const [loading, setLoading] = useState(true);
  const [floorData, setFloorData] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: rooms } = await supabase
          .from('hostel_rooms')
          .select('id, room_number, floor, category')
          .eq('hostel_id', hostelId)
          .eq('is_active', true)
          .order('floor')
          .order('room_number');

        if (!rooms?.length) {
          setFloorData({});
          setLoading(false);
          return;
        }

        const roomIds = rooms.map(r => r.id);

        const { data: beds } = await supabase
          .from('hostel_beds')
          .select('*, hostel_sharing_options(type, price_monthly)')
          .in('room_id', roomIds)
          .order('bed_number');

        // Date-aware booking overlap query
        let bookingQuery = supabase
          .from('hostel_bookings')
          .select('bed_id, profiles:user_id(name)')
          .eq('hostel_id', hostelId)
          .in('status', ['confirmed', 'pending']);

        if (startDate && endDate) {
          bookingQuery = bookingQuery
            .lte('start_date', endDate)
            .gte('end_date', startDate);
        }

        const { data: bookings } = await bookingQuery;

        const bookingMap = new Map<string, string>();
        bookings?.forEach((b: any) => {
          bookingMap.set(b.bed_id, b.profiles?.name || 'Occupied');
        });

        const grouped: Record<number, any[]> = {};
        rooms.forEach(room => {
          const floor = room.floor;
          if (!grouped[floor]) grouped[floor] = [];

          const roomBeds = (beds || [])
            .filter(b => b.room_id === room.id)
            .map(b => ({
              id: b.id,
              bed_number: b.bed_number,
              is_available: b.is_available,
              is_blocked: b.is_blocked,
              room_id: b.room_id,
              sharing_option_id: b.sharing_option_id,
              sharingType: (b as any).hostel_sharing_options?.type || '',
              price: (b as any).hostel_sharing_options?.price_monthly || 0,
              category: (b as any).category || null,
              price_override: (b as any).price_override || null,
              occupantName: bookingMap.get(b.id) || undefined,
            }));

          grouped[floor].push({
            roomId: room.id,
            roomNumber: room.room_number,
            category: room.category,
            beds: roomBeds,
          });
        });

        setFloorData(grouped);
      } catch (error) {
        console.error('Error fetching bed map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hostelId, startDate, endDate]);

  const floors = Object.keys(floorData).map(Number).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (floors.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Layers className="h-10 w-10 mx-auto mb-2 opacity-50" />
        <p>No rooms or beds configured yet</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultValue={String(floors[0])}>
        <TabsList className="mb-4">
          {floors.map(floor => (
            <TabsTrigger key={floor} value={String(floor)} className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              Floor {floor}
            </TabsTrigger>
          ))}
        </TabsList>

        {floors.map(floor => (
          <TabsContent key={floor} value={String(floor)}>
            <HostelFloorView
              floorNumber={floor}
              rooms={floorData[floor]}
              selectedBedId={selectedBedId}
              onBedSelect={onBedSelect}
              readOnly={readOnly}
              sharingFilter={sharingFilter}
              categoryFilter={categoryFilter}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[11px] mt-4 pt-3 border-t">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border border-emerald-400 bg-emerald-50" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border border-blue-400 bg-blue-50" />
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border border-destructive/30 bg-destructive/10" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded border border-primary bg-primary" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  );
};
