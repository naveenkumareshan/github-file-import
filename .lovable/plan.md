

## Three Changes: Remove Send Link, Show Booking Details, Show Transaction IDs on Receipts

### 1. Remove "Send Link" Payment Method Everywhere

Remove all references to `send_link` as a payment option from both UI and backend logic.

**Files affected:**
- `src/pages/vendor/VendorSeats.tsx` -- Remove the "Send Link" radio option (lines 1463-1468), remove all `send_link` conditional text (lines 486, 500, 502, 516-518, 1500, 1598), default payment method stays `cash`
- `src/api/vendorSeatsService.ts` -- Remove `send_link` -> `pending` status mapping (line 431); without send_link, status will be `completed` or `advance_paid`
- `src/utils/invoiceGenerator.ts` -- Remove `send_link` case from `paymentMethodLabel`
- `src/pages/admin/Receipts.tsx` -- Remove `send_link` case from payment method label (line 139)

### 2. Show Duration, Category, and Time Slot in Booking Info (Partner/Admin Seat Panel)

In the current booking card within the seat details sheet (`VendorSeats.tsx`, lines 1570-1602), add:
- **Duration**: Already shown partially (`b.durationCount + b.bookingDuration`). Will ensure it always displays.
- **Seat Category**: Add `b.seatCategory` display. Need to add `seatCategory` to `SeatBookingDetail` interface and `mapBookingToDetail` in `vendorSeatsService.ts` (from the seat's `category` field via a join or from the booking's seat data).
- **Time Slot**: Add `b.slotName` display. Need to add `slotId`/`slotName` to `SeatBookingDetail` and populate from `cabin_slots` join.

**Files affected:**
- `src/api/vendorSeatsService.ts` -- Add `slotId`, `slotName`, `seatCategory` to `SeatBookingDetail` interface; populate in `mapBookingToDetail` using slot name map and seat category from the joined seat data
- `src/pages/vendor/VendorSeats.tsx` -- Display duration type, seat category badge, and slot name in booking card

### 3. Show Transaction ID / Notes on Every Receipt

Currently `BookingTransactionView.tsx` receipts don't show `transaction_id`. The `ReceiptRow` interface is missing `transaction_id`.

**Files affected:**
- `src/components/booking/BookingTransactionView.tsx` -- Add `transaction_id` to `ReceiptRow` interface; display it in each receipt card (for student-side online payments it shows the Razorpay txn ID; for partner/admin collections it shows the manually entered txn ID or notes/remarks)

### Technical Summary

| File | Changes |
|------|---------|
| `src/pages/vendor/VendorSeats.tsx` | Remove send_link radio + all conditional logic; add category/slot/duration badges in booking card |
| `src/api/vendorSeatsService.ts` | Remove send_link status mapping; add slotId, slotName, seatCategory to SeatBookingDetail + mapBookingToDetail |
| `src/components/booking/BookingTransactionView.tsx` | Add transaction_id to ReceiptRow; render it in receipt cards |
| `src/utils/invoiceGenerator.ts` | Remove send_link case |
| `src/pages/admin/Receipts.tsx` | Remove send_link case |

