
-- Phase 1a: Add advance booking columns to cabins
ALTER TABLE public.cabins
  ADD COLUMN IF NOT EXISTS advance_booking_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_percentage numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS advance_flat_amount numeric,
  ADD COLUMN IF NOT EXISTS advance_use_flat boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS advance_validity_days integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS advance_auto_cancel boolean NOT NULL DEFAULT true;

-- Phase 1b: Create dues table
CREATE TABLE public.dues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id uuid NOT NULL,
  cabin_id uuid REFERENCES public.cabins(id) ON DELETE SET NULL,
  seat_id uuid REFERENCES public.seats(id) ON DELETE SET NULL,
  total_fee numeric NOT NULL DEFAULT 0,
  advance_paid numeric NOT NULL DEFAULT 0,
  due_amount numeric NOT NULL DEFAULT 0,
  due_date date NOT NULL,
  paid_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  proportional_end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Phase 1c: Create due_payments table
CREATE TABLE public.due_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  due_id uuid NOT NULL REFERENCES public.dues(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  transaction_id text NOT NULL DEFAULT '',
  collected_by uuid,
  collected_by_name text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Phase 1d: Serial number trigger for dues
CREATE OR REPLACE FUNCTION public.set_serial_dues()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('DUES');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_serial_dues
  BEFORE INSERT ON public.dues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_serial_dues();

-- Updated_at trigger for dues
CREATE TRIGGER update_dues_updated_at
  BEFORE UPDATE ON public.dues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 1e: RLS on dues
ALTER TABLE public.dues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own dues"
  ON public.dues FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all dues"
  ON public.dues FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can manage dues for own cabins"
  ON public.dues FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.cabins c
    WHERE c.id = dues.cabin_id AND c.created_by = auth.uid()
  ));

CREATE POLICY "Vendor employees can manage dues for employer cabins"
  ON public.dues FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'vendor_employee'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.cabins c
      WHERE c.id = dues.cabin_id AND c.created_by = auth.uid()
    )
  );

-- RLS on due_payments
ALTER TABLE public.due_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own due payments"
  ON public.due_payments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.dues d
    WHERE d.id = due_payments.due_id AND d.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all due payments"
  ON public.due_payments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can manage due payments for own cabins"
  ON public.due_payments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.dues d
    JOIN public.cabins c ON c.id = d.cabin_id
    WHERE d.id = due_payments.due_id AND c.created_by = auth.uid()
  ));
