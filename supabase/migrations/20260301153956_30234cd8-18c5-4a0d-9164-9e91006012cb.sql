-- Backfill partner records for existing vendor users who don't have one
INSERT INTO partners (user_id, business_name, contact_person, email, phone, status)
SELECT p.id, COALESCE(p.name, 'Partner'), COALESCE(p.name, ''), COALESCE(p.email, ''), COALESCE(p.phone, ''), 'approved'
FROM profiles p
WHERE p.id IN (SELECT user_id FROM user_roles WHERE role = 'vendor')
AND p.id NOT IN (SELECT user_id FROM partners);

-- Also add INSERT policy for partners to create own record (needed for auto-create fallback)
CREATE POLICY "Partners can insert own record"
ON public.partners
FOR INSERT
WITH CHECK (auth.uid() = user_id);