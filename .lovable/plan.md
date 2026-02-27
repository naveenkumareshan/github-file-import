

## Fix: Calendar Auto-Close, Remove Gender Restriction, and Ensure Proper Booking/Receipt Flow

### Changes

**1. Calendar closes immediately on date selection**

In `src/pages/HostelRoomDetails.tsx`, the date picker Popover needs controlled open/close state. Add a `calendarOpen` state and close it inside `handleCheckInDateChange` when a date is picked.

```text
const [calendarOpen, setCalendarOpen] = useState(false);

handleCheckInDateChange = (date) => {
  if (date) { setCheckInDate(date); setSelectedBed(null); setCalendarOpen(false); }
};

<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
```

**2. Remove gender restriction completely**

In `src/api/hostelBookingService.ts` (lines 40-60), delete the entire gender check block that fetches the hostel gender and compares it to the user profile. This allows anyone to book any hostel regardless of gender.

**3. Ensure proper booking + receipt generation and visibility**

The current `createBooking` in `hostelBookingService.ts` sets `payment_status` to `pending` when no razorpay_payment_id is provided at creation time. After Razorpay payment succeeds, the `razorpay-verify-payment` edge function updates the booking to `completed` (or `advance_paid`) and creates a receipt. This flow is already correct.

However, the booking `status` field stays as `pending` even after payment verification -- the edge function only updates `payment_status`, not `status`. This means "My Bookings" may show bookings as "pending" even after payment.

Fix: Update the `razorpay-verify-payment` edge function to also set `status: 'confirmed'` when payment is verified.

### Files to Change

| File | Change |
|---|---|
| `src/pages/HostelRoomDetails.tsx` | Add `calendarOpen` state; pass `open`/`onOpenChange` to Popover; close on date select |
| `src/api/hostelBookingService.ts` | Remove the gender restriction block (lines 40-60) |
| `supabase/functions/razorpay-verify-payment/index.ts` | Add `status: 'confirmed'` to the update payload alongside `payment_status` |

### Technical Details

- The Popover from Radix supports `open` and `onOpenChange` props for controlled mode
- Removing gender check is a simple deletion of ~20 lines in `createBooking`
- The edge function update needs one extra field in the `updateData` object: `status: 'confirmed'`
- For test mode in the edge function, also add `status: 'confirmed'` to the test mode update

