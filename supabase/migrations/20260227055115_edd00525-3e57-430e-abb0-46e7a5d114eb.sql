
-- Migration 4: Slot overlap prevention trigger

CREATE OR REPLACE FUNCTION public.validate_slot_no_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.cabin_slots
    WHERE cabin_id = NEW.cabin_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND is_active = true
      AND NEW.start_time < end_time
      AND NEW.end_time > start_time
  ) THEN
    RAISE EXCEPTION 'Slot time range overlaps with an existing active slot in this reading room';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_slot_no_overlap
BEFORE INSERT OR UPDATE ON public.cabin_slots
FOR EACH ROW
EXECUTE FUNCTION public.validate_slot_no_overlap();
