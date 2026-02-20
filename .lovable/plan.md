
# Fix: Slow Pages & Network Errors — Full Data Layer Migration to Lovable Cloud

## Root Cause Analysis

The app has **two layers of problems** causing slowness and errors:

**Problem 1 — Every data API call still goes to the dead Express backend (`localhost:5000`).**
- `adminBookingsService.ts` → axios → `localhost:5000/api/admin/bookings` → Network Error
- `adminCabinsService.ts` → axios → `localhost:5000/api/cabins` → Network Error
- `adminSeatsService.ts` → axios → `localhost:5000/api/seats` → Network Error
- `OccupancyChart`, `RevenueChart`, `DashboardExpiringBookings`, `DynamicStatisticsCards` all fail silently or show toast errors
- `SeatTransferManagement` (the current page) — confirmed broken in console logs

**Problem 2 — AuthContext causes double role-fetch on every page load.**
- `onAuthStateChange` fires AND `getSession()` fires → `buildUser()` is called twice → two sequential Supabase queries on every navigation

**Problem 3 — The admin dashboard loads 6 separate API calls in parallel** (stats, residents, top rooms, monthly revenue, monthly occupancy, expiring bookings) — all hitting localhost and all failing.

## What Will Be Fixed

### Database Migration — Core Tables

A single migration will create all the tables needed so the Lovable Cloud backend has real data to serve:

| Table | Maps From | Key Columns |
|---|---|---|
| `profiles` | MongoDB `User` | `user_id`, `name`, `phone`, `gender`, `role` |
| `cabins` | MongoDB `Cabin` | `name`, `category`, `price`, `capacity`, `is_active`, `floors` |
| `seats` | MongoDB `Seat` | `cabin_id`, `number`, `floor`, `price`, `is_available`, `position` |
| `bookings` | MongoDB `Booking` | `user_id`, `cabin_id`, `seat_id`, `start_date`, `end_date`, `status`, `payment_status`, `total_price` |
| `transactions` | MongoDB `Transaction` | `booking_id`, `user_id`, `amount`, `payment_status`, `type` |
| `hostels` | MongoDB `Hostel` | `name`, `location`, `price_per_month`, `is_active` |
| `hostel_rooms` | MongoDB `HostelRoom` | `hostel_id`, `name`, `capacity`, `price` |
| `hostel_beds` | MongoDB `HostelBed` | `room_id`, `bed_number`, `is_available` |
| `hostel_bookings` | MongoDB `HostelBooking` | `user_id`, `hostel_id`, `room_id`, `bed_id`, `status` |
| `laundry_menu_items` | MongoDB `LaundryMenuItem` | `name`, `price`, `icon` |
| `laundry_orders` | MongoDB `LaundryOrder` | `user_id`, `items`, `status`, `total_amount` |
| `locations` | MongoDB `Location` | `state`, `city`, `area` |
| `coupons` | MongoDB `Coupon` | `code`, `discount_type`, `discount_value`, `is_active` |

Plus a `dashboard_stats` database function (RPC) that computes all dashboard numbers in a single query — no more 6 separate calls.

RLS policies will be set on all tables:
- Admins and super_admins: full access via `has_role()` check
- Students: read/write own rows only (`user_id = auth.uid()`)
- Public: read active cabins, hostels, seats

### 1. `src/api/adminBookingsService.ts` — Full Rewrite
Replace ALL axios calls with Supabase queries:
- `getAllBookings(filters)` → `supabase.from('bookings').select(...).range(offset, end)` with pagination
- `getBookingStats()` → `supabase.rpc('get_dashboard_stats')`
- `getRevenueByTransaction()` → `supabase.rpc('get_dashboard_stats')`
- `getTopFillingRooms()` → Supabase join on `cabins` + `bookings` count
- `getExpiringBookings(days)` → `supabase.from('bookings').select(...).lte('end_date', threshold)`
- `getMonthlyRevenue(year)` → `supabase.rpc('get_monthly_revenue', { year })`
- `getMonthlyOccupancy(year)` → `supabase.rpc('get_monthly_occupancy', { year })`
- `getActiveResidents()` → `supabase.rpc('get_dashboard_stats')`
- `updateBooking()`, `cancelBooking()` → `supabase.from('bookings').update(...)`
- `updateTransferBooking()` → Supabase update for seat transfer

### 2. `src/api/adminCabinsService.ts` — Full Rewrite
- `getAllCabins()` → `supabase.from('cabins').select('*')`
- `getCabinById()` → `.eq('id', id).single()`
- `createCabin()` → `.insert(data)`
- `updateCabin()` → `.update(data).eq('id', id)`
- `deleteCabin()` → `.update({ is_active: false }).eq('id', id)` (soft delete)

### 3. `src/api/adminSeatsService.ts` — Full Rewrite
- `getAllSeats()` → `supabase.from('seats').select('*')`
- `getSeatsByCabin(cabinId, floor)` → `.eq('cabin_id', cabinId).eq('floor', floor)`
- `createSeat()`, `updateSeat()`, `deleteSeat()` → Supabase insert/update/delete
- `getActiveSeatsCountSeats()` → `.count()` on seats table

### 4. `src/api/adminRoomsService.ts` — Full Rewrite
Replace all calls to use the `cabins` table (same data, same structure).

### 5. `src/api/adminUsersService.ts` — Full Rewrite
- `getUsers()` → `supabase.from('profiles').select('*, user_roles(role)')`
- `updateUser()` → `supabase.from('profiles').update(data)`
- `getBookingsByUserId()` → `supabase.from('bookings').select(...).eq('user_id', userId)`

### 6. `src/api/adminLaundryService.ts` — Full Rewrite
- `getAllMenuItems()` → `supabase.from('laundry_menu_items').select('*')`
- `getAllOrders()` → `supabase.from('laundry_orders').select('*')`
- `updateOrderStatus()` → `supabase.from('laundry_orders').update(...)`

### 7. `src/api/hostelService.ts` — Full Rewrite
- `getAllHostels()` → `supabase.from('hostels').select('*')`
- `getHostelById()` → `.eq('id', id).single()`

### 8. `src/api/bookingsService.ts` — Full Rewrite (Student facing)
- `getMyBookings()` → `supabase.from('bookings').select('*').eq('user_id', auth.uid())`
- `createBooking()` → `supabase.from('bookings').insert(data)`

### 9. `src/contexts/AuthContext.tsx` — Fix Double Fetch
Current code fires role fetch TWICE on login (once via `onAuthStateChange`, once via `getSession`). Fix: use `onAuthStateChange` only as the source of truth. `getSession` only handles the "no session" case to set loading=false. This eliminates the redundant database call on every page load.

### 10. `src/hooks/use-dashboard-statistics.ts` — Use RPC
Replace 3 separate axios calls with 1 `supabase.rpc('get_dashboard_stats')` call that returns all values in one query. This will make the dashboard load ~3x faster.

## Performance Gains

| Component | Before | After |
|---|---|---|
| Admin Dashboard | 6 failing network calls, infinite spinner | 1 RPC call, data loads in <1s |
| SeatTransferManagement | Network Error, no data | Supabase query, instant load |
| RevenueChart | Network Error, blank | Monthly revenue from DB |
| OccupancyChart | Network Error, blank | Monthly occupancy from DB |
| ProtectedRoute auth check | Sometimes 2x role queries | 1x, cached in context |
| All admin pages | Network Error on every data widget | Real data from Lovable Cloud |

## Files to Create/Modify

| File | Action |
|---|---|
| `supabase/migrations/..._create_core_tables.sql` | CREATE — all tables + RLS + dashboard RPC functions |
| `src/api/adminBookingsService.ts` | REWRITE — Supabase queries |
| `src/api/adminCabinsService.ts` | REWRITE — Supabase queries |
| `src/api/adminSeatsService.ts` | REWRITE — Supabase queries |
| `src/api/adminRoomsService.ts` | REWRITE — Supabase queries |
| `src/api/adminUsersService.ts` | REWRITE — Supabase queries |
| `src/api/adminLaundryService.ts` | REWRITE — Supabase queries |
| `src/api/hostelService.ts` | REWRITE — Supabase queries |
| `src/api/bookingsService.ts` | REWRITE — Supabase queries (student-facing) |
| `src/hooks/use-dashboard-statistics.ts` | UPDATE — use single RPC call |
| `src/contexts/AuthContext.tsx` | FIX — eliminate double role fetch |

## Technical Notes

- All tables start empty — dashboard will show zeros, which is correct for a fresh install. Data is added through the admin UI.
- The `has_role()` function already exists in the database from the previous migration — it will be reused for all RLS policies.
- The `axiosConfig.ts` file is kept as-is (it's still needed for any legacy imports that may not be touched), but no service file will use it after this change.
- Supabase pagination uses `.range()` which correctly handles large datasets without the 1000-row silent truncation issue.
- The `get_dashboard_stats` RPC function runs all aggregations server-side in a single round-trip.
