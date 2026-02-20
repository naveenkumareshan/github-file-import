
# Fix Network Error: Replace Express API Calls with Lovable Cloud Backend

## Root Cause

Every page you visit after logging in calls the old Express backend at `localhost:5000`, which doesn't exist in the cloud. The login itself works (using Lovable Cloud auth), but once you're inside the admin dashboard, every data widget tries to fetch from `localhost:5000/api/admin/bookings`, `localhost:5000/api/seats`, etc., and gets "Network Error".

This is not just the dashboard — every page in the app has this issue.

## The Strategy

Since the app was previously MongoDB-backed and had complex data (bookings, seats, rooms, hostels, transactions, etc.), the cleanest path is to:

1. **Create all the needed database tables in Lovable Cloud** (bookings, cabins/rooms, seats, transactions, hostels, laundry orders, etc.)
2. **Rewrite the frontend API service files** to call Lovable Cloud directly using the SDK instead of axios → localhost
3. **Update the dashboard components** to use the new services

This will make the entire app work in the cloud with no separate backend needed.

## Database Tables to Create

The following tables will be created to mirror the MongoDB collections:

### Core Tables

| Table | Purpose |
|---|---|
| `cabins` | Reading rooms/cabins with name, category, price, capacity, amenities |
| `seats` | Individual seats inside a cabin with availability, price, position |
| `bookings` | All student bookings (start/end date, seat, price, status) |
| `transactions` | Payment records linked to bookings |
| `hostels` | Hostel properties |
| `hostel_rooms` | Rooms within hostels |
| `hostel_beds` | Individual beds in hostel rooms |
| `hostel_bookings` | Hostel bed/room bookings |
| `laundry_orders` | Laundry service orders |
| `profiles` | Extended user info (name, phone, gender) |
| `locations` | State/city/area data for filtering |
| `coupons` | Discount coupons |

### RLS Policies

- **Students** can only read/create their own bookings and transactions
- **Admins** can read/write everything
- **Vendors** can read cabins and bookings scoped to their vendor ID
- Public can read active cabins, hostels, and seats

## Files to Create/Modify

### 1. Database Migration (NEW)
`supabase/migrations/..._create_core_tables.sql`
- Creates all tables listed above with proper columns, foreign keys, indexes
- Sets up RLS policies for each table
- Adds helper views for dashboard statistics (revenue totals, occupancy rates)

### 2. Replace `src/api/adminBookingsService.ts`
Replace all axios calls to `/admin/bookings/*` with direct Lovable Cloud queries on the `bookings` table.

Key functions to rewrite:
- `getAllBookings()` → `supabase.from('bookings').select(...)` with filters
- `getBookingStats()` → Supabase aggregate queries
- `getTopFillingRooms()` → Join cabins + bookings, count active
- `getExpiringBookings(days)` → Filter bookings where `end_date` is within N days
- `getMonthlyRevenue()` → Group transactions by month
- `getMonthlyOccupancy()` → Group bookings by month
- `getActiveResidents()` → Count active bookings
- `getRevenueByTransaction()` → Sum transaction amounts

### 3. Replace `src/api/adminSeatsService.ts`
Replace seat management calls with Supabase queries on `seats` table.

### 4. Replace `src/api/adminRoomsService.ts`
Replace cabin/room management calls with Supabase queries on `cabins` table.

### 5. Replace `src/api/adminUsersService.ts`
Replace user management calls — query `profiles` and `user_roles` tables.

### 6. Replace `src/api/adminLaundryService.ts`
Replace laundry order calls with Supabase queries on `laundry_orders` table.

### 7. Replace `src/api/hostelService.ts`
Replace hostel API calls with Supabase queries on `hostels` table.

### 8. Replace `src/api/bookingsService.ts`
Replace student-facing booking calls with Supabase queries.

### 9. Update `src/api/axiosConfig.ts`
Keep the file intact (many places import it) but note that going forward the new service files won't use it.

## What the Dashboard Will Show After

The admin dashboard widgets will display:
- **Total Revenue**: Sum from `transactions` table
- **Active Residents**: Count of bookings where `end_date > now()` and `status = 'active'`
- **Seat Availability**: Count of seats where `is_available = true`
- **Pending Payments**: Count/sum of bookings with `payment_status = 'pending'`
- **Monthly Revenue Chart**: Grouped from `transactions` by month
- **Occupancy Chart**: Grouped from `bookings` by month
- **Expiring Bookings**: Bookings where `end_date` is within 7 days

All of these come directly from Lovable Cloud — no Express backend needed.

## Technical Notes

- The new tables will start empty. Dashboard will show zeros/empty states initially, which is correct for a fresh installation. Data can be added through the admin panel.
- All existing frontend components (`DashboardStatistics`, `DynamicStatisticsCards`, `OccupancyChart`, `RevenueChart`, `DashboardExpiringBookings`) will continue to work — only the service layer changes.
- RLS ensures students can't see other students' data, admins see everything.
- A `profiles` table with a trigger will auto-create a profile row whenever a new user signs up.
- The `has_role()` database function already exists from the previous migration and will be reused.

## Scope of This Change

This plan covers making the **admin dashboard** fully functional with real data from Lovable Cloud. The same pattern (replace axios service → Supabase query) will then be applied to all other pages (bookings list, hostel management, seat management, student dashboard, etc.) in subsequent steps.
