

## Hostel Booking: Remove Contact, Add Review & Pay Step with T&C and Advance Payment

### What Changes

**1. Remove partner contact details from student view (HostelRoomDetails.tsx)**
- Remove the phone number and email display from the "Details & Amenities" section (lines 332-344)
- Partner contact info will only be shown after a successful booking/payment (on the confirmation page)

**2. Merge booking flow into HostelRoomDetails.tsx (eliminate separate HostelBooking page)**
After a package is selected (Step 4), add a new **Step 5: Review & Pay** section directly on the same page -- exactly like the reading room's `SeatBookingForm` pattern. This replaces navigating to a separate `HostelBooking.tsx` page.

**Step 5: Review & Pay** will include:
- **Booking summary card**: Hostel name, room number, bed number, sharing type, check-in/check-out dates, duration
- **Price breakdown**: Base price, package discount, total amount, security deposit info
- **Advance payment option** (only if `hostel.advance_booking_enabled` is true): Checkbox "Book with advance payment" showing pay-now amount, remaining due, and due date
- **Terms & Conditions**: Collapsible rules section + checkbox "I agree to the terms and conditions"
- **Pay button**: "Confirm & Proceed to Payment" or "Pay Rs X Advance" -- disabled until T&C checkbox is checked

**3. Create default packages for daily and weekly duration types**
Currently, only monthly packages exist. When a student selects "Daily" or "Weekly" and no packages exist for that duration type, the system will show a fallback "Base" package automatically in `StayDurationPackages.tsx` so there's always at least one option.

### Files to Change

| File | Action | Description |
|---|---|---|
| `src/pages/HostelRoomDetails.tsx` | Edit | Remove contact details from hero; add Step 5 "Review & Pay" with summary, advance payment checkbox, T&C checkbox, and payment button; integrate Razorpay payment logic from HostelBooking.tsx; remove "Book Now" navigation |
| `src/components/hostels/StayDurationPackages.tsx` | Edit | Add fallback "Base" package when no packages exist for the selected duration type |
| `src/pages/HostelBooking.tsx` | Keep (legacy) | Keep as fallback but primary flow now lives in HostelRoomDetails |

### Detailed Step 5 Layout

```text
Step 5: Review & Pay
+----------------------------------+
| Booking Summary                  |
| Hostel: [Name]                   |
| Room: [Number] | Bed: [Number]   |
| Sharing: [Type] | Category: [X]  |
| Check-in: [Date]                 |
| Check-out: [Date]                |
| Duration: [X] months             |
|----------------------------------|
| Price Breakdown                  |
| Base Price: Rs X × Y months      |
| Package Discount: -Z%            |
| ─────────────────────            |
| Total Amount: Rs XXXX            |
| Security Deposit: Rs XXX (info)  |
|----------------------------------|
| [ ] Book with advance payment    |  <- only if advance enabled
|   Pay now: Rs XXX                |
|   Remaining due: Rs XXX          |
|   Due by: DD MMM YYYY            |
|----------------------------------|
| [Hostel Rules - collapsible]     |
| [x] I agree to T&C              |
|----------------------------------|
| [Confirm & Proceed to Payment]   |  <- disabled until T&C checked
+----------------------------------+
```

### Technical Notes

- Payment logic (Razorpay script loading, order creation, verification) moves from `HostelBooking.tsx` into `HostelRoomDetails.tsx`
- The `useAuth` hook provides user info for prefill
- Advance payment calculation reuses the existing `hostel.advance_booking_enabled`, `advance_percentage`, `advance_use_flat`, `advance_flat_amount` fields
- The sticky bottom bar is removed -- replaced by the inline Step 5 pay button
- `StayDurationPackages` will generate a synthetic "Base" package with 0% discount when the API returns empty results for a duration type, ensuring students can always proceed
- Authentication check: if user not logged in when clicking pay, redirect to login with return path

