
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_reason text NOT NULL DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'online';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS collected_by uuid NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS collected_by_name text NOT NULL DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS transaction_id text NOT NULL DEFAULT '';
