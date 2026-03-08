

# Backfill Missing Booking IDs in Activity Log

## Problem
7 existing activity log records have `serial_number = NULL` because the serial number wasn't captured before the fix. The booking serial numbers exist in the `bookings` and `hostel_bookings` tables and can be resolved via `booking_id`.

## Solution
Run a one-time SQL migration to update the `booking_activity_log` table, setting `serial_number` from the corresponding booking table based on `booking_type`.

### Database Migration
```sql
UPDATE booking_activity_log bal
SET serial_number = b.serial_number
FROM bookings b
WHERE bal.booking_id = b.id
  AND bal.booking_type = 'cabin'
  AND bal.serial_number IS NULL;

UPDATE booking_activity_log bal
SET serial_number = hb.serial_number
FROM hostel_bookings hb
WHERE bal.booking_id = hb.id
  AND bal.booking_type = 'hostel'
  AND bal.serial_number IS NULL;
```

### Files
- **Migration only** — no code changes needed

