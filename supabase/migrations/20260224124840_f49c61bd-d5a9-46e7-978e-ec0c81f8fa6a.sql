CREATE OR REPLACE FUNCTION public.generate_serial_number(p_entity_type text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_year integer := EXTRACT(YEAR FROM now())::integer;
  v_seq integer;
BEGIN
  INSERT INTO public.serial_counters (entity_type, year, current_seq)
  VALUES (p_entity_type, v_year, 1)
  ON CONFLICT (entity_type, year)
  DO UPDATE SET current_seq = serial_counters.current_seq + 1
  RETURNING current_seq INTO v_seq;

  RETURN 'IS-' || p_entity_type || '-' || v_year::text || '-' || lpad(v_seq::text, 5, '0');
END;
$function$;