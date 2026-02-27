
ALTER TABLE public.cabins
  ADD COLUMN opening_time time NOT NULL DEFAULT '06:00',
  ADD COLUMN closing_time time NOT NULL DEFAULT '22:00',
  ADD COLUMN working_days jsonb NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'::jsonb;
