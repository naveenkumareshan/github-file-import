

## Show Booking Details as Popup Instead of Navigation

Replace the current "View Details" navigation with an inline dialog/popup that displays booking information and attached documents.

### Changes

**New file: `src/components/admin/operations/CheckInViewDetailsDialog.tsx`**

A dialog component that shows:
- Student name, phone, email
- Room/Seat (reading room) or Hostel/Bed (hostel)
- Start date, end date, booking duration
- Payment status, total price, payment method, transaction ID
- Serial number
- Check-in notes (if any)
- Attached documents list with download buttons (from `check_in_documents` JSONB)

**Modified file: `src/components/admin/operations/CheckInTracker.tsx`**

- Remove `useNavigate` import (no longer needed)
- Remove the `navigate()` call in `handleViewDetails`
- Instead, set a `viewBooking` state and open a `CheckInViewDetailsDialog`
- Pass the full booking object and module type to the dialog

### Dialog Layout

```text
+----------------------------------+
| Booking Details            [X]   |
+----------------------------------+
| Student: John Doe                |
| Phone: 9876543210                |
| Email: john@example.com         |
|                                  |
| Room / Seat: Room A / Seat #12  |
| Duration: monthly (1)           |
| Start: 28 Feb 2026              |
| End: 28 Mar 2026                |
|                                  |
| Payment: completed              |
| Amount: 5000                     |
| Method: online                   |
| Transaction: TXN123             |
|                                  |
| --- Documents (2) ---           |
| [icon] aadhar.pdf    [download] |
| [icon] form.pdf      [download] |
+----------------------------------+
|                        [Close]   |
+----------------------------------+
```

### Technical Details

- The booking data is already fetched with joins (profiles, cabins/hostels, seats/beds), so no additional queries needed
- Documents are read from `booking.check_in_documents` JSONB array
- Download uses `supabase.storage.from('checkin-documents').createSignedUrl()` (same as upload dialog)
- Dialog uses `ScrollArea` for overflow if content is long
