
-- ============================================
-- Partner Settlement & Payout System
-- ============================================

-- 1. partner_payout_settings
CREATE TABLE public.partner_payout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  settlement_cycle text NOT NULL DEFAULT 'monthly',
  custom_cycle_days integer,
  commission_type text NOT NULL DEFAULT 'percentage',
  commission_percentage numeric NOT NULL DEFAULT 10,
  commission_fixed numeric NOT NULL DEFAULT 0,
  commission_on text NOT NULL DEFAULT 'room_rent',
  gateway_charge_mode text NOT NULL DEFAULT 'absorb_platform',
  gateway_split_percentage numeric NOT NULL DEFAULT 50,
  tds_enabled boolean NOT NULL DEFAULT false,
  tds_percentage numeric NOT NULL DEFAULT 0,
  security_hold_enabled boolean NOT NULL DEFAULT false,
  security_hold_percentage numeric NOT NULL DEFAULT 0,
  security_hold_days integer NOT NULL DEFAULT 30,
  minimum_payout_amount numeric NOT NULL DEFAULT 500,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (partner_id)
);

ALTER TABLE public.partner_payout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all payout settings"
  ON public.partner_payout_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view own payout settings"
  ON public.partner_payout_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partners p WHERE p.id = partner_payout_settings.partner_id AND p.user_id = auth.uid()
  ));

CREATE TRIGGER update_partner_payout_settings_updated_at
  BEFORE UPDATE ON public.partner_payout_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. partner_settlements
CREATE TABLE public.partner_settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_bookings integer NOT NULL DEFAULT 0,
  total_collected numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  gateway_fees numeric NOT NULL DEFAULT 0,
  refund_amount numeric NOT NULL DEFAULT 0,
  adjustment_amount numeric NOT NULL DEFAULT 0,
  tds_amount numeric NOT NULL DEFAULT 0,
  security_hold_amount numeric NOT NULL DEFAULT 0,
  net_payable numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  approved_by uuid,
  approved_at timestamptz,
  locked_by uuid,
  locked_at timestamptz,
  payment_reference text DEFAULT '',
  payment_date date,
  utr_number text DEFAULT '',
  payment_mode text,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all settlements"
  ON public.partner_settlements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view own settlements"
  ON public.partner_settlements FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partners p WHERE p.id = partner_settlements.partner_id AND p.user_id = auth.uid()
  ));

-- Serial number trigger for settlements
CREATE OR REPLACE FUNCTION public.set_serial_settlements()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('STLMT');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_serial_settlements_trigger
  BEFORE INSERT ON public.partner_settlements
  FOR EACH ROW EXECUTE FUNCTION public.set_serial_settlements();

CREATE TRIGGER update_partner_settlements_updated_at
  BEFORE UPDATE ON public.partner_settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prevent updates to paid/locked settlements
CREATE OR REPLACE FUNCTION public.prevent_locked_settlement_update()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IN ('paid', 'locked') AND NOT has_role(auth.uid(), 'super_admin'::app_role) THEN
    RAISE EXCEPTION 'Cannot modify a settlement with status: %', OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_locked_settlement_update_trigger
  BEFORE UPDATE ON public.partner_settlements
  FOR EACH ROW EXECUTE FUNCTION public.prevent_locked_settlement_update();

-- 3. settlement_items
CREATE TABLE public.settlement_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES public.partner_settlements(id) ON DELETE CASCADE,
  booking_type text NOT NULL DEFAULT 'reading_room',
  booking_id uuid,
  hostel_booking_id uuid,
  student_name text NOT NULL DEFAULT '',
  property_name text NOT NULL DEFAULT '',
  room_rent numeric NOT NULL DEFAULT 0,
  food_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  gateway_fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all settlement items"
  ON public.settlement_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view own settlement items"
  ON public.settlement_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partner_settlements ps
    JOIN public.partners p ON p.id = ps.partner_id
    WHERE ps.id = settlement_items.settlement_id AND p.user_id = auth.uid()
  ));

-- 4. partner_ledger (immutable - INSERT only for non-admins)
CREATE TABLE public.partner_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  entry_type text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  running_balance numeric NOT NULL DEFAULT 0,
  reference_type text,
  reference_id uuid,
  description text NOT NULL DEFAULT '',
  property_type text NOT NULL DEFAULT 'reading_room',
  property_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all ledger entries"
  ON public.partner_ledger FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view own ledger"
  ON public.partner_ledger FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partners p WHERE p.id = partner_ledger.partner_id AND p.user_id = auth.uid()
  ));

-- 5. adjustment_entries
CREATE TABLE public.adjustment_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  settlement_id uuid REFERENCES public.partner_settlements(id),
  type text NOT NULL DEFAULT 'penalty',
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.adjustment_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all adjustments"
  ON public.adjustment_entries FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view own adjustments"
  ON public.adjustment_entries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partners p WHERE p.id = adjustment_entries.partner_id AND p.user_id = auth.uid()
  ));

-- 6. payout_transactions
CREATE TABLE public.payout_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid NOT NULL REFERENCES public.partner_settlements(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  payment_mode text NOT NULL DEFAULT '',
  utr_number text NOT NULL DEFAULT '',
  payment_reference text NOT NULL DEFAULT '',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'initiated',
  processed_by uuid NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all payout transactions"
  ON public.payout_transactions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view own payout transactions"
  ON public.payout_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partners p WHERE p.id = payout_transactions.partner_id AND p.user_id = auth.uid()
  ));

-- 7. Add settlement columns to bookings and hostel_bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS settlement_status text NOT NULL DEFAULT 'unsettled',
  ADD COLUMN IF NOT EXISTS settlement_id uuid REFERENCES public.partner_settlements(id);

ALTER TABLE public.hostel_bookings
  ADD COLUMN IF NOT EXISTS settlement_status text NOT NULL DEFAULT 'unsettled',
  ADD COLUMN IF NOT EXISTS settlement_id uuid REFERENCES public.partner_settlements(id);
