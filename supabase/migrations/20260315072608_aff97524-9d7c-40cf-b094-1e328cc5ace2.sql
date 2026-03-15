-- Allow mess owners (and their employees) to SELECT their links
CREATE POLICY "Mess owner can view own links"
ON public.hostel_mess_links
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.mess_partners mp
    WHERE mp.id = hostel_mess_links.mess_id
      AND public.is_partner_or_employee_of(mp.user_id)
  )
);

-- Allow mess owners to read hostel names for linked hostels
CREATE POLICY "Linked mess owner can view hostel name"
ON public.hostels
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.hostel_mess_links hml
    JOIN public.mess_partners mp ON mp.id = hml.mess_id
    WHERE hml.hostel_id = hostels.id
      AND public.is_partner_or_employee_of(mp.user_id)
  )
);