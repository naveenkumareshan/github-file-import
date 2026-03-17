import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { KeyRound } from 'lucide-react';
import { attendanceService } from '@/api/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEffectiveOwnerId } from '@/utils/getEffectiveOwnerId';

interface PropertyOption {
  id: string;
  name: string;
  type: 'reading_room' | 'hostel';
}

const AttendancePinDisplay: React.FC = () => {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [pin, setPin] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Fetch properties on mount
  useEffect(() => {
    const fetchProperties = async () => {
      const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      let ownerId: string | undefined;
      if (!isAdmin && user?.id) {
        try {
          const res = await getEffectiveOwnerId();
          ownerId = res.ownerId;
        } catch {
          ownerId = user.id;
        }
      }

      const props: PropertyOption[] = [];

      let qCabins = supabase.from('cabins').select('id, name').eq('is_active', true);
      if (ownerId) qCabins = qCabins.eq('created_by', ownerId);
      const { data: cabins } = await qCabins;
      (cabins || []).forEach((c: any) => props.push({ id: c.id, name: c.name, type: 'reading_room' }));

      let qHostels = supabase.from('hostels').select('id, name').eq('is_active', true);
      if (ownerId) qHostels = qHostels.eq('created_by', ownerId);
      const { data: hostels } = await qHostels;
      (hostels || []).forEach((h: any) => props.push({ id: h.id, name: h.name, type: 'hostel' }));

      setProperties(props);
      if (props.length > 0) setSelectedPropertyId(props[0].id);
    };
    fetchProperties();
  }, [user]);

  const fetchPin = useCallback(async () => {
    if (!selectedPropertyId || !selectedProperty) return;
    setLoading(true);
    const result = await attendanceService.getAttendancePin(selectedPropertyId, selectedProperty.type);
    if (result) {
      setPin(result.pin);
      setSecondsRemaining(result.seconds_remaining);
    }
    setLoading(false);
  }, [selectedPropertyId, selectedProperty]);

  // Start/stop PIN refresh when popover opens/closes
  useEffect(() => {
    if (!open || !selectedPropertyId) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    fetchPin();
    intervalRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          fetchPin();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, selectedPropertyId, fetchPin]);

  if (properties.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <KeyRound className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline">Attendance PIN</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="end">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <KeyRound className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold">Attendance PIN</p>
            <p className="text-[10px] text-muted-foreground">For students with fee dues</p>
          </div>
        </div>

        <Select value={selectedPropertyId} onValueChange={(v) => { setSelectedPropertyId(v); setPin(null); }}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select Property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-xs">
                {p.name} ({p.type === 'reading_room' ? 'Room' : 'Hostel'})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-center space-y-2">
          {loading && !pin ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          ) : pin ? (
            <>
              <div className="flex justify-center gap-1.5">
                {pin.split('').map((d, i) => (
                  <div
                    key={i}
                    className="w-11 h-13 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-background flex items-center justify-center text-2xl font-bold font-mono"
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="relative w-7 h-7">
                  <svg className="w-7 h-7 -rotate-90" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/20" />
                    <circle
                      cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.5"
                      className="text-amber-500"
                      strokeDasharray={`${(secondsRemaining / 60) * 88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">
                    {secondsRemaining}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">Refreshes in {secondsRemaining}s</span>
              </div>
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AttendancePinDisplay;
