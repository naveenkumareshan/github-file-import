
-- Create partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL DEFAULT '',
  business_type text NOT NULL DEFAULT 'individual',
  contact_person text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'approved',
  address jsonb NOT NULL DEFAULT '{}',
  business_details jsonb NOT NULL DEFAULT '{}',
  bank_details jsonb NOT NULL DEFAULT '{}',
  commission_settings jsonb NOT NULL DEFAULT '{"type": "percentage", "value": 10, "payoutCycle": "monthly"}',
  serial_number text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Serial number trigger
CREATE TRIGGER set_serial_partners
  BEFORE INSERT ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.set_serial_profiles();

-- Updated_at trigger
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all partners"
  ON public.partners FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Partners can read their own record
CREATE POLICY "Partners can view own record"
  ON public.partners FOR SELECT
  USING (auth.uid() = user_id);

-- Partners can update their own record
CREATE POLICY "Partners can update own record"
  ON public.partners FOR UPDATE
  USING (auth.uid() = user_id);

-- Vendor employees can view partner records (for accessing partner info)
CREATE POLICY "Vendor employees can view partners"
  ON public.partners FOR SELECT
  USING (has_role(auth.uid(), 'vendor_employee'::app_role));
