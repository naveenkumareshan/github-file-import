ALTER TABLE public.hostel_dues
  ADD CONSTRAINT fk_hostel_dues_user FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  ADD CONSTRAINT fk_hostel_dues_hostel FOREIGN KEY (hostel_id) REFERENCES public.hostels(id),
  ADD CONSTRAINT fk_hostel_dues_bed FOREIGN KEY (bed_id) REFERENCES public.hostel_beds(id),
  ADD CONSTRAINT fk_hostel_dues_room FOREIGN KEY (room_id) REFERENCES public.hostel_rooms(id),
  ADD CONSTRAINT fk_hostel_dues_booking FOREIGN KEY (booking_id) REFERENCES public.hostel_bookings(id);