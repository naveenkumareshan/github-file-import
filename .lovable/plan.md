

## Fix: Add Missing Foreign Keys to Hostel Tables

### Problem

Every hostel page shows the error: **"Could not find a relationship between 'hostel_bookings' and 'user_id' in the schema cache"**

This happens because the hostel tables were created without foreign key constraints. The database needs explicit foreign keys for join queries (like `profiles:user_id(name, email)`) to work.

### Root Cause

The original migration created the hostel tables with the correct columns but did not define `REFERENCES` constraints. Without these, the database cannot resolve relational joins used across all hostel pages.

### Solution

Create a single database migration to add all missing foreign keys across the 4 hostel tables:

**`hostel_bookings`** -- add 5 foreign keys:
- `user_id` -> `profiles(id)`
- `hostel_id` -> `hostels(id)`
- `room_id` -> `hostel_rooms(id)`
- `bed_id` -> `hostel_beds(id)`
- `sharing_option_id` -> `hostel_sharing_options(id)`

**`hostel_receipts`** -- add 3 foreign keys:
- `user_id` -> `profiles(id)`
- `hostel_id` -> `hostels(id)`
- `booking_id` -> `hostel_bookings(id)`

**`hostel_beds`** -- add 2 foreign keys:
- `room_id` -> `hostel_rooms(id)`
- `sharing_option_id` -> `hostel_sharing_options(id)`

**`hostel_rooms`** -- add 1 foreign key:
- `hostel_id` -> `hostels(id)`

**`hostel_sharing_options`** -- add 1 foreign key:
- `room_id` -> `hostel_rooms(id)`

### Impact

This fixes the join error on all hostel pages:
- Hostel Deposits (`/admin/hostel-deposits`)
- Hostel Receipts (`/admin/hostel-receipts`)
- Admin Hostel Bookings
- Hostel Booking Details
- Student Hostel Bookings
- Room occupancy views

No code changes are needed -- only the database migration.

