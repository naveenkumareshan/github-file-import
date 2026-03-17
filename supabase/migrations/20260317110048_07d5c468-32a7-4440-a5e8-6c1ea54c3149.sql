
-- Drop NOT NULL constraints on legacy columns
ALTER TABLE public.attendance_pins ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE public.attendance_pins ALTER COLUMN property_type DROP NOT NULL;

-- Ensure owner_id is NOT NULL and unique for universal PIN
ALTER TABLE public.attendance_pins ALTER COLUMN owner_id SET NOT NULL;

-- Add unique constraint on owner_id if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attendance_pins_owner_id_key'
  ) THEN
    ALTER TABLE public.attendance_pins ADD CONSTRAINT attendance_pins_owner_id_key UNIQUE (owner_id);
  END IF;
END $$;
