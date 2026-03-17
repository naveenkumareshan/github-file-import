import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { KeyRound, RefreshCw } from 'lucide-react';
import { attendanceService } from '@/api/attendanceService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getEffectiveOwnerId } from '@/utils/getEffectiveOwnerId';

const AttendancePinDisplay: React.FC = () => {
  const { user } = useAuth();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [propertyNames, setPropertyNames] = useState<string[]>([]);
  const [pin, setPin] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Resolve ownerId, check permissions, fetch property names
  useEffect(() => {
    const init = async () => {
      if (!user?.id) return;

      const isAdmin = user.role === 'admin' || user.role === 'super_admin';
      let resolvedOwnerId: string;

      if (isAdmin) {
        resolvedOwnerId = user.id;
      } else {
        try {
          const res = await getEffectiveOwnerId();
          resolvedOwnerId = res.ownerId;

          if (res.userId !== res.ownerId) {
            const { data: emp } = await supabase
              .from('vendor_employees')
              .select('permissions, allowed_properties')
              .eq('employee_user_id', res.userId)
              .eq('status', 'active')
              .maybeSingle();

            if (emp) {
              const perms = emp.permissions as string[] || [];
              if (!perms.includes('manage_attendance')) {
                setHasPermission(false);
                return;
              }
            }
          }
        } catch {
          resolvedOwnerId = user.id;
        }
      }

      setOwnerId(resolvedOwnerId);

      // Fetch property names for display
      const names: string[] = [];
      const [cabinsRes, hostelsRes, messRes] = await Promise.all([
        supabase.from('cabins').select('name').eq('created_by', resolvedOwnerId).eq('is_active', true),
        supabase.from('hostels').select('name').eq('created_by', resolvedOwnerId).eq('is_active', true),
        supabase.from('mess_partners').select('name').eq('user_id', resolvedOwnerId).eq('is_active', true),
      ]);
      (cabinsRes.data || []).forEach((c: any) => names.push(c.name));
      (hostelsRes.data || []).forEach((h: any) => names.push(h.name));
      (messRes.data || []).forEach((m: any) => names.push(m.name));

      setPropertyNames(names);
    };
    init();
  }, [user]);

  const fetchPin = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await attendanceService.getAttendancePin(ownerId);
      if (result) {
        setPin(result.pin);
        setSecondsRemaining(result.seconds_remaining);
      } else {
        setError('Could not load PIN');
      }
    } catch {
      setError('Could not load PIN');
    }
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    if (!open || !ownerId) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPin(null);
      setError(null);
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
  }, [open, ownerId, fetchPin]);

  if (!hasPermission) return null;

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
            <p className="text-xs font-semibold">Universal Attendance PIN</p>
            <p className="text-[10px] text-muted-foreground">For students with fee dues</p>
          </div>
        </div>

        {propertyNames.length > 0 && (
          <div className="text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5">
            <span className="font-medium">Applies to:</span>{' '}
            {propertyNames.length <= 3
              ? propertyNames.join(', ')
              : `${propertyNames.slice(0, 2).join(', ')} +${propertyNames.length - 2} more`}
          </div>
        )}

        <div className="text-center space-y-2">
          {loading && !pin ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          ) : error ? (
            <div className="space-y-2">
              <p className="text-xs text-destructive">{error}</p>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={fetchPin}>
                <RefreshCw className="h-3 w-3" /> Retry
              </Button>
            </div>
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
