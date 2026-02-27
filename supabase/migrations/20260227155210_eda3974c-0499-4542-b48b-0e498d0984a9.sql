
ALTER TABLE bookings ADD COLUMN checked_in_at timestamptz DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN checked_in_by uuid DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN check_in_notes text DEFAULT '';

ALTER TABLE hostel_bookings ADD COLUMN checked_in_at timestamptz DEFAULT NULL;
ALTER TABLE hostel_bookings ADD COLUMN checked_in_by uuid DEFAULT NULL;
ALTER TABLE hostel_bookings ADD COLUMN check_in_notes text DEFAULT '';
