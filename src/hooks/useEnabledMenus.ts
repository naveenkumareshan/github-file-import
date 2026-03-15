import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnabledMenus {
  bookings: boolean;
  hostel: boolean;
  laundry: boolean;
  roomSharing: boolean;
  about: boolean;
  mess: boolean;
  complaints: boolean;
  attendance: boolean;
  support: boolean;
  laundryOrders: boolean;
}

const DEFAULT_MENUS: EnabledMenus = {
  bookings: true,
  hostel: true,
  laundry: true,
  roomSharing: true,
  about: true,
  mess: true,
  complaints: true,
  attendance: true,
  support: true,
  laundryOrders: true,
};

export function useEnabledMenus() {
  const [enabledMenus, setEnabledMenus] = useState<EnabledMenus>(DEFAULT_MENUS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check sessionStorage cache first
    const cached = sessionStorage.getItem('enabled_menus_cache');
    if (cached) {
      try {
        setEnabledMenus(prev => ({ ...prev, ...JSON.parse(cached) }));
      } catch {}
    }

    (async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'enabled_menus')
        .maybeSingle();

      if (data?.value && typeof data.value === 'object') {
        const merged = { ...DEFAULT_MENUS, ...(data.value as any) };
        setEnabledMenus(merged);
        sessionStorage.setItem('enabled_menus_cache', JSON.stringify(merged));
      }
      setLoading(false);
    })();
  }, []);

  return { enabledMenus, loading };
}
