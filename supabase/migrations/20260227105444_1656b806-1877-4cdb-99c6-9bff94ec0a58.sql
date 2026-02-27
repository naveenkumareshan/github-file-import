
-- Add missing user_id foreign keys to hostel_bookings and hostel_receipts
ALTER TABLE public.hostel_bookings
  ADD CONSTRAINT hostel_bookings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.hostel_receipts
  ADD CONSTRAINT hostel_receipts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);
