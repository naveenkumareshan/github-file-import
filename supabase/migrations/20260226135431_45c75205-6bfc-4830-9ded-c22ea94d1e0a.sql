
-- Add locker refund tracking columns to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS locker_refunded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locker_refund_date timestamptz,
  ADD COLUMN IF NOT EXISTS locker_refund_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locker_refund_method text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS locker_refund_transaction_id text NOT NULL DEFAULT '';
