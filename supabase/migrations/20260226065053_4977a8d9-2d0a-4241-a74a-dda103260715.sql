
-- Create receipts table
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text,
  booking_id uuid REFERENCES public.bookings(id),
  due_id uuid REFERENCES public.dues(id),
  user_id uuid NOT NULL,
  cabin_id uuid,
  seat_id uuid,
  amount numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  transaction_id text NOT NULL DEFAULT '',
  collected_by uuid,
  collected_by_name text NOT NULL DEFAULT '',
  receipt_type text NOT NULL DEFAULT 'booking_payment',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Serial number trigger
CREATE OR REPLACE FUNCTION public.set_serial_receipts()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('RCPT');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_serial_receipts
BEFORE INSERT ON public.receipts
FOR EACH ROW
EXECUTE FUNCTION public.set_serial_receipts();

-- RLS policies
CREATE POLICY "Admins can manage all receipts"
ON public.receipts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Vendors can manage receipts for own cabins"
ON public.receipts FOR ALL
USING (EXISTS (
  SELECT 1 FROM cabins c WHERE c.id = receipts.cabin_id AND c.created_by = auth.uid()
));

CREATE POLICY "Students can view own receipts"
ON public.receipts FOR SELECT
USING (auth.uid() = user_id);
