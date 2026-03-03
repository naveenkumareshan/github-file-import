
-- Add payment_proof_url to receipt and booking tables
ALTER TABLE public.receipts ADD COLUMN IF NOT EXISTS payment_proof_url TEXT DEFAULT '';
ALTER TABLE public.hostel_receipts ADD COLUMN IF NOT EXISTS payment_proof_url TEXT DEFAULT '';
ALTER TABLE public.due_payments ADD COLUMN IF NOT EXISTS payment_proof_url TEXT DEFAULT '';
ALTER TABLE public.hostel_due_payments ADD COLUMN IF NOT EXISTS payment_proof_url TEXT DEFAULT '';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_proof_url TEXT DEFAULT '';
ALTER TABLE public.hostel_bookings ADD COLUMN IF NOT EXISTS payment_proof_url TEXT DEFAULT '';

-- Add payment_proof_required setting to property tables
ALTER TABLE public.cabins ADD COLUMN IF NOT EXISTS payment_proof_required BOOLEAN DEFAULT false;
ALTER TABLE public.hostels ADD COLUMN IF NOT EXISTS payment_proof_required BOOLEAN DEFAULT false;

-- Create payment-proofs storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload payment proofs
CREATE POLICY "Authenticated users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');

-- Allow public read access for payment proofs
CREATE POLICY "Anyone can view payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs');

-- Allow authenticated users to delete own uploads
CREATE POLICY "Authenticated users can delete payment proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-proofs' AND auth.role() = 'authenticated');
