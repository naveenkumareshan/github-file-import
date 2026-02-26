

## Compact Booking Detail Page + Invoice Download

### Problem
The booking detail page currently uses large card titles, `text-lg` / `text-2xl` fonts, heavy padding, and multiple separated cards — making it impossible to screenshot in one page. There is also no invoice download option, even though `src/utils/invoiceGenerator.ts` already exists.

### Changes to `src/pages/AdminBookingDetail.tsx`

#### 1. Compact Layout (single-page fit)
- Page title: `text-lg` instead of `text-2xl`, reduce top margin
- Remove individual `<Card>` wrappers — use a single card with sections separated by thin dividers
- All labels: `text-[11px]` uppercase muted
- All values: `text-xs` or `text-sm` font-medium
- Payment Summary grid values: `text-sm font-semibold` instead of `text-lg`
- Receipts table: `text-[11px]` cells, `py-1.5` padding
- Remove extra `<Separator>` gaps, use `space-y-3` instead of `space-y-6`
- Set `max-w-2xl` instead of `max-w-3xl`

#### 2. Add "Download Invoice" Button
- Import `downloadInvoice` and `InvoiceData` from `@/utils/invoiceGenerator`
- Add a `Download Invoice` button in the page header (next to Back button)
- Map the booking data to the `InvoiceData` interface:
  - `serialNumber` from `booking.serialNumber || booking.bookingId`
  - `studentName/Email/Phone` from `booking.userId` object
  - `cabinName` from `booking.cabinId?.name`
  - `seatNumber` from `booking.seatId?.number`
  - Payment fields from the booking + dues data
- Opens a print-ready invoice in a new tab

#### 3. Section Structure (all within one card)
```text
+------------------------------------------+
| < Back   Booking Details   [InvoiceBtn] |
+------------------------------------------+
| STUDENT: Name | Email | Student ID       |
|------------------------------------------|
| BOOKING: ID | Status | Created           |
|          Check-in | Check-out            |
|          Room | Seat                      |
|------------------------------------------|
| PAYMENT SUMMARY (3x3 compact grid)       |
|  Seat | Locker | Discount                |
|  Total | Advance | Due Collected          |
|  Collected | Remaining | Status           |
|------------------------------------------|
| RECEIPTS TABLE (compact rows)            |
|  Receipt ID | Type | Amt | Method | ...  |
|  ... | Total Collected row                |
+------------------------------------------+
```

### Files Changed

| File | Change |
|------|--------|
| `src/pages/AdminBookingDetail.tsx` | Compact all text/spacing, merge into single card, add Download Invoice button using existing `invoiceGenerator` utility |

