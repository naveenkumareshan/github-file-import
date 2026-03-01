
-- Create hostel_food_menu table
CREATE TABLE public.hostel_food_menu (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  meal_type text NOT NULL DEFAULT 'breakfast',
  item_name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hostel_food_menu ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all food menu items"
ON public.hostel_food_menu FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can manage own hostel food menu"
ON public.hostel_food_menu FOR ALL
USING (EXISTS (SELECT 1 FROM hostels h WHERE h.id = hostel_food_menu.hostel_id AND h.created_by = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM hostels h WHERE h.id = hostel_food_menu.hostel_id AND h.created_by = auth.uid()));

CREATE POLICY "Anyone can view active food menu items"
ON public.hostel_food_menu FOR SELECT
USING (is_active = true);

-- Add food columns to hostels
ALTER TABLE public.hostels
  ADD COLUMN food_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN food_price_monthly numeric NOT NULL DEFAULT 0,
  ADD COLUMN food_menu_image text DEFAULT '';

-- Add food columns to hostel_bookings
ALTER TABLE public.hostel_bookings
  ADD COLUMN food_opted boolean NOT NULL DEFAULT false,
  ADD COLUMN food_amount numeric NOT NULL DEFAULT 0;

-- Add food column to hostel_dues
ALTER TABLE public.hostel_dues
  ADD COLUMN food_amount numeric NOT NULL DEFAULT 0;
