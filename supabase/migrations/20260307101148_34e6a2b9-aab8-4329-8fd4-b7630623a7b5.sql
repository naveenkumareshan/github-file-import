
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS credit_date date;
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS reconciled_bank_name text;

ALTER TABLE public.hostel_receipts ADD COLUMN IF NOT EXISTS credit_date date;
ALTER TABLE public.hostel_receipts ADD COLUMN IF NOT EXISTS reconciled_bank_name text;

ALTER TABLE public.mess_receipts ADD COLUMN IF NOT EXISTS credit_date date;
ALTER TABLE public.mess_receipts ADD COLUMN IF NOT EXISTS reconciled_bank_name text;

ALTER TABLE public.laundry_receipts ADD COLUMN IF NOT EXISTS credit_date date;
ALTER TABLE public.laundry_receipts ADD COLUMN IF NOT EXISTS reconciled_bank_name text;
