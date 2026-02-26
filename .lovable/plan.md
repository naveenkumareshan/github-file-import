

## Redesign Student Booking Details Page

### Overview
Completely rewrite the `StudentBookingView` page and its embedded `BookingTransactionView` to show only student-relevant information in a clean, collapsible, mobile-first layout. Remove all admin/internal fields (name, email, student ID, discount, admin notes, internal calculations).

### Changes

**1. `src/pages/students/StudentBookingView.tsx` -- Full redesign**

The page will fetch the booking data (already includes `cabins(...)` join) plus the seat price, receipts, and dues in a single load. The layout will be:

**Header**: Gradient header with Back button, "Booking Details" title, serial number, and auto-calculated payment status badge.

**Body** (collapsible sections using Radix Collapsible):

- **Booking Info** (default open)
  - Reading Room Name
  - Seat Number  
  - Booking ID (serial_number)
  - Check-in / Check-out dates
  - Duration (e.g. "1 month(s)")
  - Booking Created Date

- **Validity** (default open)
  - End Date
  - Days Left = `differenceInDays(endDate, today)` (can be negative)
  - Warning badge if Days Left <= 5: amber "Expiring Soon"
  - If Days Left <= 0: red "Expired" badge

- **Payment Summary** (default open)
  - Seat Price (from `seats` table join or booking `total_price - locker_price`)
  - Locker: shown only if `locker_included = true`, value = `locker_price`
  - Total Price
  - Total Paid (sum of all receipts for this booking)
  - Due Remaining = Total Price - Total Paid
  - Payment Status: auto-calculated:
    - Due Remaining = 0 -> "Completed" (green)
    - Due Remaining > 0 and not expired -> "Partial" (amber)  
    - Due Remaining > 0 and expired -> "Overdue" (red)
  - **"Pay Due ₹{amount}" button** if Due Remaining > 0 (navigates to payment or shows info)

- **Payment Receipts** (collapsible, default closed)
  - List of receipt cards from `receipts` table (same compact format as current)

**2. `src/api/bookingsService.ts` -- Enhance `getBookingById`**

Add `seats(price, number, category)` to the select join so we can show seat price separately.

**3. `src/components/booking/BookingTransactionView.tsx` -- No changes needed**

This component will no longer be used from StudentBookingView. It remains for admin/vendor use.

### Technical Details

**Data fetching in StudentBookingView:**
```typescript
// Single booking fetch with seat price
const { data } = await supabase
  .from('bookings')
  .select('*, cabins(name), seats:seat_id(price, number, category)')
  .eq('id', bookingId)
  .single();

// Receipts
const { data: receipts } = await supabase
  .from('receipts')
  .select('*')
  .eq('booking_id', bookingId)
  .order('created_at', { ascending: false });

// Due info
const { data: due } = await supabase
  .from('dues')
  .select('*')
  .eq('booking_id', bookingId)
  .maybeSingle();
```

**Payment status auto-calculation:**
```typescript
const totalPaid = receipts.reduce((s, r) => s + Number(r.amount), 0);
const dueRemaining = Math.max(0, totalPrice - totalPaid);
const daysLeft = differenceInDays(new Date(endDate), new Date());
const paymentStatus = dueRemaining === 0 ? 'Completed' 
  : daysLeft <= 0 ? 'Overdue' : 'Partial';
```

**Collapsible sections** using existing `@radix-ui/react-collapsible` (already installed).

**"Pay Due" button**: Will navigate to the existing Razorpay checkout flow or display a toast with instructions to contact the reading room.

### Files to Modify
- `src/pages/students/StudentBookingView.tsx` -- Complete rewrite
- `src/api/bookingsService.ts` -- Add seats join to `getBookingById`

