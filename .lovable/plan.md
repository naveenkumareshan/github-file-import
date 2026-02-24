

## Reorder Booking Form: Payment Method After Partial Amount

### Current Order (confusing)
1. Seat Amount
2. Locker
3. Partial Payment toggle + details
4. Discount
5. Payment Method + Transaction ID
6. Summary (Total, Advance, Due)
7. Confirm Button

### New Order (clean flow)
1. Seat Amount
2. Locker
3. Discount
4. **Booking Summary** (Seat Amount, Discount, Locker, **Total**)
5. **Partial Payment** toggle + Amount to Collect + Due Date + breakdown
6. **Payment Method** + Transaction ID
7. Collected by
8. **Confirm Button** (shows collecting amount, not total, when partial is ON)

### Changes in `src/pages/vendor/VendorSeats.tsx`

**Move sections around (lines 1037-1167):**

- Move **Discount** (lines 1099-1106) up to right after Locker (after line 1035)
- Move **Booking Summary** (lines 1148-1167) up to right after Discount, but remove the advance/due lines and "collected by" from it -- keep it as just: Seat Amount, Discount, Locker, Total
- Keep **Partial Payment toggle** (lines 1037-1055) after the summary
- Keep **Partial Payment details** (lines 1057-1097) after the toggle
- Move **Payment Method** (lines 1108-1145) after partial payment details
- Add a final line showing "Collected by" and the collecting amount before the button
- **Fix Confirm Button** (line 1174): show advance amount when partial is ON instead of always showing total

### Result
The partner sees a natural top-down flow: price calculation first, then decide partial or full, then pick how to pay, then confirm with the correct amount displayed.
