
-- Create vendor_employees table
CREATE TABLE public.vendor_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'staff',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  salary NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_employees ENABLE ROW LEVEL SECURITY;

-- Partners can manage their own employees
CREATE POLICY "Partners can manage own employees"
ON public.vendor_employees
FOR ALL
USING (auth.uid() = partner_user_id)
WITH CHECK (auth.uid() = partner_user_id);

-- Admins can manage all employees
CREATE POLICY "Admins can manage all vendor employees"
ON public.vendor_employees
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_vendor_employees_updated_at
BEFORE UPDATE ON public.vendor_employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add vendor complaint access policy
CREATE POLICY "Vendors can view complaints for own properties"
ON public.complaints
FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM cabins c
    WHERE c.id = complaints.cabin_id AND c.created_by = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM hostels h
    WHERE h.id = complaints.hostel_id AND h.created_by = auth.uid()
  ))
);

-- Create partner-documents storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('partner-documents', 'partner-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Partners can upload their own documents
CREATE POLICY "Partners can upload own documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'partner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Partners can view their own documents
CREATE POLICY "Partners can view own documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'partner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Partners can delete their own documents
CREATE POLICY "Partners can delete own documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'partner-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can view all partner documents
CREATE POLICY "Admins can view all partner documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'partner-documents' AND has_role(auth.uid(), 'admin'::app_role));
