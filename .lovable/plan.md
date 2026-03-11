

# Scope Activity Log to Partner Properties + Enrich with Student & Property Details

## Problem
1. All partners see **all** activity logs across the platform — should only see logs for their own properties
2. Logs lack student info (name, phone, email), property name, floor, and seat details

## Approach

Since `booking_activity_log` only stores `booking_id` and `booking_type`, we need to:

### 1. Database: Add `property_owner_id` column
- Add `property_owner_id uuid` to `booking_activity_log` — populated at insert time
- Update RLS: Partners/employees only see logs where `property_owner_id` matches via `is_partner_or_employee_of()`
- Admins see all logs (via `has_role` check)
- Backfill existing rows by joining through `bookings.cabin_id → cabins.created_by` and `hostel_bookings.hostel_id → hostels.created_by`

### 2. Update `logBookingActivity` service
- Accept optional `propertyOwnerId` param
- When not provided, look it up from the booking's cabin/hostel `created_by`
- Store it in the new column on insert

### 3. Enrich `BookingActivityLog.tsx` display
After fetching logs, do secondary lookups to enrich each row:

- **For cabin logs**: Join `bookings` → `profiles` (student), `cabins` (property name), `seats` (seat number, floor)
- **For hostel logs**: Join `hostel_bookings` → `profiles` (student), `hostels` (property name), `hostel_beds`/`hostel_rooms` (bed/room/floor)

Add these columns to the table:
- **Student Name** — from profiles
- **Phone** — from profiles  
- **Email** — from profiles
- **Property** — cabin name or hostel name
- **Floor & Seat/Bed** — from seats/hostel_beds

### 4. Partner scoping in fetch
- Use `getEffectiveOwnerId()` to detect partner/employee
- Check user roles — if admin/super_admin, fetch all; otherwise filter by `property_owner_id`

### Files Modified
- `supabase/migrations/` — new migration for column + RLS + backfill
- `src/api/bookingActivityLogService.ts` — add `propertyOwnerId` to insert
- `src/pages/admin/BookingActivityLog.tsx` — partner scoping + enriched columns
- Callers of `logBookingActivity` (vendorSeatsService, HostelBedMap, BookingUpdateDatesDialog) — pass `propertyOwnerId`

