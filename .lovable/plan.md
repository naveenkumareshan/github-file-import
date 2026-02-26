

## Two-Step Booking Flow + Partial Payment Validation

### What Changes

**1. Partial Payment Amount Cannot Exceed Total**
- Currently, the "Amount to Collect" input in partial payment mode accepts any value. If the partner enters more than the total, it gets silently clamped via `Math.min` but the input still shows the higher number, which is confusing.
- Fix: Validate the input so it cannot exceed `computedTotal`. Show a warning if they try. Also, when collecting full amount (not partial), the booking should be fully confirmed for the entire period (this already works -- just ensure the UI is clear).

**2. Two-Step Booking: "Book Seat" Button First, Then Payment Confirmation**
- Current flow: All details (student, plan, dates, summary, payment method) are shown together with one "Confirm Booking" button at the bottom.
- New flow:
  - **Step 1**: Partner fills student, plan, dates, summary (locker, discount, partial payment). A **"Book Seat"** button appears at the bottom.
  - **Step 2**: When "Book Seat" is clicked, a **confirmation section** appears showing all final details in a read-only summary, followed by payment method selection. Partner selects payment method and clicks **"Confirm Booking"** to finalize.

### Technical Details

**File: `src/pages/vendor/VendorSeats.tsx`**

1. **Add a new state variable**: `bookingStep` (`'details' | 'confirm'`), default `'details'`.

2. **Partial payment validation** (lines ~1073-1079):
   - On the "Amount to Collect" input, add `max={computedTotal}` and an `onChange` handler that clamps the value to `computedTotal`.
   - Show a small red text if the entered amount exceeds the total: "Cannot exceed ₹{computedTotal}".

3. **Step 1 (Details)** (lines ~965-1066):
   - Keep the current form fields (student, plan, dates, summary card with locker/discount, partial payment toggle and config).
   - Replace the current "Confirm Booking" button with a **"Book Seat"** button that sets `bookingStep = 'confirm'` (validates student is selected first).

4. **Step 2 (Confirmation)** (new section after the details):
   - Show when `bookingStep === 'confirm'`.
   - Display a read-only summary card:
     - Student name, phone
     - Seat number, cabin name
     - Dates (start - end)
     - Seat amount, locker, discount, total
     - If partial: advance amount, due balance, valid until
   - Below the summary: payment method radio group (moved here from Step 1)
   - Transaction ID input (if UPI/Bank)
   - Collected by line
   - "Confirm Booking" button (the actual submit) + "Back" button to return to Step 1

5. **Reset `bookingStep` to `'details'`** when:
   - A different seat is selected
   - Sheet is closed
   - Booking succeeds

