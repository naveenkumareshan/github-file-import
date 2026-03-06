
-- Add mess_id to complaints table
ALTER TABLE public.complaints ADD COLUMN mess_id uuid REFERENCES public.mess_partners(id) ON DELETE SET NULL;

-- Add mess_id to reviews table and make cabin_id nullable
ALTER TABLE public.reviews ALTER COLUMN cabin_id DROP NOT NULL;
ALTER TABLE public.reviews ADD COLUMN mess_id uuid REFERENCES public.mess_partners(id) ON DELETE SET NULL;

-- RLS policy for mess reviews - anyone can read approved mess reviews
CREATE POLICY "Anyone can read approved mess reviews"
ON public.reviews FOR SELECT
USING (mess_id IS NOT NULL AND status = 'approved');

-- Authenticated users can insert mess reviews for their own subscriptions
CREATE POLICY "Users can insert mess reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND mess_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.mess_subscriptions
    WHERE id = reviews.booking_id
      AND user_id = auth.uid()
      AND payment_status = 'completed'
  )
);
