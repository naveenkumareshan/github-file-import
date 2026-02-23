import { useState, useEffect, useRef } from 'react';

export function useLoadingTimeout(isLoading: boolean, timeoutMs = 5000) {
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isLoading) {
      setTimedOut(false);
      timerRef.current = setTimeout(() => setTimedOut(true), timeoutMs);
    } else {
      setTimedOut(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isLoading, timeoutMs]);

  return timedOut;
}
