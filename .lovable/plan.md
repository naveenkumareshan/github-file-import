

## Show Due Payment Receipts Across All Sides (Student, Partner, Admin)

### Problem
Due payments are collected and stored in the `due_payments` table, but the receipts are never displayed anywhere. Students, partners, and admins cannot see a history of partial or full due collections.

### Changes

**1. Due Management Page (Admin/Partner) -- `src/pages/admin/DueManagement.tsx`**

- Add a "Payment History" section inside the Collect Payment drawer, below the collect form
- When a due is selected, fetch its `due_payments` using `vendorSeatsService.getDuePayments(dueId)`
- Display each payment as a mini receipt card showing: amount, payment method, transaction ID, collected by, date, and notes
- This appears in the same Sheet that currently shows the collect form

**2. Vendor Seats Booking Card (Partner) -- `src/pages/vendor/VendorSeats.tsx`**

- Below each booking card that has `advance_paid` status, after the due button and inline collect form, add a collapsible "Payment History" section
- Fetch `due_payments` for each booking's due record
- Display each receipt: amount, method, txn ID, collected by, date
- Show this even after full payment so partner can see all receipts

**3. Student Booking View -- `src/components/booking/BookingTransactionView.tsx`**

- Add a new "Due Payments" section after the existing Transactions section
- Fetch student's dues using `vendorSeatsService.getStudentDues()` and filter by bookingId
- For each due, fetch payments via `vendorSeatsService.getDuePayments(dueId)`
- Display each payment receipt card: amount, method, date, collected by
- Also show a summary: Total Fee, Advance Paid, Collected, Remaining

**4. Student Dashboard Dues Overview -- `src/pages/students/StudentBookingView.tsx`**

- In the booking detail page, show due status and payment history if a due exists for this booking
- Add a "Due & Payments" card showing: Total Fee, Advance, Collected, Remaining, and list of payment receipts

---

### Technical Details

| File | Change |
|------|--------|
| `src/pages/admin/DueManagement.tsx` | Add `useEffect` to fetch `getDuePayments(selectedDue.id)` when drawer opens; render payment history list below collect form |
| `src/pages/vendor/VendorSeats.tsx` | For each booking with a due, add expandable payment history; fetch `getDuePayments` when due is loaded |
| `src/components/booking/BookingTransactionView.tsx` | Import `vendorSeatsService`; add new section to fetch and display due + due_payments for the booking |
| `src/pages/students/StudentBookingView.tsx` | Add due info card with payment history |

### Receipt Card Format (consistent across all views)

```text
₹500 . Cash                    26 Feb 2026
Collected by: Admin User
Txn ID: UPI123456
Notes: Partial payment received
```

### No Database Changes Needed
All data already exists in the `due_payments` table. The `getDuePayments` and `getStudentDues` API methods already exist in `vendorSeatsService.ts`. We just need to call them and render the results.
