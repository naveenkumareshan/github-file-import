
-- Create hostel_dues table (mirrors dues table)
CREATE TABLE public.hostel_dues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  hostel_id uuid NOT NULL,
  room_id uuid,
  bed_id uuid,
  booking_id uuid,
  total_fee numeric NOT NULL DEFAULT 0,
  advance_paid numeric NOT NULL DEFAULT 0,
  due_amount numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  proportional_end_date date,
  status text NOT NULL DEFAULT 'pending',
  serial_number text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create hostel_due_payments table (mirrors due_payments table)
CREATE TABLE public.hostel_due_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  due_id uuid NOT NULL REFERENCES public.hostel_dues(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  transaction_id text NOT NULL DEFAULT '',
  collected_by uuid,
  collected_by_name text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hostel_dues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_due_payments ENABLE ROW LEVEL SECURITY;

-- hostel_dues RLS policies
CREATE POLICY "Admins can manage all hostel dues" ON public.hostel_dues FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own hostel dues" ON public.hostel_dues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can update own hostel dues" ON public.hostel_dues FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can manage hostel dues for own hostels" ON public.hostel_dues FOR ALL
  USING (EXISTS (SELECT 1 FROM hostels h WHERE h.id = hostel_dues.hostel_id AND h.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM hostels h WHERE h.id = hostel_dues.hostel_id AND h.created_by = auth.uid()));

-- hostel_due_payments RLS policies
CREATE POLICY "Admins can manage all hostel due payments" ON public.hostel_due_payments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view own hostel due payments" ON public.hostel_due_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM hostel_dues d WHERE d.id = hostel_due_payments.due_id AND d.user_id = auth.uid()));

CREATE POLICY "Partners can manage hostel due payments for own hostels" ON public.hostel_due_payments FOR ALL
  USING (EXISTS (SELECT 1 FROM hostel_dues d JOIN hostels h ON h.id = d.hostel_id WHERE d.id = hostel_due_payments.due_id AND h.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM hostel_dues d JOIN hostels h ON h.id = d.hostel_id WHERE d.id = hostel_due_payments.due_id AND h.created_by = auth.uid()));

-- Serial number trigger for hostel_dues
CREATE OR REPLACE FUNCTION public.set_serial_hostel_dues()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('HDUES');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_serial_hostel_dues_trigger
  BEFORE INSERT ON public.hostel_dues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_serial_hostel_dues();

-- Updated_at trigger for hostel_dues
CREATE TRIGGER update_hostel_dues_updated_at
  BEFORE UPDATE ON public.hostel_dues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
