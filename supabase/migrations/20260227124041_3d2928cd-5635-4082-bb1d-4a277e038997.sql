
-- Add booking control columns to hostels table
ALTER TABLE public.hostels
  ADD COLUMN IF NOT EXISTS max_advance_booking_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS allowed_durations jsonb NOT NULL DEFAULT '["daily","weekly","monthly"]'::jsonb,
  ADD COLUMN IF NOT EXISTS advance_applicable_durations jsonb NOT NULL DEFAULT '["daily","weekly","monthly"]'::jsonb;
