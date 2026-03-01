
-- Create referral_clicks table for tracking shared link usage
CREATE TABLE public.referral_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_user_id uuid NOT NULL,
  referred_user_id uuid,
  property_type text NOT NULL DEFAULT 'cabin',
  property_id text NOT NULL,
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  signed_up boolean NOT NULL DEFAULT false,
  booking_id uuid
);

-- Enable RLS
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;

-- Admins full access
CREATE POLICY "Admins can manage all referral clicks"
  ON public.referral_clicks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own referral data (as referrer)
CREATE POLICY "Users can view own referral data"
  ON public.referral_clicks FOR SELECT
  USING (auth.uid() = referrer_user_id);

-- Authenticated users can insert referral clicks
CREATE POLICY "Authenticated users can insert referral clicks"
  ON public.referral_clicks FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Index for fast lookups
CREATE INDEX idx_referral_clicks_referrer ON public.referral_clicks(referrer_user_id);
CREATE INDEX idx_referral_clicks_referred ON public.referral_clicks(referred_user_id);
