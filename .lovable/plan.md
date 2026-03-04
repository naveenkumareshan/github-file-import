

# Fix: Floor Selection in Seat Map (VendorSeats)

## Root Cause

The `cabins.floors` JSONB field stores an array of **objects** (e.g., `[{name: "Floor 1", image: "..."}, {name: "Floor 2"}]`), not simple numbers. The current code does `String(f)` which produces `"[object Object]"` for every floor — so all floors get the same select value and filtering breaks.

Additionally, seats have a numeric `floor` field (1, 2, 3...) which needs to be matched against the floor index/number, not the object.

## Changes

### `src/pages/vendor/VendorSeats.tsx`

**Fix `availableFloors` memo** (lines 198-207):
- When `cabin.floors` is an array of objects, map them to `{ label, value }` pairs where `value` is the floor number (1-indexed) and `label` is `f.name || "Floor N"`
- Fallback: derive from seat floor numbers as before, but also produce `{ label, value }` pairs

**Fix floor selector rendering** (lines 724-728):
- Use `floor.value` as the SelectItem value
- Use `floor.label` as the display text

**Fix filter comparison** (line 218):
- Compare `String(s.floor) === selectedFloor` — already correct once values are proper numbers

This is a focused fix in one file — approximately 15 lines changed.

