
-- Add category and price_override columns to hostel_beds
ALTER TABLE public.hostel_beds 
  ADD COLUMN category text DEFAULT NULL,
  ADD COLUMN price_override numeric DEFAULT NULL;

-- Create hostel_bed_categories table (mirrors seat_categories)
CREATE TABLE public.hostel_bed_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  name text NOT NULL,
  price_adjustment numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hostel_bed_categories ENABLE ROW LEVEL SECURITY;

-- RLS: Admin full access
CREATE POLICY "Admins can manage all bed categories"
  ON public.hostel_bed_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS: Partners can manage own hostel categories
CREATE POLICY "Partners can manage own hostel bed categories"
  ON public.hostel_bed_categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM hostels h WHERE h.id = hostel_bed_categories.hostel_id AND h.created_by = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM hostels h WHERE h.id = hostel_bed_categories.hostel_id AND h.created_by = auth.uid()
  ));

-- RLS: Anyone can view
CREATE POLICY "Anyone can view bed categories"
  ON public.hostel_bed_categories FOR SELECT
  USING (true);
