INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profiles');