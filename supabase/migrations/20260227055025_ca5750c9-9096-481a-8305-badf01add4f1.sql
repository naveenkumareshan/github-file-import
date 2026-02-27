
-- Migration 2: Location tables (states, cities, areas)

-- States table
CREATE TABLE public.states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active states"
ON public.states FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage states"
ON public.states FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Cities table
CREATE TABLE public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE RESTRICT,
  latitude numeric,
  longitude numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name, state_id)
);

CREATE INDEX idx_cities_state_id ON public.cities(state_id);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active cities"
ON public.cities FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage cities"
ON public.cities FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Areas table
CREATE TABLE public.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE RESTRICT,
  pincode text,
  latitude numeric,
  longitude numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(name, city_id)
);

CREATE INDEX idx_areas_city_id ON public.areas(city_id);
CREATE INDEX idx_areas_pincode ON public.areas(pincode);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active areas"
ON public.areas FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage areas"
ON public.areas FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
