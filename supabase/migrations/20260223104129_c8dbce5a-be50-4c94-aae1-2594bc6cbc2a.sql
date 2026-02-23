
CREATE TABLE public.seat_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid REFERENCES public.cabins(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seat_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage seat categories"
ON public.seat_categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view seat categories"
ON public.seat_categories FOR SELECT
USING (true);

-- Add unique constraint on cabin_id + name
ALTER TABLE public.seat_categories ADD CONSTRAINT seat_categories_cabin_name_unique UNIQUE (cabin_id, name);
