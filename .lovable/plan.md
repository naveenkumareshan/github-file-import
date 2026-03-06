

# Plan: SaaS-Style Dashboard Density Refinement

## Problem
The admin dashboard text sizes are too large — headings, card titles, table text, and chart labels need to be tighter and more compact to feel like a modern SaaS analytics dashboard.

## Changes

### 1. `src/pages/AdminDashboard.tsx`
- Reduce header padding from `p-4` to `p-3`
- Title `text-lg` → `text-sm font-semibold`
- Greeting text already `text-xs` — keep as-is
- Tab triggers: `text-sm` → `text-xs`
- Tab content padding: `p-4` → `p-3`

### 2. `src/components/admin/DynamicStatisticsCards.tsx`
- Stat value `text-xl` → `text-lg`
- Label `text-xs` → `text-[11px]`
- Icon container `h-8 w-8` → `h-7 w-7`, icon `h-4 w-4` → `h-3.5 w-3.5`
- Card inner padding `p-3` → `p-2.5`

### 3. `src/components/admin/DashboardStatistics.tsx`
- "Top Filling Reading Rooms" title `text-lg` → `text-sm`
- Table header text: add `text-xs`
- Table cell text: add `text-xs` where missing
- Mobile card text already compact — keep

### 4. `src/components/admin/RevenueChart.tsx`
- Card title already `text-sm` — keep
- Chart height `h-[220px]` → `h-[200px]`

### 5. `src/components/admin/OccupancyChart.tsx`
- Same as RevenueChart — reduce height to `h-[200px]`

### 6. `src/components/admin/DashboardExpiringBookings.tsx`
- Title `text-lg` → `text-sm`
- Student name `font-medium` → `text-xs font-medium`
- Cabin info `text-sm` → `text-xs`
- Badge text: add `text-[10px]`

All changes maintain readability while achieving a tighter, high-density SaaS dashboard feel consistent with the admin panel standardization pattern.

