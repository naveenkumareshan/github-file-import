

# Plan: Fix Dashboard, Reports & Remove Reports from Employees

## Problems Identified

1. **Reports visible to employees**: The sidebar shows "Reports" to employees with `view_reports` permission, and the dashboard header shows a "Reports" button to all users including employees. Reports should only be visible to partners (vendors) and admins.

2. **BookingReportsPage export button logic bug**: Line `{activeTab === 'transactions' || activeTab === 'revenue' && ...}` has an operator precedence bug — `&&` binds tighter than `||`, so the export button shows incorrectly for transactions tab.

3. **Transaction Reports use external axios API**: `BookingTransactions.tsx` calls `transactionReportsService` which uses axios to hit `localhost:5000` — a non-existent backend. This will always fail. Need to rewrite it to use Supabase data (reuse `adminBookingsService.getAllBookings`).

4. **OccupancyReports returns empty**: `getOccupancyReports` returns `{ success: true, data: [] }` — stub. Need real Supabase implementation.

5. **Revenue Reports ignores date filters**: `getRevenueReport` just calls `getRevenueByTransaction()` which calls `getDashboardStats()` ignoring the date range entirely.

6. **Top Filling Rooms / Monthly Revenue / Monthly Occupancy are stubs**: All return empty arrays.

7. **Dashboard charts show nothing**: `RevenueChart` and `OccupancyChart` depend on stub methods.

8. **ExportReportButton uses axios**: `reportsExportService` hits external API — will always fail.

---

## Changes

### 1. Remove Reports from Employees

**`src/pages/AdminDashboard.tsx`**
- Hide the "Reports" button in header for `vendor_employee` role — only show for `admin` and `vendor`.

**`src/components/admin/AdminSidebar.tsx`**
- Remove the Reports section from the vendor employee menu. Only show if `user?.role === 'vendor'` (not employees).

### 2. Fix BookingReportsPage Export Button

**`src/components/admin/reports/BookingReportsPage.tsx`**
- Fix operator precedence: `{(activeTab === 'transactions' || activeTab === 'revenue') && <ExportReportButton .../>}`

### 3. Rewrite Transaction Reports to Use Supabase

**`src/components/admin/reports/BookingTransactions.tsx`**
- Replace `transactionReportsService.getTransactionReports` with `adminBookingsService.getAllBookings` (which already queries Supabase with filters, pagination, search).
- Map the returned data fields to match the table columns (user name, cabin name, seat number, amount, status, date).
- Remove export buttons for now (the external export endpoints don't exist) or implement client-side Excel export using the `exceljs` package already installed.

### 4. Implement Real Occupancy Reports

**`src/api/adminBookingsService.ts`**
- Implement `getOccupancyReports`: Query `cabins` with their `seats` count, then count active `bookings` (where `end_date >= today` and `payment_status = 'completed'`) per cabin to calculate real occupancy rates.
- Implement `getTopFillingRooms`: Same logic, sorted by occupancy rate descending, limited to top 10.

### 5. Implement Real Revenue Data for Reports & Charts

**`src/api/adminBookingsService.ts`**
- Implement `getRevenueReport(filters)`: Query `bookings` with date range filters, sum `total_price` where `payment_status = 'completed'`, count bookings.
- Implement `getMonthlyRevenue`: Query completed bookings grouped by month (using JS aggregation since Supabase doesn't support GROUP BY in client SDK).
- Implement `getMonthlyOccupancy`: Calculate monthly occupancy trends from bookings data.

### 6. Fix Export to Use Client-Side Generation

**`src/components/admin/reports/ExportReportButton.tsx`**
- Replace external API export with client-side Excel generation using `exceljs` (already installed). Generate a workbook from the currently displayed data and trigger download.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/AdminDashboard.tsx` | Hide Reports button from employees |
| `src/components/admin/AdminSidebar.tsx` | Remove Reports menu from employees |
| `src/api/adminBookingsService.ts` | Implement real occupancy, revenue, top rooms, monthly data |
| `src/components/admin/reports/BookingReportsPage.tsx` | Fix export button operator precedence |
| `src/components/admin/reports/BookingTransactions.tsx` | Rewrite to use Supabase via adminBookingsService |
| `src/components/admin/reports/ExportReportButton.tsx` | Client-side Excel export using exceljs |
| `src/components/admin/reports/OccupancyReports.tsx` | Remove mock data fallback, use real data |

