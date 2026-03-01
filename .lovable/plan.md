

## Rename "Seat" to "Price" in My Bookings Cards

The booking cards currently show "Seat: ₹183" which is confusing, especially for hostel bookings. This will be renamed to "Price:" across the card.

### Changes in `src/components/booking/BookingsList.tsx`

Three label replacements:

1. **Line 239** - Main price display: `Seat: ₹...` → `Price: ₹...`
2. **Line 270** - Info chip: `Seat: ₹...` → `Price: ₹...`

Both occurrences are in the same file, simple text rename with no logic changes.

