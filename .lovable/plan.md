

## Fix View Details & Renew Booking Alignment

### Issues Found

1. **Renew Booking button styling mismatch**: In `BookingsList.tsx`, the "View Details" button uses `w-full h-8 text-[12px] rounded-xl gap-1`, but the "Renew Booking" button inside `BookingRenewal.tsx` uses its own styling (`flex items-center gap-1` without matching height, text size, or rounded corners). This causes visual misalignment.

2. **BookingTransactionView is desktop-heavy inside mobile view**: The `BookingTransactionView` component uses full `Card > CardHeader > CardTitle` patterns with desktop grids (`grid-cols-4`), large headers (`h-5 w-5` icons, `text-lg` text), and `Table` components. When embedded inside the compact `StudentBookingView`, this creates an oversized, misaligned look.

### Plan

#### File 1: `src/components/booking/BookingRenewal.tsx` (line ~443-450)
- Update the trigger button to match "View Details" style: `w-full h-8 text-[12px] rounded-xl gap-1`
- This ensures both buttons in the action row look identical in size and shape

#### File 2: `src/components/booking/BookingTransactionView.tsx` (lines 148-400+)
- Redesign all sections to use compact mobile-friendly styling:
  - Replace `Card > CardHeader > CardTitle` with simple headings (`text-[13px] font-semibold`)
  - Change the Booking Summary grid from `grid-cols-4` to a vertical list with small text
  - Simplify the Validity Information section to a compact inline row
  - Replace the full `Table` in Transaction History with compact stacked cards
  - Reduce the Payment Summary to smaller text with tighter spacing
  - Use `text-[11px]` to `text-[13px]` sizing throughout, matching the app's mobile design language

These two file changes will make both buttons properly aligned and the View Details page compact and consistent with the rest of the mobile app.
