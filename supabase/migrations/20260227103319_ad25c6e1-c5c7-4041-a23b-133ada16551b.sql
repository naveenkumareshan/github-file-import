
-- =============================================
-- HOSTEL BOOKING MARKETPLACE - FULL SCHEMA
-- =============================================

-- Storage bucket for hostel images
INSERT INTO storage.buckets (id, name, public) VALUES ('hostel-images', 'hostel-images', true);

-- Storage policies for hostel-images bucket
CREATE POLICY "Anyone can view hostel images"
ON storage.objects FOR SELECT
USING (bucket_id = 'hostel-images');

CREATE POLICY "Authenticated users can upload hostel images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'hostel-images');

CREATE POLICY "Users can update own hostel images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'hostel-images');

CREATE POLICY "Users can delete own hostel images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'hostel-images');

-- =============================================
-- TABLE: hostels
-- =============================================
CREATE TABLE public.hostels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text,
  name text NOT NULL,
  description text DEFAULT '',
  location text DEFAULT '',
  locality text DEFAULT '',
  state_id uuid REFERENCES public.states(id),
  city_id uuid REFERENCES public.cities(id),
  area_id uuid REFERENCES public.areas(id),
  gender text NOT NULL DEFAULT 'Co-ed',
  stay_type text NOT NULL DEFAULT 'Both',
  logo_image text DEFAULT '',
  images text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  contact_email text DEFAULT '',
  contact_phone text DEFAULT '',
  coordinates_lat numeric,
  coordinates_lng numeric,
  is_active boolean NOT NULL DEFAULT true,
  is_approved boolean NOT NULL DEFAULT false,
  created_by uuid,
  vendor_id uuid,
  average_rating numeric NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  commission_percentage numeric NOT NULL DEFAULT 10,
  security_deposit numeric NOT NULL DEFAULT 0,
  advance_booking_enabled boolean NOT NULL DEFAULT false,
  advance_percentage numeric NOT NULL DEFAULT 50,
  advance_flat_amount numeric,
  advance_use_flat boolean NOT NULL DEFAULT false,
  refund_policy text DEFAULT '',
  cancellation_window_hours integer NOT NULL DEFAULT 24,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;

-- Serial number trigger for hostels
CREATE OR REPLACE FUNCTION public.set_serial_hostels()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('INSH');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_serial_hostels
BEFORE INSERT ON public.hostels
FOR EACH ROW EXECUTE FUNCTION public.set_serial_hostels();

-- Updated_at trigger
CREATE TRIGGER trg_update_hostels_updated_at
BEFORE UPDATE ON public.hostels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for hostels
CREATE POLICY "Anyone can view active approved hostels"
ON public.hostels FOR SELECT
USING (is_active = true AND is_approved = true);

CREATE POLICY "Admins can manage all hostels"
ON public.hostels FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view own hostels"
ON public.hostels FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Partners can insert own hostels"
ON public.hostels FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Partners can update own hostels"
ON public.hostels FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- =============================================
-- TABLE: hostel_rooms
-- =============================================
CREATE TABLE public.hostel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_number text NOT NULL DEFAULT '',
  floor integer NOT NULL DEFAULT 1,
  category text NOT NULL DEFAULT 'standard',
  description text DEFAULT '',
  image_url text DEFAULT '',
  images text[] DEFAULT '{}',
  amenities text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_rooms ENABLE ROW LEVEL SECURITY;

-- RLS for hostel_rooms
CREATE POLICY "Anyone can view active hostel rooms"
ON public.hostel_rooms FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all hostel rooms"
ON public.hostel_rooms FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can manage own hostel rooms"
ON public.hostel_rooms FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.hostels h WHERE h.id = hostel_rooms.hostel_id AND h.created_by = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.hostels h WHERE h.id = hostel_rooms.hostel_id AND h.created_by = auth.uid()));

-- =============================================
-- TABLE: hostel_sharing_options
-- =============================================
CREATE TABLE public.hostel_sharing_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.hostel_rooms(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'Single',
  capacity integer NOT NULL DEFAULT 1,
  total_beds integer NOT NULL DEFAULT 1,
  price_daily numeric NOT NULL DEFAULT 0,
  price_monthly numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_sharing_options ENABLE ROW LEVEL SECURITY;

-- RLS for hostel_sharing_options
CREATE POLICY "Anyone can view active sharing options"
ON public.hostel_sharing_options FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all sharing options"
ON public.hostel_sharing_options FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can manage own sharing options"
ON public.hostel_sharing_options FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.hostel_rooms r
  JOIN public.hostels h ON h.id = r.hostel_id
  WHERE r.id = hostel_sharing_options.room_id AND h.created_by = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.hostel_rooms r
  JOIN public.hostels h ON h.id = r.hostel_id
  WHERE r.id = hostel_sharing_options.room_id AND h.created_by = auth.uid()
));

-- =============================================
-- TABLE: hostel_beds
-- =============================================
CREATE TABLE public.hostel_beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.hostel_rooms(id) ON DELETE CASCADE,
  sharing_option_id uuid NOT NULL REFERENCES public.hostel_sharing_options(id) ON DELETE CASCADE,
  bed_number integer NOT NULL DEFAULT 1,
  is_available boolean NOT NULL DEFAULT true,
  is_blocked boolean NOT NULL DEFAULT false,
  block_reason text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_beds ENABLE ROW LEVEL SECURITY;

-- RLS for hostel_beds
CREATE POLICY "Anyone can view hostel beds"
ON public.hostel_beds FOR SELECT
USING (true);

CREATE POLICY "Admins can manage all hostel beds"
ON public.hostel_beds FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can manage own hostel beds"
ON public.hostel_beds FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.hostel_rooms r
  JOIN public.hostels h ON h.id = r.hostel_id
  WHERE r.id = hostel_beds.room_id AND h.created_by = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.hostel_rooms r
  JOIN public.hostels h ON h.id = r.hostel_id
  WHERE r.id = hostel_beds.room_id AND h.created_by = auth.uid()
));

-- =============================================
-- TABLE: hostel_bookings
-- =============================================
CREATE TABLE public.hostel_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text,
  user_id uuid NOT NULL,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id),
  room_id uuid NOT NULL REFERENCES public.hostel_rooms(id),
  bed_id uuid NOT NULL REFERENCES public.hostel_beds(id),
  sharing_option_id uuid NOT NULL REFERENCES public.hostel_sharing_options(id),
  start_date date NOT NULL,
  end_date date NOT NULL,
  booking_duration text NOT NULL DEFAULT 'monthly',
  duration_count integer NOT NULL DEFAULT 1,
  total_price numeric NOT NULL DEFAULT 0,
  advance_amount numeric NOT NULL DEFAULT 0,
  remaining_amount numeric NOT NULL DEFAULT 0,
  security_deposit numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT '',
  razorpay_order_id text DEFAULT '',
  razorpay_payment_id text DEFAULT '',
  razorpay_signature text DEFAULT '',
  transaction_id text DEFAULT '',
  cancellation_reason text DEFAULT '',
  cancelled_at timestamptz,
  collected_by uuid,
  collected_by_name text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_bookings ENABLE ROW LEVEL SECURITY;

-- Serial number trigger
CREATE OR REPLACE FUNCTION public.set_serial_hostel_bookings()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('HBKNG');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_serial_hostel_bookings
BEFORE INSERT ON public.hostel_bookings
FOR EACH ROW EXECUTE FUNCTION public.set_serial_hostel_bookings();

CREATE TRIGGER trg_update_hostel_bookings_updated_at
BEFORE UPDATE ON public.hostel_bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for hostel_bookings
CREATE POLICY "Users can view own hostel bookings"
ON public.hostel_bookings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hostel bookings"
ON public.hostel_bookings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hostel bookings"
ON public.hostel_bookings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all hostel bookings"
ON public.hostel_bookings FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can view bookings for own hostels"
ON public.hostel_bookings FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM public.hostels h WHERE h.id = hostel_bookings.hostel_id AND h.created_by = auth.uid()));

CREATE POLICY "Partners can insert bookings for own hostels"
ON public.hostel_bookings FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.hostels h WHERE h.id = hostel_bookings.hostel_id AND h.created_by = auth.uid()));

-- =============================================
-- TABLE: hostel_receipts
-- =============================================
CREATE TABLE public.hostel_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text,
  booking_id uuid REFERENCES public.hostel_bookings(id),
  user_id uuid NOT NULL,
  hostel_id uuid NOT NULL REFERENCES public.hostels(id),
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  transaction_id text DEFAULT '',
  receipt_type text NOT NULL DEFAULT 'booking_payment',
  collected_by uuid,
  collected_by_name text DEFAULT '',
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_receipts ENABLE ROW LEVEL SECURITY;

-- Serial number trigger
CREATE OR REPLACE FUNCTION public.set_serial_hostel_receipts()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('HRCPT');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_serial_hostel_receipts
BEFORE INSERT ON public.hostel_receipts
FOR EACH ROW EXECUTE FUNCTION public.set_serial_hostel_receipts();

-- RLS for hostel_receipts
CREATE POLICY "Users can view own hostel receipts"
ON public.hostel_receipts FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hostel receipts"
ON public.hostel_receipts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all hostel receipts"
ON public.hostel_receipts FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partners can manage receipts for own hostels"
ON public.hostel_receipts FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM public.hostels h WHERE h.id = hostel_receipts.hostel_id AND h.created_by = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.hostels h WHERE h.id = hostel_receipts.hostel_id AND h.created_by = auth.uid()));
