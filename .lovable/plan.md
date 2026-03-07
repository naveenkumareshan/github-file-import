

# Fix: Sort Seats by Seat Number Then Floor

## Problem
Current sort order is cabin → floor → seat number (A1-S1, A1-S2, A1-S3, A2-S1...). User wants cabin → seat number → floor (A1-S1, A2-S1, A3-S1, A1-S2, A2-S2, A3-S2...) — grouping the same seat number across all floors together.

## Change

### `src/pages/vendor/VendorSeats.tsx` (lines 269-277)
Swap the sort priority — sort by seat number before floor:

```typescript
result.sort((a, b) => {
  const nameA = (a.cabinName || '').toLowerCase();
  const nameB = (b.cabinName || '').toLowerCase();
  if (nameA !== nameB) return nameA.localeCompare(nameB);
  if (a.number !== b.number) return a.number - b.number;
  return ((a as any).floor || 0) - ((b as any).floor || 0);
});
```

This produces: A1-S1, A2-S1, A3-S1, A1-S2, A2-S2, A3-S2, etc.

