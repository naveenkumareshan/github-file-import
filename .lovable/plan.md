

## 1. Add "Receipts" Button to Due Management Table + 2. Fix Renew to Show Best Available Dates

### Changes

**1. Due Management -- Add "Receipts" button per row (`src/pages/admin/DueManagement.tsx`)**

- In the Action column (line ~207-212), add a "Receipts" button next to the existing "Collect" button for every due row (regardless of status -- paid or partial)
- Clicking "Receipts" opens a Dialog/Sheet showing all receipts related to that booking (fetched from `receipts` table by `booking_id`)
- Each receipt shows: serial number, amount, payment method, transaction ID, collected by, date, and receipt type (booking_payment or due_collection)
- Both "Paid" and "Partial" status rows get this button so all historical receipts are accessible

**2. Renew Button -- Show booking form with smart date calculation (`src/pages/vendor/VendorSeats.tsx`)**

Current behavior: Renew blocks if booking hasn't expired. This is too restrictive -- partners need to pre-book renewals before expiry.

New behavior when "Renew" is clicked:
- Remove the "cannot renew yet" block. Instead, calculate the next best available start date by checking:
  - Current booking end date
  - All future bookings for this seat
  - Any seat transfers
  - Block history entries
- Find the latest occupied end date and set start date to that + 1 day
- Pre-select the same student (as it does now)
- Open the booking form with these smart dates, allowing the partner to select a plan and confirm with payment
- This makes renewal work exactly like "Book Future" but with the student pre-filled
- The calendar date picker should disable all dates that are already occupied

### Technical Details

| File | Change |
|------|--------|
| `src/pages/admin/DueManagement.tsx` | Add a "Receipts" button in the Action column for each due row. Add a Dialog/Sheet that fetches receipts from `receipts` table by `booking_id` (from `due.booking_id`) and displays them as a list with serial numbers. |
| `src/pages/vendor/VendorSeats.tsx` | Remove the early return that blocks renewal before expiry (lines 904-911). Instead, use the same logic as "Book Future" -- compute latest end date from all bookings and set start to next day. Keep student pre-fill. Both Renew and Book Future now behave identically except Renew pre-selects the student. |

