
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SplashOverlay = () => {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [logo, setLogo] = useState('/splash-logo.png');
  const [name, setName] = useState('InhaleStays');
  const [tagline, setTagline] = useState('Reading Room Booking');

  useEffect(() => {
    // Fetch branding from DB
    (async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('key, value')
          .in('key', ['site_name', 'site_logo', 'site_tagline']);
        if (data) {
          for (const row of data) {
            const v = row.value as any;
            switch (row.key) {
              case 'site_name': if (v?.value) setName(v.value); break;
              case 'site_logo': if (v?.url) setLogo(v.url); break;
              case 'site_tagline': if (v?.value) setTagline(v.value); break;
            }
          }
        }
      } catch {
        // Use defaults on error
      }
    })();

    const timer = setTimeout(() => setFadeOut(true), 1500);
    const removeTimer = setTimeout(() => setVisible(false), 2100);
    return () => { clearTimeout(timer); clearTimeout(removeTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#0f172a',
        transition: 'opacity 0.6s ease-out',
        opacity: fadeOut ? 0 : 1,
        pointerEvents: fadeOut ? 'none' : 'auto',
      }}
    >
      <img
        src={logo}
        alt={name}
        className="w-28 h-28 mb-6 rounded-2xl shadow-2xl object-contain"
      />
      <h1 className="text-3xl font-bold text-white tracking-wide mb-1">
        {name}
      </h1>
      <p className="text-sm text-slate-400 tracking-widest uppercase">
        {tagline}
      </p>
      <div className="mt-10">
        <div className="w-8 h-8 border-3 border-slate-600 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
};

export default SplashOverlay;
