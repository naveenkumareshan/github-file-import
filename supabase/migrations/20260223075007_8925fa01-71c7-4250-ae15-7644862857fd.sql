
-- Create cabin-images storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cabin-images', 'cabin-images', true);

-- RLS: Anyone can view cabin images
CREATE POLICY "Public can view cabin images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cabin-images');

-- RLS: Authenticated users can upload cabin images
CREATE POLICY "Authenticated users can upload cabin images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cabin-images' AND auth.role() = 'authenticated');

-- RLS: Authenticated users can update their cabin images
CREATE POLICY "Authenticated users can update cabin images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cabin-images' AND auth.role() = 'authenticated');

-- RLS: Authenticated users can delete cabin images
CREATE POLICY "Authenticated users can delete cabin images"
ON storage.objects FOR DELETE
USING (bucket_id = 'cabin-images' AND auth.role() = 'authenticated');

-- Add images array column to cabins table
ALTER TABLE public.cabins ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
