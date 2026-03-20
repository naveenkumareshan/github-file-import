
-- Cash handovers table
CREATE TABLE public.cash_handovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_user_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  from_name TEXT NOT NULL DEFAULT '',
  to_user_id UUID NOT NULL,
  to_name TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  otp_code TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.cash_handovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner and employees can view handovers"
ON public.cash_handovers FOR SELECT
TO authenticated
USING (public.is_partner_or_employee_of(partner_user_id));

CREATE POLICY "Partner and employees can insert handovers"
ON public.cash_handovers FOR INSERT
TO authenticated
WITH CHECK (public.is_partner_or_employee_of(partner_user_id));

CREATE POLICY "Partner and employees can update handovers"
ON public.cash_handovers FOR UPDATE
TO authenticated
USING (public.is_partner_or_employee_of(partner_user_id));

-- Generate OTP function
CREATE OR REPLACE FUNCTION public.generate_handover_otp()
RETURNS TEXT
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lpad((floor(random() * 10000)::int)::text, 4, '0');
$$;

-- Verify handover OTP function
CREATE OR REPLACE FUNCTION public.verify_handover_otp(p_handover_id UUID, p_otp TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_handover RECORD;
BEGIN
  SELECT * INTO v_handover FROM public.cash_handovers WHERE id = p_handover_id;
  
  IF v_handover IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Handover not found');
  END IF;
  
  IF v_handover.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Handover is no longer pending');
  END IF;
  
  IF v_handover.otp_code != p_otp THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid OTP');
  END IF;
  
  UPDATE public.cash_handovers
  SET status = 'completed', completed_at = now()
  WHERE id = p_handover_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;
