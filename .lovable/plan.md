

# Plan: Delete All Seats + Remove Aisle/Spacing from Generator

## Changes

### 1. Add "Delete All Seats" button (`FloorPlanDesigner.tsx`)
- Add a "Delete All" button in the toolbar (next to Reset Layout), shown when seats exist
- On click, show a confirmation dialog, then call a new `onDeleteAllSeats` prop
- Add `onDeleteAllSeats?: () => Promise<void>` to the props interface

### 2. Add bulk delete handler (`SeatManagement.tsx`)
- Add `handleDeleteAllSeats` that deletes all seats on the current floor by calling `supabase.from('seats').delete().eq('cabin_id', id).eq('floor', selectedFloor)` via a new `adminSeatsService.deleteAllSeatsByCabin` method
- After deletion, clear the local `seats` state and `selectedSeat`
- Pass as `onDeleteAllSeats` prop to `FloorPlanDesigner`

### 3. Add `deleteAllSeatsByCabin` to `adminSeatsService.ts`
- New method: delete all seats matching `cabin_id` and `floor`

### 4. Remove aisle and spacing from `AutoSeatGenerator.tsx`
- Remove the "Aisle after X Seats" and "Seat Spacing" input fields
- Use a fixed tight spacing: `SEAT_W + 4` horizontally, `SEAT_H + 4` vertically (continuous arrangement with no gaps)
- Remove the `aisleAfter` and `spacing` state variables
- Seats will be arranged continuously in rows without any aisle breaks

## Files to Change

| File | Change |
|------|--------|
| `src/api/adminSeatsService.ts` | Add `deleteAllSeatsByCabin(cabinId, floor)` method |
| `src/components/seats/AutoSeatGenerator.tsx` | Remove aisle/spacing fields, use tight continuous layout |
| `src/components/seats/FloorPlanDesigner.tsx` | Add "Delete All" button with confirmation, add `onDeleteAllSeats` prop |
| `src/pages/SeatManagement.tsx` | Add `handleDeleteAllSeats` handler, pass to designer |

