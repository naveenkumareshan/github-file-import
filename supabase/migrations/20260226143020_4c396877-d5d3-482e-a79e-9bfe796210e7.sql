
-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  booking_id uuid NOT NULL UNIQUE,
  cabin_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_cabin FOREIGN KEY (cabin_id) REFERENCES public.cabins(id) ON DELETE CASCADE
);

-- Update timestamp trigger
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger: ensure booking belongs to user and is completed
CREATE OR REPLACE FUNCTION public.validate_review_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = NEW.booking_id
      AND user_id = NEW.user_id
      AND payment_status = 'completed'
  ) THEN
    RAISE EXCEPTION 'Review can only be submitted for your own completed booking';
  END IF;
  
  -- Auto-set cabin_id from booking if not matching
  SELECT cabin_id INTO NEW.cabin_id FROM public.bookings WHERE id = NEW.booking_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_review_insert
BEFORE INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.validate_review_insert();

-- Rating stats function
CREATE OR REPLACE FUNCTION public.get_cabin_rating_stats(p_cabin_id uuid)
RETURNS TABLE(average_rating numeric, review_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
    COUNT(*) as review_count
  FROM public.reviews
  WHERE cabin_id = p_cabin_id AND status = 'approved';
$$;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved reviews
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (status = 'approved');

-- Students can view their own reviews (any status)
CREATE POLICY "Users can view own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

-- Students can insert reviews for own completed bookings
CREATE POLICY "Users can insert own reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all reviews"
ON public.reviews
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Vendors can view reviews for their cabins
CREATE POLICY "Vendors can view reviews for own cabins"
ON public.reviews
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.cabins c
  WHERE c.id = reviews.cabin_id AND c.created_by = auth.uid()
));
