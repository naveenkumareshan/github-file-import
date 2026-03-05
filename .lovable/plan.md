

# Fix Payment Methods in Hostels + Date Filters Consistency + Receipt Total Alignment

## Issues

### 1. Hostel receipts: custom payment method labels not shown properly
The hostel `PaymentMethodSelector` already receives `partnerId` and works correctly for **collecting** payments. However, when **displaying** receipts in `HostelReceipts.tsx`, the `resolvePaymentMethodLabels` utility already resolves `custom_<uuid>` labels. This part is working. The real issue is the **HostelReceipts summary section is not responsive** — it uses `flex items-center gap-6` without `flex-wrap`, so on smaller screens totals overflow/misalign (unlike `Receipts.tsx` which uses `flex-wrap`).

### 2. Date filters: Receipts and Bookings pages use raw date inputs instead of `DateFilterSelector`
Currently:
- **Reading Room Receipts** (`Receipts.tsx`): Uses manual `From`/`To` calendar popovers
- **Hostel Receipts** (`HostelReceipts.tsx`): Same manual calendar popovers  
- **Admin Bookings** (`AdminBookingsList.tsx`): Uses raw `<Input type="date">` for From/To
- **Hostel Bookings** (`HostelBookingsList.tsx`): No date filter at all

All should use `DateFilterSelector` with presets (Today, This Week, This Month, etc.) like Business Performance.

## Changes

### 1. `src/pages/admin/HostelReceipts.tsx` — Fix summary alignment + replace date pickers with `DateFilterSelector`
- Change summary div from `flex items-center gap-6` to `flex flex-wrap items-center gap-4 sm:gap-6` (matches `Receipts.tsx`)
- Replace the two `From`/`To` calendar Popovers with `DateFilterSelector` component (compact mode)
- Add `dateFilter` state with date range calculation logic (today, this_week, this_month, etc.)
- Filter receipts using computed date range from `DateFilterSelector`

### 2. `src/pages/admin/Receipts.tsx` — Replace manual date pickers with `DateFilterSelector`
- Replace the two `From`/`To` calendar Popovers with `DateFilterSelector` component (compact mode)
- Add `dateFilter` state with same date range calculation logic
- Remove `fromDate`/`toDate` state, replace with `dateFilter`/`startDate`/`endDate` pattern

### 3. `src/components/admin/AdminBookingsList.tsx` — Replace `<Input type="date">` with `DateFilterSelector`
- Replace the two `<Input type="date">` fields with `DateFilterSelector` (compact mode)
- Convert `filters.startDate`/`filters.endDate` from string to use the `DateFilterSelector` preset pattern
- Keep existing API integration (pass formatted dates to API)

### 4. `src/components/admin/HostelBookingsList.tsx` — Add `DateFilterSelector`
- Add `DateFilterSelector` to filters section
- Implement date range filtering on the client-side filtered bookings

### 5. Date filter utility — Add helper to compute date ranges from preset values
Create a shared utility function `getDateRangeFromFilter(filter: string, customStart?: Date, customEnd?: Date)` that returns `{ from: Date | undefined, to: Date | undefined }` based on preset values (today, yesterday, 7days, this_week, this_month, last_month, this_year, last_year, custom). This avoids duplicating the date calculation logic across 4+ files.

### Files Changed
- `src/utils/dateFilterUtils.ts` — New utility for date range calculation from filter presets
- `src/pages/admin/Receipts.tsx` — Replace manual calendar pickers with `DateFilterSelector`
- `src/pages/admin/HostelReceipts.tsx` — Fix summary alignment + replace calendar pickers with `DateFilterSelector`
- `src/components/admin/AdminBookingsList.tsx` — Replace `<Input type="date">` with `DateFilterSelector`
- `src/components/admin/HostelBookingsList.tsx` — Add `DateFilterSelector` with date range filtering

