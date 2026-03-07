

# Fix: Sort Seats by Cabin Name, Floor, then Seat Number

## Problem
Seats in the grid/table view appear in random order (A1, A3, A2, A3...). They should be sorted consistently: first by cabin name initial, then by floor number, then by seat number.

## Change

### `src/pages/vendor/VendorSeats.tsx` (~line 269)
Add a `.sort()` call at the end of the `filteredSeats` useMemo, before returning:

```typescript
// Sort: cabin name → floor → seat number
result.sort((a, b) => {
  const nameA = (a.cabinName || '').toLowerCase();
  const nameB = (b.cabinName || '').toLowerCase();
  if (nameA !== nameB) return nameA.localeCompare(nameB);
  const floorA = (a as any).floor || 0;
  const floorB = (b as any).floor || 0;
  if (floorA !== floorB) return floorA - floorB;
  return a.number - b.number;
});
return result;
```

This ensures seats always display in order: A1-S1, A1-S2, ... A2-S1, A2-S2, ... A3-S1, etc.

| File | Change |
|------|--------|
| `src/pages/vendor/VendorSeats.tsx` | Add sort to `filteredSeats` by cabin name → floor → seat number |

