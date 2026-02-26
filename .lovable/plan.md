

## Hide Seat Header and Status When Booking Is Confirmed

### Problem
After a booking is confirmed, the top of the sheet still shows "Seat #1 (AC) ₹2000/mo" and the "Available for 26 Feb 2026" status bar. These are unnecessary once the booking is confirmed since all details are already in the confirmation summary below.

### Change

**File: `src/pages/vendor/VendorSeats.tsx`**

Wrap the two header sections (lines 766-782) in a condition so they are hidden when `bookingSuccess` is true:

1. **Seat title line** (Seat #1, AC badge, price) -- hide when `bookingSuccess && lastInvoiceData` is truthy
2. **Status bar** (Available / Booked + date) -- hide when `bookingSuccess && lastInvoiceData` is truthy
3. The separator between them should also be hidden

This keeps the sheet clean after confirmation, showing only the "Booking Confirmed!" card with the invoice details.

### Technical Detail

| Section | Lines | What happens |
|---------|-------|-------------|
| SheetHeader (seat #, badge, price) | 766-772 | Wrap in `{!(bookingSuccess && lastInvoiceData) && (...)}` |
| Separator | 773 | Same condition |
| Status bar (Available/Booked + date) | 776-782 | Same condition |

No other files affected. Single-file, 3-line conditional wrapper change.

