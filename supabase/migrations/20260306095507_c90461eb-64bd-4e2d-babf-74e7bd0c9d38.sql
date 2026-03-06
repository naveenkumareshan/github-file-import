
-- 1. mess_partners
CREATE TABLE public.mess_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  contact_number text NOT NULL DEFAULT '',
  food_type text NOT NULL DEFAULT 'both',
  opening_days jsonb NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]'::jsonb,
  capacity int,
  is_active boolean NOT NULL DEFAULT true,
  is_approved boolean NOT NULL DEFAULT false,
  serial_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. mess_meal_timings
CREATE TABLE public.mess_meal_timings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL REFERENCES public.mess_partners(id) ON DELETE CASCADE,
  meal_type text NOT NULL DEFAULT 'lunch',
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. mess_packages
CREATE TABLE public.mess_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL REFERENCES public.mess_partners(id) ON DELETE CASCADE,
  name text NOT NULL,
  meal_types jsonb NOT NULL DEFAULT '["breakfast","lunch","dinner"]'::jsonb,
  duration_type text NOT NULL DEFAULT 'monthly',
  duration_count int NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. mess_weekly_menu
CREATE TABLE public.mess_weekly_menu (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mess_id uuid NOT NULL REFERENCES public.mess_partners(id) ON DELETE CASCADE,
  day_of_week text NOT NULL DEFAULT 'monday',
  meal_type text NOT NULL DEFAULT 'lunch',
  menu_items text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. mess_subscriptions
CREATE TABLE public.mess_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mess_id uuid NOT NULL REFERENCES public.mess_partners(id) ON DELETE CASCADE,
  package_id uuid NOT NULL REFERENCES public.mess_packages(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  price_paid numeric NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  payment_method text NOT NULL DEFAULT 'cash',
  transaction_id text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active',
  pause_start date,
  pause_end date,
  serial_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. mess_attendance
CREATE TABLE public.mess_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.mess_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mess_id uuid NOT NULL REFERENCES public.mess_partners(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  meal_type text NOT NULL,
  status text NOT NULL DEFAULT 'consumed',
  marked_by text NOT NULL DEFAULT 'manual',
  marked_at timestamptz NOT NULL DEFAULT now()
);

-- 7. mess_receipts
CREATE TABLE public.mess_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.mess_subscriptions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mess_id uuid NOT NULL REFERENCES public.mess_partners(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  transaction_id text NOT NULL DEFAULT '',
  serial_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Serial number triggers
CREATE OR REPLACE FUNCTION public.set_serial_mess_partners()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('MESS');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_serial_mess_partners BEFORE INSERT ON public.mess_partners
FOR EACH ROW EXECUTE FUNCTION public.set_serial_mess_partners();

CREATE OR REPLACE FUNCTION public.set_serial_mess_subscriptions()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('MSUB');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_serial_mess_subscriptions BEFORE INSERT ON public.mess_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_serial_mess_subscriptions();

CREATE OR REPLACE FUNCTION public.set_serial_mess_receipts()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('MRCPT');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_serial_mess_receipts BEFORE INSERT ON public.mess_receipts
FOR EACH ROW EXECUTE FUNCTION public.set_serial_mess_receipts();

-- updated_at triggers
CREATE TRIGGER trg_mess_partners_updated_at BEFORE UPDATE ON public.mess_partners
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mess_subscriptions_updated_at BEFORE UPDATE ON public.mess_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.mess_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_meal_timings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_weekly_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_receipts ENABLE ROW LEVEL SECURITY;

-- RLS: mess_partners
CREATE POLICY "Anyone can view approved active mess" ON public.mess_partners FOR SELECT USING (is_active = true AND is_approved = true);
CREATE POLICY "Partners manage own mess" ON public.mess_partners FOR ALL TO authenticated USING (public.is_partner_or_employee_of(user_id)) WITH CHECK (public.is_partner_or_employee_of(user_id));
CREATE POLICY "Admins manage all mess" ON public.mess_partners FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: mess_meal_timings
CREATE POLICY "Anyone can view meal timings" ON public.mess_meal_timings FOR SELECT USING (true);
CREATE POLICY "Partners manage own timings" ON public.mess_meal_timings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id)));
CREATE POLICY "Admins manage all timings" ON public.mess_meal_timings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: mess_packages
CREATE POLICY "Anyone can view active packages" ON public.mess_packages FOR SELECT USING (is_active = true);
CREATE POLICY "Partners manage own packages" ON public.mess_packages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id)));
CREATE POLICY "Admins manage all packages" ON public.mess_packages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: mess_weekly_menu
CREATE POLICY "Anyone can view menu" ON public.mess_weekly_menu FOR SELECT USING (true);
CREATE POLICY "Partners manage own menu" ON public.mess_weekly_menu FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id)));
CREATE POLICY "Admins manage all menu" ON public.mess_weekly_menu FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: mess_subscriptions
CREATE POLICY "Students view own subscriptions" ON public.mess_subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Partners view mess subscriptions" ON public.mess_subscriptions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id)));
CREATE POLICY "Students can insert own subscriptions" ON public.mess_subscriptions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students can update own subscriptions" ON public.mess_subscriptions FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage all subscriptions" ON public.mess_subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: mess_attendance
CREATE POLICY "Students view own attendance" ON public.mess_attendance FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Partners manage mess attendance" ON public.mess_attendance FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id)));
CREATE POLICY "Admins manage all attendance" ON public.mess_attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: mess_receipts
CREATE POLICY "Students view own receipts" ON public.mess_receipts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Partners manage mess receipts" ON public.mess_receipts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id))) WITH CHECK (EXISTS (SELECT 1 FROM public.mess_partners mp WHERE mp.id = mess_id AND public.is_partner_or_employee_of(mp.user_id)));
CREATE POLICY "Admins manage all receipts" ON public.mess_receipts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
