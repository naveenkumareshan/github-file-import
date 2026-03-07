

# Fix: Always Include Reading Room Initial in Seat Labels

## Problem
When a specific Reading Room is selected, seat labels show `F1-S1` instead of `A1-S1` (with the cabin's first letter). The user wants the format to **always** be `{CabinInitial}{Floor}-S{Number}`, regardless of whether "All" or a specific room is selected.

## Change

### `src/pages/vendor/VendorSeats.tsx` (line 248-253)
Update the `seatLabel` function to always include the cabin name initial:

```typescript
const seatLabel = useCallback((seat: VendorSeat) => {
  const initial = seat.cabinName?.charAt(0)?.toUpperCase() || '?';
  return `${initial}${(seat as any).floor}-S${seat.number}`;
}, []);
```

This removes the conditional that was stripping the initial when a single cabin was selected. Labels will always be like `A1-S1`, `A2-S3`, etc.

