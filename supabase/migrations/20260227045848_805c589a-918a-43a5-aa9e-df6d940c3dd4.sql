
-- Add is_24_hours and slots_enabled to cabins
ALTER TABLE public.cabins
  ADD COLUMN is_24_hours boolean NOT NULL DEFAULT false,
  ADD COLUMN slots_enabled boolean NOT NULL DEFAULT false;

-- Create cabin_slots table
CREATE TABLE public.cabin_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cabin_slots ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage cabin slots"
  ON public.cabin_slots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Partners full access on own cabin slots
CREATE POLICY "Partners can manage own cabin slots"
  ON public.cabin_slots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.cabins c
    WHERE c.id = cabin_slots.cabin_id AND c.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cabins c
    WHERE c.id = cabin_slots.cabin_id AND c.created_by = auth.uid()
  ));

-- Anyone can view active slots
CREATE POLICY "Anyone can view active slots"
  ON public.cabin_slots FOR SELECT
  USING (is_active = true);

-- Add slot_id to bookings
ALTER TABLE public.bookings
  ADD COLUMN slot_id uuid REFERENCES public.cabin_slots(id);
