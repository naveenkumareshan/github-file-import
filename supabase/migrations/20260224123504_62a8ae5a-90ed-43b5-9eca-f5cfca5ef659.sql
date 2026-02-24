
-- Add foreign key from bookings.user_id to profiles.id
ALTER TABLE public.bookings
ADD CONSTRAINT bookings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);
