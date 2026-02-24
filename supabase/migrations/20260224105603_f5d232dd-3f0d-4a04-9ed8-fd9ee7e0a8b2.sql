
-- Fix overly permissive RLS on serial_counters - this table should only be accessed by triggers (SECURITY DEFINER functions)
DROP POLICY "Service role only" ON public.serial_counters;
-- No user-facing policy needed since generate_serial_number runs as SECURITY DEFINER implicitly via triggers
-- But we need at least a restrictive policy
CREATE POLICY "No direct access" ON public.serial_counters FOR ALL USING (false);
