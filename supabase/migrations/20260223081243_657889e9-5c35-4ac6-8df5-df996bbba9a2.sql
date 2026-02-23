
-- Create seats table
CREATE TABLE public.seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer NOT NULL,
  floor integer NOT NULL DEFAULT 1,
  cabin_id uuid REFERENCES public.cabins(id) ON DELETE CASCADE NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  price numeric NOT NULL DEFAULT 0,
  position_x numeric NOT NULL DEFAULT 0,
  position_y numeric NOT NULL DEFAULT 0,
  is_hot_selling boolean NOT NULL DEFAULT false,
  unavailable_until timestamptz,
  sharing_type text NOT NULL DEFAULT 'private',
  sharing_capacity integer NOT NULL DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_seats_cabin_id ON public.seats(cabin_id);

ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view seats" ON public.seats FOR SELECT USING (true);
CREATE POLICY "Admins can manage seats" ON public.seats FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add floors and room_elements JSONB columns to cabins
ALTER TABLE public.cabins ADD COLUMN IF NOT EXISTS floors jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.cabins ADD COLUMN IF NOT EXISTS room_elements jsonb DEFAULT '[]'::jsonb;

-- Add payment columns to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS razorpay_signature text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS seat_id uuid REFERENCES public.seats(id);
