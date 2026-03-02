
-- Add food_policy_type to hostels
ALTER TABLE public.hostels ADD COLUMN food_policy_type text NOT NULL DEFAULT 'not_available';

-- Migrate existing data: food_enabled = true → optional
UPDATE public.hostels SET food_policy_type = 'optional' WHERE food_enabled = true;

-- Add food_policy_override and food_price_override to hostel_sharing_options
ALTER TABLE public.hostel_sharing_options ADD COLUMN food_policy_override text NOT NULL DEFAULT 'inherit';
ALTER TABLE public.hostel_sharing_options ADD COLUMN food_price_override numeric;

-- Add snapshot columns to hostel_bookings
ALTER TABLE public.hostel_bookings ADD COLUMN food_policy_type text NOT NULL DEFAULT 'not_available';
ALTER TABLE public.hostel_bookings ADD COLUMN food_price_snapshot numeric NOT NULL DEFAULT 0;
ALTER TABLE public.hostel_bookings ADD COLUMN total_amount_snapshot numeric NOT NULL DEFAULT 0;
