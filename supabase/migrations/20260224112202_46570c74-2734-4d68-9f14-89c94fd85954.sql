
-- Add created_by column to cabins table for partner ownership
ALTER TABLE public.cabins ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Allow partners (vendors) to manage their own cabins
CREATE POLICY "Partners can manage own cabins"
ON public.cabins FOR ALL TO authenticated
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
