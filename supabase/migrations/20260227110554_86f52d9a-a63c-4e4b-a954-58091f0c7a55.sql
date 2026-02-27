
-- Create hostel_stay_packages table
CREATE TABLE public.hostel_stay_packages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Base Package',
  min_months integer NOT NULL DEFAULT 1,
  discount_percentage numeric NOT NULL DEFAULT 0,
  deposit_months numeric NOT NULL DEFAULT 1,
  lock_in_months integer NOT NULL DEFAULT 0,
  notice_months integer NOT NULL DEFAULT 1,
  description text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hostel_stay_packages ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage all stay packages"
ON public.hostel_stay_packages FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Partners manage own hostel packages
CREATE POLICY "Partners can manage own hostel stay packages"
ON public.hostel_stay_packages FOR ALL
USING (EXISTS (
  SELECT 1 FROM hostels h WHERE h.id = hostel_stay_packages.hostel_id AND h.created_by = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM hostels h WHERE h.id = hostel_stay_packages.hostel_id AND h.created_by = auth.uid()
));

-- Public can view active packages
CREATE POLICY "Anyone can view active stay packages"
ON public.hostel_stay_packages FOR SELECT
USING (is_active = true);
