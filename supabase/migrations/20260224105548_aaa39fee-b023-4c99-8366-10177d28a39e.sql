
-- 1. Serial counters table
CREATE TABLE public.serial_counters (
  entity_type text NOT NULL,
  year integer NOT NULL,
  current_seq integer NOT NULL DEFAULT 0,
  PRIMARY KEY (entity_type, year)
);
ALTER TABLE public.serial_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.serial_counters FOR ALL USING (true) WITH CHECK (true);

-- 2. Function to generate serial numbers atomically
CREATE OR REPLACE FUNCTION public.generate_serial_number(p_entity_type text)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_year integer := EXTRACT(YEAR FROM now())::integer;
  v_seq integer;
BEGIN
  INSERT INTO public.serial_counters (entity_type, year, current_seq)
  VALUES (p_entity_type, v_year, 1)
  ON CONFLICT (entity_type, year)
  DO UPDATE SET current_seq = serial_counters.current_seq + 1
  RETURNING current_seq INTO v_seq;

  RETURN 'IS-' || p_entity_type || '-' || v_year::text || '-' || lpad(v_seq::text, 5, '0');
END;
$$;

-- 3. Add serial_number columns
ALTER TABLE public.profiles ADD COLUMN serial_number text UNIQUE;
ALTER TABLE public.cabins ADD COLUMN serial_number text UNIQUE;
ALTER TABLE public.bookings ADD COLUMN serial_number text UNIQUE;
ALTER TABLE public.complaints ADD COLUMN serial_number text UNIQUE;
ALTER TABLE public.support_tickets ADD COLUMN serial_number text UNIQUE;

-- 4. Triggers
CREATE OR REPLACE FUNCTION public.set_serial_profiles() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('CUST');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_serial_profiles BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_serial_profiles();

CREATE OR REPLACE FUNCTION public.set_serial_cabins() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('ROOM');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_serial_cabins BEFORE INSERT ON public.cabins FOR EACH ROW EXECUTE FUNCTION public.set_serial_cabins();

CREATE OR REPLACE FUNCTION public.set_serial_bookings() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('BOOK');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_serial_bookings BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_serial_bookings();

CREATE OR REPLACE FUNCTION public.set_serial_complaints() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('CMPL');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_serial_complaints BEFORE INSERT ON public.complaints FOR EACH ROW EXECUTE FUNCTION public.set_serial_complaints();

CREATE OR REPLACE FUNCTION public.set_serial_support_tickets() RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('TCKT');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_serial_support_tickets BEFORE INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_serial_support_tickets();

-- 5. Backfill existing rows
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE serial_number IS NULL ORDER BY created_at LOOP
    UPDATE public.profiles SET serial_number = generate_serial_number('CUST') WHERE id = r.id;
  END LOOP;
  FOR r IN SELECT id FROM public.cabins WHERE serial_number IS NULL ORDER BY created_at LOOP
    UPDATE public.cabins SET serial_number = generate_serial_number('ROOM') WHERE id = r.id;
  END LOOP;
  FOR r IN SELECT id FROM public.bookings WHERE serial_number IS NULL ORDER BY created_at LOOP
    UPDATE public.bookings SET serial_number = generate_serial_number('BOOK') WHERE id = r.id;
  END LOOP;
  FOR r IN SELECT id FROM public.complaints WHERE serial_number IS NULL ORDER BY created_at LOOP
    UPDATE public.complaints SET serial_number = generate_serial_number('CMPL') WHERE id = r.id;
  END LOOP;
  FOR r IN SELECT id FROM public.support_tickets WHERE serial_number IS NULL ORDER BY created_at LOOP
    UPDATE public.support_tickets SET serial_number = generate_serial_number('TCKT') WHERE id = r.id;
  END LOOP;
END;
$$;
