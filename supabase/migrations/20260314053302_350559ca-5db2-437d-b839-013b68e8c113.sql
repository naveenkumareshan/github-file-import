
-- Property attendance table
CREATE TABLE public.property_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL,
  property_type TEXT NOT NULL,
  seat_or_bed_id UUID,
  booking_id UUID,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, property_id, date)
);

-- Validate property_type
CREATE OR REPLACE FUNCTION public.validate_property_attendance_type()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.property_type NOT IN ('reading_room', 'hostel') THEN
    RAISE EXCEPTION 'Invalid property_type: %', NEW.property_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_property_attendance_type
BEFORE INSERT OR UPDATE ON public.property_attendance
FOR EACH ROW EXECUTE FUNCTION public.validate_property_attendance_type();

-- Serial number
CREATE OR REPLACE FUNCTION public.set_serial_property_attendance()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.serial_number IS NULL THEN
    NEW.serial_number := generate_serial_number('ATND');
  END IF;
  RETURN NEW;
END;
$$;

-- Add serial_number column
ALTER TABLE public.property_attendance ADD COLUMN serial_number TEXT;

CREATE TRIGGER trg_set_serial_property_attendance
BEFORE INSERT ON public.property_attendance
FOR EACH ROW EXECUTE FUNCTION public.set_serial_property_attendance();

-- RLS
ALTER TABLE public.property_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own attendance"
ON public.property_attendance FOR INSERT TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can read own attendance"
ON public.property_attendance FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Admins can read all attendance"
ON public.property_attendance FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Partners can read property attendance"
ON public.property_attendance FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.cabins WHERE id = property_id AND public.is_partner_or_employee_of(created_by)
  )
  OR EXISTS (
    SELECT 1 FROM public.hostels WHERE id = property_id AND public.is_partner_or_employee_of(created_by)
  )
);

-- RPC to mark attendance with validation
CREATE OR REPLACE FUNCTION public.mark_qr_attendance(
  p_property_id UUID,
  p_property_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_name TEXT;
  v_phone TEXT;
  v_seat_or_bed_id UUID;
  v_booking_id UUID;
  v_seat_label TEXT;
  v_existing RECORD;
  v_property_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get student info
  SELECT name, phone INTO v_name, v_phone FROM profiles WHERE id = v_user_id;
  IF v_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Check already marked today
  SELECT id, check_in_time INTO v_existing
  FROM property_attendance
  WHERE student_id = v_user_id AND property_id = p_property_id AND date = CURRENT_DATE;

  IF v_existing.id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'already_marked', true, 'check_in_time', v_existing.check_in_time, 'student_name', v_name, 'phone', v_phone);
  END IF;

  IF p_property_type = 'reading_room' THEN
    -- Get property name
    SELECT name INTO v_property_name FROM cabins WHERE id = p_property_id;
    IF v_property_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Property not found');
    END IF;

    -- Find active booking
    SELECT b.id, b.seat_id, s.number
    INTO v_booking_id, v_seat_or_bed_id, v_seat_label
    FROM bookings b
    LEFT JOIN seats s ON s.id = b.seat_id
    WHERE b.user_id = v_user_id
      AND b.cabin_id = p_property_id
      AND b.payment_status IN ('completed', 'partial')
      AND b.start_date <= CURRENT_DATE
      AND b.end_date >= CURRENT_DATE
    ORDER BY b.created_at DESC
    LIMIT 1;

    IF v_booking_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No active booking found at this property');
    END IF;

  ELSIF p_property_type = 'hostel' THEN
    SELECT name INTO v_property_name FROM hostels WHERE id = p_property_id;
    IF v_property_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Property not found');
    END IF;

    -- Find active hostel booking
    SELECT hb.id, hb.bed_id, CONCAT(hr.room_number, '-B', hbd.bed_number)
    INTO v_booking_id, v_seat_or_bed_id, v_seat_label
    FROM hostel_bookings hb
    LEFT JOIN hostel_beds hbd ON hbd.id = hb.bed_id
    LEFT JOIN hostel_rooms hr ON hr.id = hb.room_id
    WHERE hb.user_id = v_user_id
      AND hb.hostel_id = p_property_id
      AND hb.status IN ('confirmed', 'pending')
      AND hb.start_date <= CURRENT_DATE
      AND hb.end_date >= CURRENT_DATE
    ORDER BY hb.created_at DESC
    LIMIT 1;

    IF v_booking_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No active booking found at this hostel');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid property type');
  END IF;

  -- Check pending dues
  IF p_property_type = 'reading_room' THEN
    IF EXISTS (
      SELECT 1 FROM dues
      WHERE user_id = v_user_id AND cabin_id = p_property_id
        AND status = 'pending' AND due_date < CURRENT_DATE
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You have overdue payments. Please clear your dues first.');
    END IF;
  ELSIF p_property_type = 'hostel' THEN
    IF EXISTS (
      SELECT 1 FROM hostel_dues
      WHERE user_id = v_user_id AND hostel_id = p_property_id
        AND status = 'pending' AND due_date < CURRENT_DATE
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'You have overdue payments. Please clear your dues first.');
    END IF;
  END IF;

  -- Insert attendance
  INSERT INTO property_attendance (student_id, property_id, property_type, seat_or_bed_id, booking_id, date)
  VALUES (v_user_id, p_property_id, p_property_type, v_seat_or_bed_id, v_booking_id, CURRENT_DATE);

  RETURN jsonb_build_object(
    'success', true,
    'already_marked', false,
    'student_name', v_name,
    'phone', v_phone,
    'seat_label', v_seat_label,
    'property_name', v_property_name,
    'check_in_time', now()
  );
END;
$$;
