
-- 1. Create hostel_floors table
CREATE TABLE public.hostel_floors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  name text NOT NULL,
  floor_order integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_floors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all hostel floors"
  ON public.hostel_floors FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can manage own hostel floors"
  ON public.hostel_floors FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM hostels h WHERE h.id = hostel_floors.hostel_id AND h.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM hostels h WHERE h.id = hostel_floors.hostel_id AND h.created_by = auth.uid()));

CREATE POLICY "Anyone can view active hostel floors"
  ON public.hostel_floors FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- 2. Create hostel_sharing_types table
CREATE TABLE public.hostel_sharing_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id uuid NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hostel_sharing_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all hostel sharing types"
  ON public.hostel_sharing_types FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can manage own hostel sharing types"
  ON public.hostel_sharing_types FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM hostels h WHERE h.id = hostel_sharing_types.hostel_id AND h.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM hostels h WHERE h.id = hostel_sharing_types.hostel_id AND h.created_by = auth.uid()));

CREATE POLICY "Anyone can view active hostel sharing types"
  ON public.hostel_sharing_types FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- 3. Add new columns to hostel_rooms
ALTER TABLE public.hostel_rooms
  ADD COLUMN floor_id uuid REFERENCES public.hostel_floors(id),
  ADD COLUMN sharing_type_id uuid REFERENCES public.hostel_sharing_types(id),
  ADD COLUMN category_id uuid REFERENCES public.hostel_bed_categories(id);

-- 4. Add sharing_type_id to hostel_beds
ALTER TABLE public.hostel_beds
  ADD COLUMN sharing_type_id uuid REFERENCES public.hostel_sharing_types(id);
