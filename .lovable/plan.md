

## Fix: Beds jumping/reordering after price change or actions

### Root Cause

When a price is saved, bed is blocked/unblocked, or any action triggers `fetchBeds()`, the Supabase query returns beds in an arbitrary order (no `.order()` clause). Since `filteredBeds` also has no sort, the grid re-renders with beds in a different order, causing the visual "disturbance" where a bed appears to jump to the bottom.

### Fix

**File: `src/pages/admin/HostelBedMap.tsx`**

1. **Add stable sorting to `filteredBeds`**: After filtering, sort by `roomNumber` (string, ascending) then `bed_number` (number, ascending). This ensures beds always appear in a consistent R101-B1, R101-B2, R101-B3... order regardless of how the database returns them.

```text
filteredBeds useMemo:
  ... existing filter logic ...
  result.sort((a, b) => {
    const roomCmp = a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    if (roomCmp !== 0) return roomCmp;
    return a.bed_number - b.bed_number;
  });
  return result;
```

2. **Add `.order('bed_number')` to the Supabase query** in `fetchBeds` as a secondary stability measure, so the raw data also arrives in a predictable order.

3. **Fix the "Function components cannot be given refs" warning** by wrapping the `Dialog open={!!editingBedId}` with a conditional render (`editingBedId &&`) so the Dialog only mounts when needed, avoiding the ref issue on initial render.

### Technical Details

- **Line ~188**: Add `.order('bed_number')` to the `hostel_beds` query
- **Line ~328-342**: Add `.sort()` call in the `filteredBeds` useMemo before returning
- **Line ~975**: Change `<Dialog open={!!editingBedId}>` to `{editingBedId && <Dialog open={true}>...}</Dialog>}` pattern

These are minimal, targeted changes that fix the visual instability without altering any business logic.

