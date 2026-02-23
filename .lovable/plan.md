

## Make Admin and Partner Panels Compact and Data-Focused

No changes to the Student Panel. This plan focuses on reducing vertical space, making stat cards compact, collapsing filters into a single row, and pushing tables higher on screen.

---

### 1. Compact Statistics Cards (Admin)

**File: `src/components/admin/DynamicStatisticsCards.tsx`**

- Change grid gap from `gap-6 mb-8` to `gap-3 mb-4`
- Replace `CardHeader` + `CardContent` pattern with a single compact div inside each Card
- Reduce card padding: use `p-3` instead of default `p-6`
- Reduce number font from `text-3xl` to `text-xl`
- Reduce label font from `text-lg` to `text-xs uppercase tracking-wide text-muted-foreground`
- Icon size stays at `h-3.5 w-3.5`
- Remove subtitles (e.g., "today" line) or make them `text-[10px]`
- Card styling: `shadow-none border rounded-lg`

**File: `src/components/admin/StatisticsCards.tsx`**
- Same compact treatment: reduce padding, font sizes, gap, shadows

---

### 2. Compact Statistics Cards (Partner)

**File: `src/pages/vendor/VendorDashboard.tsx`**

- Change stat cards grid gap from `gap-6 mb-8` to `gap-3 mb-4`
- Reduce card padding to `p-3`
- Reduce number font from `text-2xl` to `text-xl`
- Reduce header/title top padding from `py-8` to `py-4`
- Reduce page title from `text-2xl md:text-3xl` to `text-lg font-semibold`
- Reduce subtitle text size
- Compact the Seat Overview and Quick Actions cards: reduce padding, spacing, and gap
- Reduce footer top margin from `mt-12` to `mt-6`

---

### 3. Compact Filters (Admin Bookings)

**File: `src/components/admin/AdminBookingsList.tsx`**

Current filters span 2 rows of grid + a button row (3 vertical sections). Redesign to:
- Remove the Filter card wrapper (CardHeader title "Filters & Export")
- Place all filters in ONE horizontal row using `flex flex-wrap items-center gap-2`
- Remove `<Label>` elements -- use placeholders only
- Reduce input height: add `h-8 text-sm` to all inputs and selects
- Merge export buttons into the filter row with smaller sizing
- Remove the separate "All Bookings" CardHeader -- merge into a single card
- Reduce pagination spacing

---

### 4. Reduce Header and Section Spacing (Admin Dashboard)

**File: `src/pages/AdminDashboard.tsx`**

- Reduce `gap-6` to `gap-3` in main flex container
- Reduce tab content padding from `p-6` to `p-4`

**File: `src/components/admin/DashboardStatistics.tsx`**

- Reduce `space-y-6` to `space-y-3`
- Reduce chart height from `h-[300px]` to `h-[220px]`
- Compact the "Top Filling Reading Rooms" card header

---

### 5. Compact Charts

**File: `src/components/admin/OccupancyChart.tsx`**
- Reduce chart container height from `h-[300px]` to `h-[220px]`
- Reduce card header padding

**File: `src/components/admin/RevenueChart.tsx`**
- Same height reduction to `h-[220px]`
- Reduce card header padding

---

### 6. Compact Expiring Bookings

**File: `src/components/admin/DashboardExpiringBookings.tsx`**
- Reduce item padding from `p-2` to `p-1.5`
- Reduce spacing

---

### Technical Summary

**Files modified (10 files, NO new files):**

| File | Changes |
|---|---|
| `src/components/admin/DynamicStatisticsCards.tsx` | Compact card layout: reduced padding, font sizes, gap |
| `src/components/admin/StatisticsCards.tsx` | Same compact treatment |
| `src/pages/vendor/VendorDashboard.tsx` | Compact stat cards, header, seat overview, quick actions |
| `src/components/admin/AdminBookingsList.tsx` | Single-row filters, no labels, smaller inputs, merged cards |
| `src/pages/AdminDashboard.tsx` | Reduced gap and padding |
| `src/components/admin/DashboardStatistics.tsx` | Reduced spacing, chart heights |
| `src/components/admin/OccupancyChart.tsx` | Reduced chart height |
| `src/components/admin/RevenueChart.tsx` | Reduced chart height |
| `src/components/admin/DashboardExpiringBookings.tsx` | Reduced item padding |
| `src/components/ui/empty-state.tsx` | Reduce padding for compact fit |

**No database changes. No new dependencies. No Student Panel changes.**

