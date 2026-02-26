
ALTER TABLE public.dues
  ADD CONSTRAINT dues_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
