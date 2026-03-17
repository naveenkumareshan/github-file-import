
Issue identified: the global utility (`formatCurrency` + `roundPrice`) is already correct, but many screens still bypass it with direct `.toFixed(2)` and `.toLocaleString()`. That is why decimals are still appearing.

Implementation plan:

1) Standardize all money display to one path
- Replace direct currency rendering patterns across the app:
  - `₹{value.toLocaleString(...)}`
  - `₹${value.toFixed(2)}`
  - template strings like ``Pay ₹${amount.toFixed(2)}``
- Use centralized formatter for all money text:
  - `formatCurrency(Number(value) || 0)`
- Keep non-currency decimals unchanged (ratings, percentages).

2) Apply repo-wide currency sweep (all roles/screens)
- Admin + employee-facing:
  - `src/components/admin/*` (statistics cards, revenue reports, ledgers, operations dialogs, calendar dashboards, adjustments, booking transactions)
  - `src/pages/admin/*` (dues, hostel dues, payouts, hostel bed map, etc.)
  - `src/pages/AdminBookings.tsx`
- Partner/vendor-facing:
  - `src/pages/vendor/*` (dashboard, seats, employees)
  - `src/components/vendor/VendorPayouts.tsx`
  - `src/components/hostel-manager/*` and `src/pages/hotelManager/*`
- Student-facing:
  - `src/pages/students/StudentBookingView.tsx`
  - `src/pages/StudentBookingView.tsx`
  - `src/pages/BookingDetail.tsx`
  - `src/pages/StudentDashboard.tsx`
  - `src/components/booking/*` (BookingsList, BookingRenewal, DuePaymentHistory, HostelDuePaymentHistory, BookingTransactionView)
  - `src/components/seats/SeatBookingForm.tsx`
  - `src/components/payment/SplitPaymentCollector.tsx`

3) High-impact direct fixes
- Remove explicit decimal config still forcing fractions:
  - `src/components/admin/reports/RevenueReports.tsx` (`maximumFractionDigits: 2` usage)
- Convert all `toFixed(2)` money lines (currently in student/booking forms/pages) to formatter output.

4) Guardrail verification pass
- Run search checks after edits to ensure no currency decimals remain:
  - `toFixed(2)` in currency contexts
  - `₹{...toLocaleString`
  - ``₹${...toFixed(2)}``
- Leave date/time `toLocaleString` and non-money `toFixed(1)` intact.

5) End-to-end validation checklist
- Admin dashboard/reports: total revenue, avg transaction value, pending payments
- Partner/vendor dashboard + payouts + seats + employee salary screens
- Employee view of dashboard/dues
- Student booking details, payment summary, due pay CTA, receipts
- Confirm all money now renders as nearest whole number, no decimals, with correct signs (+/-) and currency symbol.
