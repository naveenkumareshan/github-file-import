
-- Create checkin-documents storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('checkin-documents', 'checkin-documents', false);

-- RLS: Authenticated users can upload to checkin-documents
CREATE POLICY "Authenticated users can upload checkin documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'checkin-documents' AND auth.role() = 'authenticated');

-- RLS: Authenticated users can read checkin documents
CREATE POLICY "Authenticated users can read checkin documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'checkin-documents' AND auth.role() = 'authenticated');

-- RLS: Authenticated users can delete checkin documents
CREATE POLICY "Authenticated users can delete checkin documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'checkin-documents' AND auth.role() = 'authenticated');

-- Add check_in_documents JSONB column to bookings
ALTER TABLE public.bookings
ADD COLUMN check_in_documents jsonb DEFAULT '[]'::jsonb;

-- Add check_in_documents JSONB column to hostel_bookings
ALTER TABLE public.hostel_bookings
ADD COLUMN check_in_documents jsonb DEFAULT '[]'::jsonb;
