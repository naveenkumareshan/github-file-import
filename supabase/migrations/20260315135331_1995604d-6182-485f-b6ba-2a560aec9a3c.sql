
-- 1. Add laundry_id to complaints
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS laundry_id UUID REFERENCES public.laundry_partners(id) ON DELETE SET NULL;

-- 2. Add resolved_at to complaints
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 3. Trigger to auto-set resolved_at
CREATE OR REPLACE FUNCTION public.set_complaint_resolved_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IN ('resolved', 'closed') AND (OLD.status IS NULL OR OLD.status NOT IN ('resolved', 'closed')) THEN
    NEW.resolved_at := now();
  ELSIF NEW.status NOT IN ('resolved', 'closed') AND OLD.status IN ('resolved', 'closed') THEN
    NEW.resolved_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_complaint_resolved_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.set_complaint_resolved_at();

-- 4. Update RLS policies to include laundry
-- Drop old policies that don't include laundry or mess
DROP POLICY IF EXISTS "Employees can view employer complaints" ON public.complaints;
DROP POLICY IF EXISTS "Employees can update employer complaints" ON public.complaints;
DROP POLICY IF EXISTS "Vendors can view complaints for own properties" ON public.complaints;
DROP POLICY IF EXISTS "Vendors can update complaints for own properties" ON public.complaints;

-- Update the comprehensive vendor policies to include laundry
DROP POLICY IF EXISTS "Vendors can view own property complaints" ON public.complaints;
DROP POLICY IF EXISTS "Vendors can update own property complaints" ON public.complaints;

CREATE POLICY "Vendors can view own property complaints" ON public.complaints
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM cabins cab WHERE cab.id = complaints.cabin_id AND is_partner_or_employee_of(cab.created_by))
    OR EXISTS (SELECT 1 FROM hostels h WHERE h.id = complaints.hostel_id AND is_partner_or_employee_of(h.created_by))
    OR EXISTS (SELECT 1 FROM mess_partners mp WHERE mp.id = complaints.mess_id AND is_partner_or_employee_of(mp.user_id))
    OR EXISTS (SELECT 1 FROM laundry_partners lp WHERE lp.id = complaints.laundry_id AND is_partner_or_employee_of(lp.user_id))
  );

CREATE POLICY "Vendors can update own property complaints" ON public.complaints
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM cabins cab WHERE cab.id = complaints.cabin_id AND is_partner_or_employee_of(cab.created_by))
    OR EXISTS (SELECT 1 FROM hostels h WHERE h.id = complaints.hostel_id AND is_partner_or_employee_of(h.created_by))
    OR EXISTS (SELECT 1 FROM mess_partners mp WHERE mp.id = complaints.mess_id AND is_partner_or_employee_of(mp.user_id))
    OR EXISTS (SELECT 1 FROM laundry_partners lp WHERE lp.id = complaints.laundry_id AND is_partner_or_employee_of(lp.user_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM cabins cab WHERE cab.id = complaints.cabin_id AND is_partner_or_employee_of(cab.created_by))
    OR EXISTS (SELECT 1 FROM hostels h WHERE h.id = complaints.hostel_id AND is_partner_or_employee_of(h.created_by))
    OR EXISTS (SELECT 1 FROM mess_partners mp WHERE mp.id = complaints.mess_id AND is_partner_or_employee_of(mp.user_id))
    OR EXISTS (SELECT 1 FROM laundry_partners lp WHERE lp.id = complaints.laundry_id AND is_partner_or_employee_of(lp.user_id))
  );

-- 5. Update ticket_messages vendor policies to include laundry
DROP POLICY IF EXISTS "Vendors can view messages on own property complaints" ON public.ticket_messages;
DROP POLICY IF EXISTS "Vendors can insert messages on own property complaints" ON public.ticket_messages;

CREATE POLICY "Vendors can view messages on own property complaints" ON public.ticket_messages
  FOR SELECT TO authenticated
  USING (
    ticket_type = 'complaint' AND EXISTS (
      SELECT 1 FROM complaints c WHERE c.id = ticket_messages.ticket_id AND (
        EXISTS (SELECT 1 FROM cabins cab WHERE cab.id = c.cabin_id AND is_partner_or_employee_of(cab.created_by))
        OR EXISTS (SELECT 1 FROM hostels h WHERE h.id = c.hostel_id AND is_partner_or_employee_of(h.created_by))
        OR EXISTS (SELECT 1 FROM mess_partners mp WHERE mp.id = c.mess_id AND is_partner_or_employee_of(mp.user_id))
        OR EXISTS (SELECT 1 FROM laundry_partners lp WHERE lp.id = c.laundry_id AND is_partner_or_employee_of(lp.user_id))
      )
    )
  );

CREATE POLICY "Vendors can insert messages on own property complaints" ON public.ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND ticket_type = 'complaint' AND EXISTS (
      SELECT 1 FROM complaints c WHERE c.id = ticket_messages.ticket_id AND (
        EXISTS (SELECT 1 FROM cabins cab WHERE cab.id = c.cabin_id AND is_partner_or_employee_of(cab.created_by))
        OR EXISTS (SELECT 1 FROM hostels h WHERE h.id = c.hostel_id AND is_partner_or_employee_of(h.created_by))
        OR EXISTS (SELECT 1 FROM mess_partners mp WHERE mp.id = c.mess_id AND is_partner_or_employee_of(mp.user_id))
        OR EXISTS (SELECT 1 FROM laundry_partners lp WHERE lp.id = c.laundry_id AND is_partner_or_employee_of(lp.user_id))
      )
    )
  );
