

# Add "Room/Flat View" Mode to Hostel Bed Map

## What
Add a third view mode alongside the existing Grid and Table views. This "Room View" groups beds by their room/flat, displaying a room header followed by inline bed cards — making it easy to see which beds belong to which flat.

```text
┌─────────────────────────────────────────────────┐
│ Flat 101                                         │
│ [B1 Avail] [B2 Booked/Name] [B3 Avail] [B4 ..]  │
├─────────────────────────────────────────────────┤
│ Flat 102                                         │
│ [B1 Avail] [B2 Future/Name] [B3 Avail]           │
└─────────────────────────────────────────────────┘
```

## Changes

### `src/pages/admin/HostelBedMap.tsx`

1. **Type**: Change `ViewMode` from `'grid' | 'table'` to `'grid' | 'table' | 'room'`

2. **View toggle buttons** (~line 1215-1222): Add a third button with `Building2` icon for the room view

3. **Room View rendering** (after grid view, before table view ~line 1289): Add a new `viewMode === 'room'` block that:
   - Groups `filteredBeds` by `roomNumber` (preserving sort order)
   - For each room group, renders a header row with the room name + bed count
   - Below the header, renders bed cards in a horizontal flex-wrap layout
   - Each bed card shows: bed number, status color, price, status icon, and student name (same as grid cards but slightly more compact)
   - Clicking a bed card triggers the same `handleBedClick`

