
ALTER TABLE public.cabins ADD COLUMN locker_available boolean NOT NULL DEFAULT false;
ALTER TABLE public.cabins ADD COLUMN locker_price numeric NOT NULL DEFAULT 0;
ALTER TABLE public.cabins ADD COLUMN full_address text DEFAULT '';
