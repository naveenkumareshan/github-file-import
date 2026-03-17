

## Performance Optimization Plan

### Root Causes Identified

**1. Admin Dashboard — Redundant API calls (biggest issue)**
The admin dashboard makes the same `get_dashboard_stats` RPC call **3 times** on load:
- `useDashboardStatistics` hook calls `getDashboardStats()`
- `DynamicStatisticsCards` calls `getActiveResidents()` which internally calls `getDashboardStats()` again
- Various wrappers like `getBookingStats()` and `getRevenueByTransaction()` also call `getDashboardStats()`

Additionally, the dashboard loads **5 independent data sources** sequentially via separate `useRef(false)` guards:
- Dashboard stats RPC (x2-3 duplicate)
- Top filling rooms (3 sequential queries: cabins → seats → bookings)
- Monthly revenue (full bookings table scan)
- Monthly occupancy (full bookings table scan)
- Expiring bookings

**2. Student Dashboard — Sequential waterfall**
`fetchBookingData` runs `getCurrentBookings()` → `getBookingHistory()` → `getUserReviewsForBookings()` sequentially. Plus `fetchStudentDues` and `fetchLaundryOrders` fire separately. Each `getCurrentBookings` and `getBookingHistory` call `supabase.auth.getUser()` individually (extra round trip each).

**3. Auth double-resolution**
Many service methods call `supabase.auth.getUser()` internally, even though the auth context already has the user. This adds an extra network call per service invocation.

---

### Implementation Plan

#### Task 1: Deduplicate admin dashboard stats calls
- **`DynamicStatisticsCards.tsx`**: Remove the separate `getActiveResidents()` call. Instead, pass `statistics` from the parent `useDashboardStatistics` hook down as props. The RPC already returns `active_residents` and `total_capacity`.
- **`DashboardStatistics.tsx`**: Compute `partnerUserId` and pass it to both `useDashboardStatistics(partnerUserId)` and child components. Pass the stats data down to `DynamicStatisticsCards` as props instead of letting it fetch independently.

#### Task 2: Parallelize admin dashboard data fetching
- **`DashboardStatistics.tsx`**: Fetch `topFillingRooms`, `monthlyRevenue`, `monthlyOccupancy`, and `expiringBookings` in a single `Promise.all()` instead of having 4 separate `useEffect` hooks in 4 separate components.
- Create a single `useAdminDashboardData(partnerUserId)` hook that returns all dashboard data from one coordinated fetch, replacing the scattered `useRef(false)` pattern across `DashboardStatistics`, `RevenueChart`, `OccupancyChart`, and `DashboardExpiringBookings`.
- Each child component receives data as props instead of fetching independently.

#### Task 3: Parallelize student dashboard fetches
- **`StudentDashboard.tsx`**: Run `getCurrentBookings()`, `getBookingHistory()`, and `fetchStudentDues()` in `Promise.all()` instead of sequentially.
- Remove the mock `fetchLaundryOrders()` call (it uses fake data and adds unnecessary state/render cycles).

#### Task 4: Eliminate redundant `supabase.auth.getUser()` calls
- **`bookingsService.ts`**: Accept `userId` as a parameter in `getCurrentBookings(userId)` and `getBookingHistory(userId)` instead of calling `supabase.auth.getUser()` internally. The caller (StudentDashboard) already has the user from `useAuth()`.
- This removes 2 extra network round trips per student dashboard load.

#### Task 5: Cache admin service results
- Add a simple in-memory cache to `getDashboardStats` so that multiple callers within the same render cycle share one RPC result (deduplication at the service layer as a safety net).

---

### Expected Impact
- Admin dashboard: ~6-8 network calls reduced to ~3 (1 RPC + top rooms + expiring bookings, with revenue/occupancy in parallel)
- Student dashboard: ~5 sequential calls reduced to ~3 parallel calls, minus 2 `getUser()` round trips
- Partner dashboard: Already lightweight (1 WhatsApp click count call), no major changes needed

### Files to Modify
- `src/hooks/use-dashboard-statistics.ts` — expose raw stats for child components
- `src/components/admin/DashboardStatistics.tsx` — single coordinated fetch, pass data down
- `src/components/admin/DynamicStatisticsCards.tsx` — receive stats as props
- `src/components/admin/RevenueChart.tsx` — receive data as props
- `src/components/admin/OccupancyChart.tsx` — receive data as props
- `src/components/admin/DashboardExpiringBookings.tsx` — receive data as props
- `src/pages/StudentDashboard.tsx` — parallelize fetches
- `src/api/bookingsService.ts` — accept userId param
- `src/api/adminBookingsService.ts` — add dedup cache for getDashboardStats

