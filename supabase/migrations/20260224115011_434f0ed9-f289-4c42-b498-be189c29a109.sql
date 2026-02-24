
-- Allow vendors to view bookings for seats in cabins they own
CREATE POLICY "Vendors can view bookings for own cabins"
ON public.bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.seats s
    JOIN public.cabins c ON s.cabin_id = c.id
    WHERE s.id = bookings.seat_id
    AND c.created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.cabins c
    WHERE c.id = bookings.cabin_id
    AND c.created_by = auth.uid()
  )
);

-- Allow vendors to insert bookings (partner-initiated bookings)
CREATE POLICY "Vendors can insert bookings for own cabins"
ON public.bookings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.cabins c
    WHERE c.id = bookings.cabin_id
    AND c.created_by = auth.uid()
  )
);

-- Allow vendors to search student profiles
CREATE POLICY "Vendors can view student profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'vendor'::app_role) OR has_role(auth.uid(), 'vendor_employee'::app_role)
);
