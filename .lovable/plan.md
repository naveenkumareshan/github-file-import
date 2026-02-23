

## Fix Admin / Student / Partner Panels: Performance and Error Handling

This plan addresses four areas: replacing technical error messages with clean UI states, fixing infinite/slow loading, clean UI improvements, and stability fixes.

---

### 1. Create a Reusable Empty State Component

Create a new `src/components/ui/empty-state.tsx` component used across all panels for consistent "no data" and "error" states:
- Accepts an icon, title, description, and optional retry button
- Neutral card styling with muted colors (no red error text for data loading failures)
- Used to replace all "Failed to load..." toasts with inline UI

---

### 2. Replace Technical Error Toasts with Clean UI States

**Files affected (~15 files):**

| File | Current Error | New Behavior |
|---|---|---|
| `DynamicStatisticsCards.tsx` | Toast: "Error loading statistics" / "Failed to load dashboard statistics" | Show skeleton cards with subtle "Unable to load" overlay + retry button, no toast |
| `DashboardStatistics.tsx` | Toast: "Failed to load dashboard data" | Show empty state card: "No data available" with retry |
| `DashboardExpiringBookings.tsx` | Toast: "Failed to load expiring bookings" | Show empty state: "No expiring bookings" |
| `VendorApproval.tsx` | Toast: "Failed to fetch Partners" | Show empty state: "No Partners Found" |
| `StudentDashboard.tsx` | Toast: "Failed to load booking data" | Show empty state: "No Bookings Found" |
| `Hostels.tsx` | Toast: "Failed to load hostels" | Show empty state: "No Hostels Available" |
| `HostelManagement.tsx` | Toast: "Failed to load hostels" | Show empty state: "No Hostels Available" |
| `ReviewsManagement.tsx` | Toast: "Failed to load reviews" | Show empty state: "No Reviews Found" |
| `ProfileManagement.tsx` | Toast: "Failed to load profile data" | Show inline message: "Unable to load profile. Please refresh." |
| `StudentBookings.tsx` | Toast: "Failed to fetch your bookings" | Show empty state: "No Bookings Found" |
| `use-dashboard-statistics.ts` | Sets error string that triggers toast | Return error silently, let component handle display |

**Pattern for each file:**
- Remove the `toast({ variant: "destructive" })` call from catch blocks
- Instead, set a local `error` state
- Render the new EmptyState component when error is set, with a "Retry" button
- Keep `console.error` for developer debugging

---

### 3. Fix Panel Header Cross-Labeling

**Problem:** The `AdminLayout.tsx` breadcrumb shows "Admin Panel" even for partner/employee users.

**Already fixed** in previous changes -- the breadcrumb already shows "Admin Panel", "Partner Panel", or "Employee Panel" based on `user.role`. Verify this works correctly.

**Student Dashboard (`StudentDashboard.tsx`):**
- Title already says "Student Dashboard" -- no change needed

**Partner Dashboard (`VendorDashboard.tsx`):**
- Title already says "Partner Dashboard" -- no change needed

**HostDashboard.tsx:**
- Title already says "Partner Dashboard" -- no change needed

---

### 4. Fix Loading States

**A) Replace text "Loading..." with skeleton loaders**

Most components already use `<Skeleton>` (DynamicStatisticsCards, OccupancyChart, RevenueChart, DashboardExpiringBookings). The following need skeletons added:

| File | Current | Fix |
|---|---|---|
| `StudentDashboard.tsx` line 345-347 | Spinner div | Replace with skeleton cards matching the layout |
| `VendorApproval.tsx` | Table loading state | Add skeleton table rows |
| `AdminBookingsList.tsx` | Check current loading state | Add skeleton rows if missing |

**B) Add loading timeout (5 seconds)**

Create a custom hook `src/hooks/use-loading-timeout.ts`:
- Wraps a loading state
- After 5 seconds of continuous loading, sets a `timedOut` flag
- Components can then show "Unable to load data. Please retry." with a retry button

Apply this hook to:
- `DynamicStatisticsCards.tsx`
- `DashboardStatistics.tsx`
- `StudentDashboard.tsx`
- `VendorApproval.tsx`

**C) Prevent duplicate API calls**

Already partially implemented with `hasFetchedRef` pattern in:
- `DashboardStatistics.tsx`
- `DynamicStatisticsCards.tsx`
- `RevenueChart.tsx`
- `DashboardExpiringBookings.tsx`

Verify and add to any remaining components that don't have it.

---

### 5. Clean UI Improvements

**A) Empty state cards design:**
- Icon (from Lucide) in muted color
- Title in `text-sm font-medium`
- Description in `text-xs text-muted-foreground`
- Optional retry `Button variant="outline" size="sm"`
- Card background: `bg-muted/20` with subtle border

**B) Remove red error text:**
- All "destructive" toasts for data loading failures get removed
- Keep "destructive" toasts only for user-initiated action failures (e.g., "Failed to delete", "Failed to update")
- Action failures can still show toasts since the user explicitly triggered them

---

### 6. Stability Fixes

**A) Error Boundary improvements (`ErrorBoundary.tsx`):**
- Already implemented, no changes needed
- Already wraps StudentDashboard

**B) Add ErrorBoundary wrapping to:**
- `DashboardStatistics` component
- `DynamicStatisticsCards` component
- `VendorApproval` component
- Each chart component individually (so one chart failing doesn't break the whole dashboard)

**C) Fix console warnings:**
- The ResponsiveContainer warnings in recharts are caused by fixed-width parent containers
- Fix by removing explicit width/height props from chart containers or ensuring parent containers are fluid

---

### Technical Details

**New files to create:**
1. `src/components/ui/empty-state.tsx` -- Reusable empty/error state component
2. `src/hooks/use-loading-timeout.ts` -- Loading timeout hook

**Files to edit (~20 files):**
1. `src/components/admin/DynamicStatisticsCards.tsx` -- Remove error toast, add timeout, add inline error state
2. `src/hooks/use-dashboard-statistics.ts` -- Remove error toast trigger, keep error state
3. `src/components/admin/DashboardStatistics.tsx` -- Remove error toast, add empty state, wrap sub-components in ErrorBoundary
4. `src/components/admin/DashboardExpiringBookings.tsx` -- Remove error toast, use empty state
5. `src/components/admin/OccupancyChart.tsx` -- Add empty state for no data, wrap in ErrorBoundary
6. `src/components/admin/RevenueChart.tsx` -- Add empty state for no data, wrap in ErrorBoundary
7. `src/components/admin/VendorApproval.tsx` -- Remove error toast, use empty state with "No Partners Found"
8. `src/pages/StudentDashboard.tsx` -- Remove error toast, add skeleton loaders, add timeout
9. `src/pages/Hostels.tsx` -- Remove error toast, use empty state "No Hostels Available"
10. `src/pages/hotelManager/HostelManagement.tsx` -- Remove error toast, use empty state
11. `src/pages/admin/ReviewsManagement.tsx` -- Remove error toast, use empty state
12. `src/pages/StudentBookings.tsx` -- Remove error toast, use empty state
13. `src/components/profile/ProfileManagement.tsx` -- Replace load-error toast with inline message
14. `src/pages/AdminDashboard.tsx` -- Wrap content in ErrorBoundary
15. `src/components/admin/AdminBookingsList.tsx` -- Add skeleton loading, remove error toasts for data fetch

**No database changes required.**

