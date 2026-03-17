
-- Create partner_enquiries table
CREATE TABLE public.partner_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  property_types text[] NOT NULL DEFAULT '{}',
  message text,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  serial_number text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public enquiry form)
CREATE POLICY "Anyone can submit enquiry"
ON public.partner_enquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin can view all enquiries
CREATE POLICY "Admins can view enquiries"
ON public.partner_enquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin can update enquiries
CREATE POLICY "Admins can update enquiries"
ON public.partner_enquiries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Serial number trigger
CREATE OR REPLACE FUNCTION public.set_serial_partner_enquiries()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('PENQ');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_serial_partner_enquiries
BEFORE INSERT ON public.partner_enquiries
FOR EACH ROW
EXECUTE FUNCTION public.set_serial_partner_enquiries();

-- Updated_at trigger
CREATE TRIGGER trg_update_partner_enquiries_updated_at
BEFORE UPDATE ON public.partner_enquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
