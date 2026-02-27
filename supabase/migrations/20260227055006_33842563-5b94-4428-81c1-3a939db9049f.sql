
-- Migration 1: user_roles RLS hardening + index

-- Add index for has_role() performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles(user_id, role);

-- Add SELECT policy for admins (fixes partner dropdown)
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add SELECT policy for vendors (enables partner features)
CREATE POLICY "Vendors can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'vendor'::app_role));
