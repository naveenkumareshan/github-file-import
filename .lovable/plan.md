

## Fix Hostel Admin Pages -- Missing Routes and Legacy Data Patterns

### Issues Found

1. **Missing routes**: `/admin/hostel-deposits` and `/admin/hostel-receipts` are linked in the sidebar but have no routes or pages in `App.tsx`
2. **AdminHostelBookings page uses legacy MongoDB patterns**: Still references `response.success`, `booking._id`, `booking.bookingId`, `booking.userId?.name`, `booking.hostelId?.name`, `booking.bedId?.roomNumber` -- none of which exist in the cloud database schema
3. **Duplicate booking methods**: Both `hostelService.getAllBookings()` and `hostelBookingService.getAllBookings()` exist -- the page uses the former (which also returns data directly, not wrapped in `{success, data}`)

### Changes

#### 1. Create `src/pages/admin/HostelReceipts.tsx` (new file)

A receipts management page for hostel bookings, mirroring the existing reading room Receipts page pattern:
- Query `hostel_receipts` with joins to `hostels(name)`, `hostel_bookings(serial_number)`, `profiles:user_id(name, email, phone)`
- Table columns: Receipt #, Booking #, Student, Hostel, Amount, Payment Method, Type, Date
- Filter by receipt type (booking_payment / due_collection / deposit_refund)
- Search by student name or receipt serial number

#### 2. Create `src/pages/admin/HostelDeposits.tsx` (new file)

A security deposit management page for hostel bookings:
- Query `hostel_bookings` where `security_deposit > 0`
- Show booking serial, student name, hostel name, deposit amount, booking status
- Actions: mark deposit as refunded (creates a `hostel_receipts` entry with `receipt_type = 'deposit_refund'`)

#### 3. Rewire `AdminHostelBookings.tsx` to cloud database

Replace all legacy MongoDB field references:

| Legacy field | Cloud DB field |
|---|---|
| `response.success` / `response.data` | Direct data return (service throws on error) |
| `booking._id` | `booking.id` |
| `booking.bookingId` | `booking.serial_number` |
| `booking.userId?.name` | `booking.profiles?.name` |
| `booking.userId?.email` | `booking.profiles?.email` |
| `booking.hostelId?.name` | `booking.hostels?.name` |
| `booking.bedId?.roomNumber` | `booking.hostel_rooms?.room_number` |
| `booking.bedId?.number` | `booking.hostel_beds?.bed_number` |
| `booking.months` | `booking.duration_count` with `booking.booking_duration` label |
| `booking.paymentStatus` | `booking.payment_status` |
| `booking.startDate` | `booking.start_date` |

Switch from `hostelService.getAllBookings()` to `hostelBookingService.getAllBookings()` for the canonical cloud DB service.

#### 4. Register missing routes in `App.tsx`

Add two new routes inside the admin route group:
```
hostel-receipts -> HostelReceipts
hostel-deposits -> HostelDeposits
```

### Files Changed

| File | Action |
|---|---|
| `src/pages/admin/HostelReceipts.tsx` | New -- hostel receipts list page |
| `src/pages/admin/HostelDeposits.tsx` | New -- hostel deposit management page |
| `src/pages/hotelManager/AdminHostelBookings.tsx` | Rewire to cloud DB field names |
| `src/App.tsx` | Add hostel-receipts and hostel-deposits routes |

