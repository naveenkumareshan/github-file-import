import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { attendanceService } from '@/api/attendanceService';

interface PropertyOption {
  id: string;
  name: string;
  type: 'reading_room' | 'hostel';
}

interface AttendancePinDisplayProps {
  properties: PropertyOption[];
}

const AttendancePinDisplay: React.FC<AttendancePinDisplayProps> = ({ properties }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [pin, setPin] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

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

  useEffect(() => {
    if (!showPin || !selectedPropertyId) return;
    fetchPin();
    // Countdown timer
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
  }, [showPin, selectedPropertyId, fetchPin]);

  const handleToggle = () => {
    if (!selectedPropertyId && properties.length > 0) {
      setSelectedPropertyId(properties[0].id);
    }
    setShowPin(!showPin);
  };

  if (properties.length === 0) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold">Attendance PIN</p>
              <p className="text-[10px] text-muted-foreground">For students with fee dues</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={handleToggle}
          >
            {showPin ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPin ? 'Hide' : 'Show'}
          </Button>
        </div>

        {showPin && (
          <>
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

            {selectedPropertyId && (
              <div className="text-center space-y-2">
                {loading && !pin ? (
                  <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                ) : pin ? (
                  <>
                    <div className="flex justify-center gap-2">
                      {pin.split('').map((d, i) => (
                        <div
                          key={i}
                          className="w-12 h-14 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-background flex items-center justify-center text-2xl font-bold font-mono"
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="relative w-8 h-8">
                        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
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
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendancePinDisplay;
