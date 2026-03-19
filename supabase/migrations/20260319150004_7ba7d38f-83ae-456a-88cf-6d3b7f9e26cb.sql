
-- Partner Leads table
CREATE TABLE public.partner_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.profiles(id),
  name text NOT NULL,
  phone text NOT NULL,
  category text NOT NULL DEFAULT 'reading_room',
  source text NOT NULL DEFAULT 'walk_in',
  status text NOT NULL DEFAULT 'new_lead',
  serial_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Partner Lead Notes table
CREATE TABLE public.partner_lead_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.partner_leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  remark text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Serial number trigger for partner_leads
CREATE OR REPLACE FUNCTION public.set_serial_partner_leads()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('PLEAD');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_serial_partner_leads
  BEFORE INSERT ON public.partner_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_serial_partner_leads();

-- Updated_at trigger
CREATE TRIGGER trg_update_partner_leads_updated_at
  BEFORE UPDATE ON public.partner_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_lead_notes ENABLE ROW LEVEL SECURITY;

-- Partners/employees can manage their own leads
CREATE POLICY "Partners manage own leads" ON public.partner_leads
  FOR ALL USING (public.is_partner_or_employee_of(partner_id));

-- Admins can view all leads
CREATE POLICY "Admins view all leads" ON public.partner_leads
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Lead notes: partners/employees of the lead's partner
CREATE POLICY "Partners manage own lead notes" ON public.partner_lead_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.partner_leads pl
      WHERE pl.id = lead_id
      AND public.is_partner_or_employee_of(pl.partner_id)
    )
  );

-- Admins can view all lead notes
CREATE POLICY "Admins view all lead notes" ON public.partner_lead_notes
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for partner_leads
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_leads;
