
-- 1. Create attendance_pins table
CREATE TABLE public.attendance_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('reading_room', 'hostel', 'mess')),
  pin_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, property_type)
);

ALTER TABLE public.attendance_pins ENABLE ROW LEVEL SECURITY;

-- RLS: allow authenticated users to select/insert (partner check done in RPC)
CREATE POLICY "Authenticated users can read attendance pins"
  ON public.attendance_pins FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert attendance pins"
  ON public.attendance_pins FOR INSERT TO authenticated
  WITH CHECK (true);

-- 2. generate_attendance_pin RPC
CREATE OR REPLACE FUNCTION public.generate_attendance_pin(p_property_id UUID, p_property_type TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_secret TEXT;
  v_epoch BIGINT;
  v_interval BIGINT;
  v_pin INTEGER;
  v_seconds_remaining INTEGER;
BEGIN
  -- Get or create secret
  SELECT pin_secret INTO v_secret
  FROM attendance_pins
  WHERE property_id = p_property_id AND property_type = p_property_type;

  IF v_secret IS NULL THEN
    INSERT INTO attendance_pins (property_id, property_type)
    VALUES (p_property_id, p_property_type)
    ON CONFLICT (property_id, property_type) DO NOTHING
    RETURNING pin_secret INTO v_secret;

    IF v_secret IS NULL THEN
      SELECT pin_secret INTO v_secret
      FROM attendance_pins
      WHERE property_id = p_property_id AND property_type = p_property_type;
    END IF;
  END IF;

  v_epoch := EXTRACT(EPOCH FROM now())::BIGINT;
  v_interval := v_epoch / 60;
  v_pin := abs(('x' || substr(encode(hmac(v_interval::text, v_secret, 'sha256'), 'hex'), 1, 8))::bit(32)::int) % 10000;
  v_seconds_remaining := 60 - (v_epoch % 60);

  RETURN jsonb_build_object(
    'pin', lpad(v_pin::text, 4, '0'),
    'seconds_remaining', v_seconds_remaining
  );
END;
$$;

-- 3. mark_pin_attendance RPC (skips due check - that's the point)
CREATE OR REPLACE FUNCTION public.mark_pin_attendance(p_property_id UUID, p_property_type TEXT, p_pin TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_secret TEXT;
  v_epoch BIGINT;
  v_interval BIGINT;
  v_current_pin TEXT;
  v_prev_pin TEXT;
  v_name TEXT;
  v_phone TEXT;
  v_seat_or_bed_id UUID;
  v_booking_id UUID;
  v_seat_label TEXT;
  v_existing RECORD;
  v_property_name TEXT;
  v_meal_type TEXT;
  v_sub_id UUID;
  v_current_time TIME;
  v_booking_start DATE;
  v_booking_end DATE;
  v_booking_duration TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate PIN
  SELECT pin_secret INTO v_secret
  FROM attendance_pins
  WHERE property_id = p_property_id AND property_type = p_property_type;

  IF v_secret IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN. Please contact staff.');
  END IF;

  v_epoch := EXTRACT(EPOCH FROM now())::BIGINT;
  v_interval := v_epoch / 60;
  v_current_pin := lpad((abs(('x' || substr(encode(hmac(v_interval::text, v_secret, 'sha256'), 'hex'), 1, 8))::bit(32)::int) % 10000)::text, 4, '0');
  v_prev_pin := lpad((abs(('x' || substr(encode(hmac((v_interval - 1)::text, v_secret, 'sha256'), 'hex'), 1, 8))::bit(32)::int) % 10000)::text, 4, '0');

  IF p_pin != v_current_pin AND p_pin != v_prev_pin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired PIN. Please get a new PIN from staff.');
  END IF;

  SELECT name, phone INTO v_name, v_phone FROM profiles WHERE id = v_user_id;
  IF v_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF p_property_type = 'reading_room' THEN
    SELECT name INTO v_property_name FROM cabins WHERE id = p_property_id;
    IF v_property_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Property not found');
    END IF;

    SELECT id, check_in_time INTO v_existing
    FROM property_attendance
    WHERE student_id = v_user_id AND property_id = p_property_id AND date = CURRENT_DATE;
    IF v_existing.id IS NOT NULL THEN
      SELECT b.start_date, b.end_date, b.booking_duration, s.number
      INTO v_booking_start, v_booking_end, v_booking_duration, v_seat_label
      FROM bookings b LEFT JOIN seats s ON s.id = b.seat_id
      WHERE b.user_id = v_user_id AND b.cabin_id = p_property_id
        AND b.payment_status IN ('completed', 'partial')
        AND b.start_date <= CURRENT_DATE AND b.end_date >= CURRENT_DATE
      ORDER BY b.created_at DESC LIMIT 1;
      RETURN jsonb_build_object('success', true, 'already_marked', true, 'check_in_time', v_existing.check_in_time, 'student_name', v_name, 'phone', v_phone, 'property_name', v_property_name, 'seat_label', CASE WHEN v_seat_label IS NOT NULL THEN 'Seat ' || v_seat_label ELSE NULL END, 'booking_start_date', v_booking_start, 'booking_end_date', v_booking_end, 'booking_duration', v_booking_duration);
    END IF;

    SELECT b.id, b.seat_id, s.number, b.start_date, b.end_date, b.booking_duration
    INTO v_booking_id, v_seat_or_bed_id, v_seat_label, v_booking_start, v_booking_end, v_booking_duration
    FROM bookings b LEFT JOIN seats s ON s.id = b.seat_id
    WHERE b.user_id = v_user_id AND b.cabin_id = p_property_id
      AND b.payment_status IN ('completed', 'partial')
      AND b.start_date <= CURRENT_DATE AND b.end_date >= CURRENT_DATE
    ORDER BY b.created_at DESC LIMIT 1;

    IF v_booking_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No active booking found at this property');
    END IF;

    -- NO due check here - PIN overrides it

    INSERT INTO property_attendance (student_id, property_id, property_type, seat_or_bed_id, booking_id, date)
    VALUES (v_user_id, p_property_id, p_property_type, v_seat_or_bed_id, v_booking_id, CURRENT_DATE);

    RETURN jsonb_build_object('success', true, 'already_marked', false, 'student_name', v_name, 'phone', v_phone, 'seat_label', CASE WHEN v_seat_label IS NOT NULL THEN 'Seat ' || v_seat_label ELSE NULL END, 'property_name', v_property_name, 'check_in_time', now(), 'booking_start_date', v_booking_start, 'booking_end_date', v_booking_end, 'booking_duration', v_booking_duration);

  ELSIF p_property_type = 'hostel' THEN
    SELECT name INTO v_property_name FROM hostels WHERE id = p_property_id;
    IF v_property_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Property not found');
    END IF;

    SELECT id, check_in_time INTO v_existing
    FROM property_attendance
    WHERE student_id = v_user_id AND property_id = p_property_id AND date = CURRENT_DATE;
    IF v_existing.id IS NOT NULL THEN
      SELECT hb.start_date, hb.end_date, hb.booking_duration, CONCAT(hr.room_number, '-B', hbd.bed_number)
      INTO v_booking_start, v_booking_end, v_booking_duration, v_seat_label
      FROM hostel_bookings hb
      LEFT JOIN hostel_beds hbd ON hbd.id = hb.bed_id
      LEFT JOIN hostel_rooms hr ON hr.id = hb.room_id
      WHERE hb.user_id = v_user_id AND hb.hostel_id = p_property_id
        AND hb.status IN ('confirmed', 'pending')
        AND hb.start_date <= CURRENT_DATE AND hb.end_date >= CURRENT_DATE
      ORDER BY hb.created_at DESC LIMIT 1;
      RETURN jsonb_build_object('success', true, 'already_marked', true, 'check_in_time', v_existing.check_in_time, 'student_name', v_name, 'phone', v_phone, 'property_name', v_property_name, 'seat_label', v_seat_label, 'booking_start_date', v_booking_start, 'booking_end_date', v_booking_end, 'booking_duration', v_booking_duration);
    END IF;

    SELECT hb.id, hb.bed_id, CONCAT(hr.room_number, '-B', hbd.bed_number), hb.start_date, hb.end_date, hb.booking_duration
    INTO v_booking_id, v_seat_or_bed_id, v_seat_label, v_booking_start, v_booking_end, v_booking_duration
    FROM hostel_bookings hb
    LEFT JOIN hostel_beds hbd ON hbd.id = hb.bed_id
    LEFT JOIN hostel_rooms hr ON hr.id = hb.room_id
    WHERE hb.user_id = v_user_id AND hb.hostel_id = p_property_id
      AND hb.status IN ('confirmed', 'pending')
      AND hb.start_date <= CURRENT_DATE AND hb.end_date >= CURRENT_DATE
    ORDER BY hb.created_at DESC LIMIT 1;

    IF v_booking_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No active booking found at this hostel');
    END IF;

    -- NO due check here - PIN overrides it

    INSERT INTO property_attendance (student_id, property_id, property_type, seat_or_bed_id, booking_id, date)
    VALUES (v_user_id, p_property_id, p_property_type, v_seat_or_bed_id, v_booking_id, CURRENT_DATE);

    RETURN jsonb_build_object('success', true, 'already_marked', false, 'student_name', v_name, 'phone', v_phone, 'seat_label', v_seat_label, 'property_name', v_property_name, 'check_in_time', now(), 'booking_start_date', v_booking_start, 'booking_end_date', v_booking_end, 'booking_duration', v_booking_duration);

  ELSIF p_property_type = 'mess' THEN
    SELECT name INTO v_property_name FROM mess_partners WHERE id = p_property_id;
    IF v_property_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Mess not found');
    END IF;

    SELECT id, start_date, end_date INTO v_sub_id, v_booking_start, v_booking_end
    FROM mess_subscriptions
    WHERE user_id = v_user_id AND mess_id = p_property_id
      AND status = 'active'
      AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
    ORDER BY created_at DESC LIMIT 1;

    IF v_sub_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No active mess subscription found');
    END IF;

    v_current_time := (now() AT TIME ZONE 'Asia/Kolkata')::time;
    v_meal_type := NULL;
    SELECT meal_type INTO v_meal_type FROM mess_meal_timings
    WHERE mess_id = p_property_id AND v_current_time >= start_time::time AND v_current_time <= end_time::time
    ORDER BY start_time LIMIT 1;

    IF v_meal_type IS NULL THEN
      IF EXTRACT(HOUR FROM now() AT TIME ZONE 'Asia/Kolkata') < 11 THEN v_meal_type := 'breakfast';
      ELSIF EXTRACT(HOUR FROM now() AT TIME ZONE 'Asia/Kolkata') < 16 THEN v_meal_type := 'lunch';
      ELSE v_meal_type := 'dinner';
      END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM mess_attendance WHERE user_id = v_user_id AND mess_id = p_property_id AND date = CURRENT_DATE AND meal_type = v_meal_type) THEN
      RETURN jsonb_build_object('success', true, 'already_marked', true, 'student_name', v_name, 'phone', v_phone, 'meal_type', v_meal_type, 'property_name', v_property_name, 'booking_start_date', v_booking_start, 'booking_end_date', v_booking_end);
    END IF;

    INSERT INTO mess_attendance (user_id, mess_id, subscription_id, date, meal_type, status, marked_at)
    VALUES (v_user_id, p_property_id, v_sub_id, CURRENT_DATE, v_meal_type, 'consumed', now());

    INSERT INTO property_attendance (student_id, property_id, property_type, booking_id, date)
    VALUES (v_user_id, p_property_id, 'mess', v_sub_id, CURRENT_DATE)
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('success', true, 'already_marked', false, 'student_name', v_name, 'phone', v_phone, 'meal_type', v_meal_type, 'property_name', v_property_name, 'check_in_time', now(), 'booking_start_date', v_booking_start, 'booking_end_date', v_booking_end);
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid property type');
  END IF;
END;
$$;

-- 4. Update mark_qr_attendance to change the dues error message
CREATE OR REPLACE FUNCTION public.mark_qr_attendance(p_property_id uuid, p_property_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_name TEXT;
  v_phone TEXT;
  v_seat_or_bed_id UUID;
  v_booking_id UUID;
  v_seat_label TEXT;
  v_existing RECORD;
  v_property_name TEXT;
  v_meal_type TEXT;
  v_sub_id UUID;
  v_current_time TIME;
  v_booking_start DATE;
  v_booking_end DATE;
  v_booking_duration TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT name, phone INTO v_name, v_phone FROM profiles WHERE id = v_user_id;
  IF v_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF p_property_type = 'reading_room' THEN
    SELECT name INTO v_property_name FROM cabins WHERE id = p_property_id;
    IF v_property_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Property not found');
    END IF;

    SELECT id, check_in_time INTO v_existing
    FROM property_attendance
    WHERE student_id = v_user_id AND property_id = p_property_id AND date = CURRENT_DATE;
    IF v_existing.id IS NOT NULL THEN
      SELECT b.start_date, b.end_date, b.booking_duration, b.seat_id, s.number
      INTO v_booking_start, v_booking_end, v_booking_duration, v_seat_or_bed_id, v_seat_label
      FROM bookings b LEFT JOIN seats s ON s.id = b.seat_id
      WHERE b.user_id = v_user_id AND b.cabin_id = p_property_id
        AND b.payment_status IN ('completed', 'partial')
        AND b.start_date <= CURRENT_DATE AND b.end_date >= CURRENT_DATE
      ORDER BY b.created_at DESC LIMIT 1;

      RETURN jsonb_build_object('success', true, 'already_marked', true, 'check_in_time', v_existing.check_in_time, 'student_name', v_name, 'phone', v_phone, 'property_name', v_property_name, 'seat_label', CASE WHEN v_seat_label IS NOT NULL THEN 'Seat ' || v_seat_label ELSE NULL END, 'booking_start_date', v_booking_start, 'booking_end_date', v_booking_end, 'booking_duration', v_booking_duration);
    END IF;

    SELECT b.id, b.seat_id, s.number, b.start_date, b.end_date, b.booking_duration
    INTO v_booking_id, v_seat_or_bed_id, v_seat_label, v_booking_start, v_booking_end, v_booking_duration
    FROM bookings b LEFT JOIN seats s ON s.id = b.seat_id
    WHERE b.user_id = v_user_id AND b.cabin_id = p_property_id
      AND b.payment_status IN ('completed', 'partial')
      AND b.start_date <= CURRENT_DATE AND b.end_date >= CURRENT_DATE
    ORDER BY b.created_at DESC LIMIT 1;

    IF v_booking_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No active booking found at this property');
    END IF;

    IF EXISTS (SELECT 1 FROM dues WHERE user_id = v_user_id AND cabin_id = p_property_id AND status = 'pending' AND due_date < CURRENT_DATE) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Fee due pending. Please get the entry PIN from staff to mark attendance.', 'needs_pin', true, 'property_id', p_property_id, 'property_type', p_property_type);
    END IF;

    INSERT INTO property_attendance (student_id, property_id, property_type, seat_or_bed_id, booking_id, date)
    VALUES (v_user_id, p_property_id, p_property_type, v_seat_or_bed_id, v_booking_id, CURRENT_DATE);

    RETURN jsonb_build_object(
      'success', true, 'already_marked', false,
      'student_name', v_name, 'phone', v_phone,
      'seat_label', CASE WHEN v_seat_label IS NOT NULL THEN 'Seat ' || v_seat_label ELSE NULL END,
      'property_name', v_property_name,
      'check_in_time', now(),
      'booking_start_date', v_booking_start,
      'booking_end_date', v_booking_end,
      'booking_duration', v_booking_duration
    );

  ELSIF p_property_type = 'hostel' THEN
    SELECT name INTO v_property_name FROM hostels WHERE id = p_property_id;
    IF v_property_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Property not found');
    END IF;

    SELECT id, check_in_time INTO v_existing
    FROM property_attendance
    WHERE student_id = v_user_id AND property_id = p_property_id AND date = CURRENT_DATE;
    IF v_existing.id IS NOT NULL THEN
      SELECT hb.start_date, hb.end_date, hb.booking_duration, CONCAT(hr.room_number, '-B', hbd.bed_number)
      INTO v_booking_start, v_booking_end, v_booking_duration, v_seat_label
      FROM hostel_bookings hb
      LEFT JOIN hostel_beds hbd ON hbd.id = hb.bed_id
      LEFT JOIN hostel_rooms hr ON hr.id = hb.room_id
      WHERE hb.user_id = v_user_id AND hb.hostel_id = p_property_id
        AND hb.status IN ('confirmed', 'pending')
        AND hb.start_date <= CURRENT_DATE AND hb.end_date >= CURRENT_DATE
      ORDER BY hb.created_at DESC LIMIT 1;

      RETURN jsonb_build_object('success', true, 'already_marked', true, 'check_in_time', v_existing.check_in_time, 'student_name', v_name, 'phone', v_phone, 'property_name', v_property_name, 'seat_label', v_seat_label, 'booking_start_date', v_booking_start, 'booking_end_date', v_booking_end, 'booking_duration', v_booking_duration);
    END IF;

    SELECT hb.id, hb.bed_id, CONCAT(hr.room_number, '-B', hbd.bed_number), hb.start_date, hb.end_date, hb.booking_duration
    INTO v_booking_id, v_seat_or_bed_id, v_seat_label, v_booking_start, v_booking_end, v_booking_duration
    FROM hostel_bookings hb
    LEFT JOIN hostel_beds hbd ON hbd.id = hb.bed_id
    LEFT JOIN hostel_rooms hr ON hr.id = hb.room_id
    WHERE hb.user_id = v_user_id AND hb.hostel_id = p_property_id
      AND hb.status IN ('confirmed', 'pending')
      AND hb.start_date <= CURRENT_DATE AND hb.end_date >= CURRENT_DATE
    ORDER BY hb.created_at DESC LIMIT 1;

    IF v_booking_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No active booking found at this hostel');
    END IF;

    IF EXISTS (SELECT 1 FROM hostel_dues WHERE user_id = v_user_id AND hostel_id = p_property_id AND status = 'pending' AND due_date < CURRENT_DATE) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Fee due pending. Please get the entry PIN from staff to mark attendance.', 'needs_pin', true, 'property_id', p_property_id, 'property_type', p_property_type);
    END IF;

    INSERT INTO property_attendance (student_id, property_id, property_type, seat_or_bed_id, booking_id, date)
    VALUES (v_user_id, p_property_id, p_property_type, v_seat_or_bed_id, v_booking_id, CURRENT_DATE);

    RETURN jsonb_build_object(
      'success', true, 'already_marked', false,
      'student_name', v_name, 'phone', v_phone,
      'seat_label', v_seat_label,
      'property_name', v_property_name,
      'check_in_time', now(),
      'booking_start_date', v_booking_start,
      'booking_end_date', v_booking_end,
      'booking_duration', v_booking_duration
    );

  ELSIF p_property_type = 'mess' THEN
    SELECT name INTO v_property_name FROM mess_partners WHERE id = p_property_id;
    IF v_property_name IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Mess not found');
    END IF;

    SELECT id, start_date, end_date INTO v_sub_id, v_booking_start, v_booking_end
    FROM mess_subscriptions
    WHERE user_id = v_user_id AND mess_id = p_property_id
      AND status = 'active'
      AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
    ORDER BY created_at DESC LIMIT 1;

    IF v_sub_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'No active mess subscription found');
    END IF;

    v_current_time := (now() AT TIME ZONE 'Asia/Kolkata')::time;
    v_meal_type := NULL;

    SELECT meal_type INTO v_meal_type
    FROM mess_meal_timings
    WHERE mess_id = p_property_id
      AND v_current_time >= start_time::time
      AND v_current_time <= end_time::time
    ORDER BY start_time
    LIMIT 1;

    IF v_meal_type IS NULL THEN
      IF EXTRACT(HOUR FROM now() AT TIME ZONE 'Asia/Kolkata') < 11 THEN
        v_meal_type := 'breakfast';
      ELSIF EXTRACT(HOUR FROM now() AT TIME ZONE 'Asia/Kolkata') < 16 THEN
        v_meal_type := 'lunch';
      ELSE
        v_meal_type := 'dinner';
      END IF;
    END IF;

    IF EXISTS (
      SELECT 1 FROM mess_attendance
      WHERE user_id = v_user_id AND mess_id = p_property_id
        AND date = CURRENT_DATE AND meal_type = v_meal_type
    ) THEN
      RETURN jsonb_build_object('success', true, 'already_marked', true, 'student_name', v_name, 'phone', v_phone, 'meal_type', v_meal_type, 'property_name', v_property_name, 'booking_start_date', v_booking_start, 'booking_end_date', v_booking_end);
    END IF;

    INSERT INTO mess_attendance (user_id, mess_id, subscription_id, date, meal_type, status, marked_at)
    VALUES (v_user_id, p_property_id, v_sub_id, CURRENT_DATE, v_meal_type, 'consumed', now());

    INSERT INTO property_attendance (student_id, property_id, property_type, booking_id, date)
    VALUES (v_user_id, p_property_id, 'mess', v_sub_id, CURRENT_DATE)
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
      'success', true, 'already_marked', false,
      'student_name', v_name, 'phone', v_phone,
      'meal_type', v_meal_type,
      'property_name', v_property_name,
      'check_in_time', now(),
      'booking_start_date', v_booking_start,
      'booking_end_date', v_booking_end
    );
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid property type');
  END IF;
END;
$function$;
