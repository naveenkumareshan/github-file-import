
-- 1. Seat block history table
CREATE TABLE public.seat_block_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_id uuid NOT NULL REFERENCES public.seats(id) ON DELETE CASCADE,
  action text NOT NULL,
  reason text NOT NULL DEFAULT '',
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seat_block_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage block history" ON public.seat_block_history
FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can manage block history" ON public.seat_block_history
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM seats s JOIN cabins c ON s.cabin_id = c.id
  WHERE s.id = seat_block_history.seat_id AND c.created_by = auth.uid()
));

-- 2. Locker columns on bookings
ALTER TABLE public.bookings ADD COLUMN locker_included boolean NOT NULL DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN locker_price numeric NOT NULL DEFAULT 0;
